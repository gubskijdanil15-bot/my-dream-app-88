import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useTasksRange, type Task } from "@/lib/workspace-data";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Month grid of scheduled tasks, launch dates and reminders. */
export function ContentCalendar({ ownerId }: { ownerId?: string }) {
  const { t, lang } = useLang();
  const locale = lang === "uk" ? "uk-UA" : "en-GB";
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const tasks = useTasksRange(iso(start), iso(end), ownerId);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks.data ?? []) {
      const list = map.get(task.due_date) ?? [];
      list.push(task);
      map.set(task.due_date, list);
    }
    return map;
  }, [tasks.data]);

  const leading = (start.getDay() + 6) % 7; // Monday-first
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: end.getDate() }, (_, i) => i + 1),
  ];
  const todayIso = iso(new Date());

  const shift = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

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

      {(tasks.data?.length ?? 0) === 0 && (
        <p className="mb-4 text-xs text-muted-foreground">{t("cal.none")}</p>
      )}

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} className="hidden sm:block" />;
          const key = iso(new Date(cursor.getFullYear(), cursor.getMonth(), day));
          const items = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-16 min-w-0 rounded-xl border p-1.5 sm:min-h-24 sm:p-2 ${
                key === todayIso ? "border-accent" : "border-border"
              }`}
            >
              <div className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">{day}</div>
              <ul className="mt-1 space-y-1">
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
