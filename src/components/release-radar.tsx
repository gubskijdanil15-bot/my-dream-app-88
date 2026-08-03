import { useLang } from "@/lib/i18n";
import type { Task } from "@/lib/workspace-data";

/** Minimal header widget: the next upcoming shoot / release date. */
export function ReleaseRadar({ tasks }: { tasks: Task[] }) {
  const { t } = useLang();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next = tasks
    .filter((x) => !x.done && new Date(`${x.due_date}T00:00:00`) >= today)
    .sort((a, b) =>
      a.due_date === b.due_date
        ? (a.due_time ?? "99").localeCompare(b.due_time ?? "99")
        : a.due_date.localeCompare(b.due_date),
    )[0];

  if (!next) return null;

  const days = Math.round(
    (new Date(`${next.due_date}T00:00:00`).getTime() - today.getTime()) / 86400000,
  );
  const when =
    days === 0 ? t("radar.today") : days === 1 ? t("radar.tomorrow") : `${days} ${t("radar.days")}`;

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
        {t("radar.next")}
      </span>
      <span className="truncate text-[11px] font-semibold">{next.title}</span>
      <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
        {when}
      </span>
    </div>
  );
}
