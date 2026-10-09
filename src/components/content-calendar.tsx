import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useGoals, useObjectives, useTasksRange, type Task } from "@/lib/workspace-data";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type Milestone = { id: string; title: string; kind: "goal" | "okr"; date: string };

type Props = {
  ownerId?: string;
  onOpenMilestone?: (m: Milestone) => void;
};

/** Month grid of scheduled tasks plus goal / OKR deadline milestones. */
export function ContentCalendar({ ownerId, onOpenMilestone }: Props) {
  const { t, lang } = useLang();
  const locale = lang === "uk" ? "uk-UA" : "en-GB";
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const tasks = useTasksRange(iso(start), iso(end), ownerId);
  const goals = useGoals(ownerId, "all");
  const objectives = useObjectives(ownerId, "all");

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks.data ?? []) {
      const list = map.get(task.due_date) ?? [];
      list.push(task);
      map.set(task.due_date, list);
    }
    return map;
  }, [tasks.data]);

  const milestonesByDay = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    const push = (m: Milestone) => {
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    };
    for (const g of goals.data ?? []) {
      if (g.target_date) push({ id: g.id, title: g.title, kind: "goal", date: g.target_date });
    }
    for (const o of objectives.data ?? []) {
      if (o.target_date) push({ id: o.id, title: o.title, kind: "okr", date: o.target_date });
    }
    return map;
  }, [goals.data, objectives.data]);

  const leading = (start.getDay() + 6) % 7; // Monday-first
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: end.getDate() }, (_, i) => i + 1),
  ];
  const todayIso = iso(new Date());

  type Mode = "single" | "multi" | "range";
  const [mode, setMode] = useState<Mode>("single");
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);

  const pick = (key: string) => {
    if (mode === "single") {
      setSelected((s) => (s.length === 1 && s[0] === key ? [] : [key]));
    } else if (mode === "multi") {
      setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key].sort()));
    } else if (!anchor) {
      setAnchor(key);
      setSelected([key]);
    } else {
      const [a, b] = [anchor, key].sort();
      const out: string[] = [];
      const d = new Date(a + "T00:00:00");
      while (iso(d) <= b) {
        out.push(iso(d));
        d.setDate(d.getDate() + 1);
      }
      setSelected(out);
      setAnchor(null);
    }
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    setSelected([]);
    setAnchor(null);
  };
  const selectedSet = new Set(selected);
  const fmtDay = (k: string) =>
    new Date(k + "T00:00:00").toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const shift = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const monthMilestones = Array.from(milestonesByDay.values()).flat().length;

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-bold">
          {cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </h2>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => shift(-1)}
            aria-label={t("cal.prev")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-accent hover:text-accent"
          >
            ←
          </button>
          <button
            onClick={() => shift(1)}
            aria-label={t("cal.next")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-accent hover:text-accent"
          >
            →
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" /> {t("ws.tabPlan")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" /> {t("cal.goal")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sky-500" /> {t("cal.okr")}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["single", "multi", "range"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`min-h-9 rounded-full border px-3 text-xs font-bold ${
              mode === m ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent"
            }`}
          >
            {t(m === "single" ? "cal.modeSingle" : m === "multi" ? "cal.modeMulti" : "cal.modeRange")}
          </button>
        ))}
        {selected.length > 0 && (
          <button
            onClick={() => changeMode(mode)}
            className="min-h-9 rounded-full px-3 text-xs font-bold text-muted-foreground hover:text-accent"
          >
            {t("cal.clearSel")}
          </button>
        )}
      </div>

      {(tasks.data?.length ?? 0) === 0 && monthMilestones === 0 && (
        <p className="mb-4 text-xs text-muted-foreground">{t("cal.none")}</p>
      )}

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} className="hidden sm:block" />;
          const key = iso(new Date(cursor.getFullYear(), cursor.getMonth(), day));
          const items = byDay.get(key) ?? [];
          const marks = milestonesByDay.get(key) ?? [];
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-pressed={selectedSet.has(key)}
              onClick={() => pick(key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick(key)}
              className={`min-h-16 min-w-0 cursor-pointer rounded-xl border p-1.5 transition-colors sm:min-h-24 sm:p-2 ${
                selectedSet.has(key)
                  ? "border-accent bg-accent/10"
                  : key === todayIso
                    ? "border-accent"
                    : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{day}</div>
              <ul className="mt-1 space-y-1">
                {marks.map((m) => (
                  <li key={`${m.kind}-${m.id}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMilestone?.(m);
                      }}
                      title={`${t("cal.milestone")}: ${m.title}`}
                      className={`w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-semibold transition-opacity hover:opacity-80 sm:text-[10px] ${
                        m.kind === "goal"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                      }`}
                    >
                      ◆ {m.title}
                    </button>
                  </li>
                ))}
                {items.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    title={task.title}
                    className={`truncate rounded px-1 py-0.5 text-[9px] sm:text-[10px] ${
                      task.done
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-accent/12 text-accent"
                    }`}
                  >
                    {task.due_time ? `${task.due_time.slice(0, 5)} ` : ""}
                    {task.title}
                  </li>
                ))}
                {items.length > 3 && (
                  <li className="text-[9px] text-muted-foreground">+{items.length - 3}</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="mt-6 rounded-2xl border border-border p-4">
        <h3 className="mb-3 text-sm font-bold">
          {t("cal.selected")} {selected.length > 0 && `(${selected.length})`}
        </h3>
        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("cal.pickHint")}</p>
        ) : selected.every((k) => !(byDay.get(k)?.length || milestonesByDay.get(k)?.length)) ? (
          <p className="text-xs text-muted-foreground">{t("cal.emptySel")}</p>
        ) : (
          <ul className="space-y-3">
            {selected
              .filter((k) => byDay.get(k)?.length || milestonesByDay.get(k)?.length)
              .map((k) => (
                <li key={k}>
                  <div className="mb-1 text-xs font-bold text-muted-foreground">{fmtDay(k)}</div>
                  <ul className="space-y-1">
                    {(milestonesByDay.get(k) ?? []).map((m) => (
                      <li key={m.id}>
                        <button onClick={() => onOpenMilestone?.(m)} className="text-left text-sm font-semibold hover:text-accent">
                          ◆ {m.title}
                        </button>
                      </li>
                    ))}
                    {(byDay.get(k) ?? []).map((task) => (
                      <li key={task.id} className={`text-sm ${task.done ? "text-muted-foreground line-through" : ""}`}>
                        {task.due_time ? `${task.due_time.slice(0, 5)} · ` : "• "}
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
