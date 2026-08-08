import { useLang, type TranslationKey } from "@/lib/i18n";
import { STAGES, type Stage, type Task } from "@/lib/workspace-data";

const STAGE_LABEL: Record<Stage, TranslationKey> = {
  idea: "stage.idea",
  script: "stage.script",
  storyboard: "stage.storyboard",
  production: "stage.production",
  post: "stage.post",
  published: "stage.published",
};

type Props = {
  tasks: Task[];
  canEdit: boolean;
  onMove: (id: string, stage: Stage) => void;
};

/** Production pipeline board: Idea → Scriptwriting → Production → Post → Published. */
export function KanbanBoard({ tasks, canEdit, onMove }: Props) {
  const { t } = useLang();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {STAGES.map((stage) => {
        const items = tasks.filter((task) => task.stage === stage);
        return (
          <section
            key={stage}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card/60 p-3"
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <h3 className="truncate text-xs font-bold">{t(STAGE_LABEL[stage])}</h3>
              <span className="shrink-0 text-[11px] text-muted-foreground">{items.length}</span>
            </header>

            {items.length === 0 && (
              <p className="text-[11px] text-muted-foreground">{t("kan.empty")}</p>
            )}

            <ul className="space-y-2">
              {items.map((task) => (
                <li key={task.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="break-words text-sm font-semibold">{task.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {task.due_date}
                    {task.due_time ? ` · ${task.due_time.slice(0, 5)}` : ""}
                  </p>
                  {canEdit && (
                    <select
                      value={task.stage}
                      onChange={(e) => onMove(task.id, e.target.value as Stage)}
                      aria-label={`${t("kan.move")} ${task.title}`}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {t(STAGE_LABEL[s])}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
