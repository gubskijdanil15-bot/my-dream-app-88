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
              className={`min-h-16 min-w-0 rounded-xl border p-1.5 sm:min-h-24 sm:p-2 ${
                key === todayIso ? "border-accent" : "border-border"
              }`}
            >
              <div className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{day}</div>
              <ul className="mt-1 space-y-1">
                {marks.map((m) => (
                  <li key={`${m.kind}-${m.id}`}>
                    <button
                      onClick={() => onOpenMilestone?.(m)}
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
    </div>
  );
}
