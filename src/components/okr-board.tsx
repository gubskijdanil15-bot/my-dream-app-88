import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RulerProgress } from "@/components/ruler-progress";
import {
  krProgress,
  objectiveProgress,
  useCreateKeyResult,
  useCreateObjective,
  useDeleteKeyResult,
  useDeleteObjective,
  useObjectives,
  useUpdateKeyResult,
  type Objective,
} from "@/lib/workspace-data";

type Props = { ownerId?: string; canEdit: boolean; formOpen: boolean; onCloseForm: () => void };

export function OkrBoard({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const objectives = useObjectives(ownerId);
  const createObjective = useCreateObjective(ownerId);
  const deleteObjective = useDeleteObjective();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [category, setCategory] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Objective | null>(null);

  const field =
    "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      await createObjective.mutateAsync({
        title: value.slice(0, 160),
        description: description.trim() || null,
        timeframe: timeframe.trim() || null,
        category: category.trim() || null,
      });
      setTitle("");
      setDescription("");
      setTimeframe("");
      setCategory("");
      onCloseForm();
    } catch {
      toast.error(t("okr.errObjective"));
    }
  }

  return (
    <div>
      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="animate-entry mb-8 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("okr.objective")}
            maxLength={160}
            className={`${field} sm:col-span-2`}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("okr.description")}
            maxLength={400}
            className={`${field} sm:col-span-2`}
          />
          <input
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder={t("okr.timeframe")}
            maxLength={40}
            className={field}
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("okr.category")}
            maxLength={40}
            className={field}
          />
          <button
            type="submit"
            className="justify-self-start rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground sm:col-span-2"
          >
            {t("ws.add")}
          </button>
        </form>
      )}

      {objectives.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("okr.empty")}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {objectives.data?.map((objective) => (
          <ObjectiveCard
            key={objective.id}
            objective={objective}
            canEdit={canEdit}
            ownerId={ownerId}
            onDelete={() => setPendingDelete(objective)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        messageKey="confirm.deleteObjective"
        detail={pendingDelete?.title}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteObjective.mutate(pendingDelete.id)}
      />
    </div>
  );
}

function ObjectiveCard({
  objective,
  canEdit,
  ownerId,
  onDelete,
}: {
  objective: Objective;
  canEdit: boolean;
  ownerId?: string;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const createKr = useCreateKeyResult(ownerId);
  const updateKr = useUpdateKeyResult();
  const deleteKr = useDeleteKeyResult();

  const [open, setOpen] = useState(false);
  const [krTitle, setKrTitle] = useState("");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("%");
  const [pendingKr, setPendingKr] = useState<string | null>(null);

  const progress = objectiveProgress(objective);
  const field =
    "min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

  async function addKr(e: React.FormEvent) {
    e.preventDefault();
    const value = krTitle.trim();
    if (!value) return;
    try {
      await createKr.mutateAsync({
        objective_id: objective.id,
        title: value.slice(0, 160),
        target_value: Number(target) || 100,
        current_value: 0,
        unit: unit.trim().slice(0, 16) || "%",
      });
      setKrTitle("");
      setOpen(false);
    } catch {
      toast.error(t("okr.errKr"));
    }
  }

  return (
    <article className="animate-entry flex flex-col rounded-2xl border border-border bg-card p-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold break-words">{objective.title}</h3>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
            {objective.timeframe && <span>{objective.timeframe}</span>}
            {objective.category && <span>· {objective.category}</span>}
          </p>
          {objective.description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {objective.description}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold text-accent">{progress}%</div>
          {canEdit && (
            <button
              onClick={onDelete}
              className="text-[11px] font-semibold text-muted-foreground hover:text-destructive"
            >
              {t("ws.delete")}
            </button>
          )}
        </div>
      </header>

      <div className="my-4">
        <RulerProgress value={progress} />
      </div>

      {objective.key_results.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("okr.krEmpty")}</p>
      )}

      <ul className="space-y-3">
        {objective.key_results.map((kr) => (
          <li key={kr.id} className="rounded-xl border border-border/60 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="min-w-0 break-words text-sm font-semibold">{kr.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{krProgress(kr)}%</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={kr.current_value}
                disabled={!canEdit}
                onChange={(e) =>
                  updateKr.mutate({ id: kr.id, current_value: Number(e.target.value) })
                }
                className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                aria-label={`${t("okr.current")} ${kr.title}`}
              />
              <span className="text-xs text-muted-foreground">
                / {kr.target_value} {kr.unit}
              </span>
              {canEdit && (
                <button
                  onClick={() => setPendingKr(kr.id)}
                  className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                >
                  {t("ws.del")}
                </button>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${krProgress(kr)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="mt-4">
          {open ? (
            <form onSubmit={addKr} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_auto]">
              <input
                value={krTitle}
                onChange={(e) => setKrTitle(e.target.value)}
                placeholder={t("okr.krTitle")}
                maxLength={160}
                className={field}
              />
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                aria-label={t("okr.target")}
                className={field}
              />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                aria-label={t("okr.unit")}
                maxLength={16}
                className={field}
              />
              <button
                type="submit"
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:bg-accent"
              >
                {t("ws.add")}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-border px-4 py-2 text-[11px] font-bold hover:border-accent hover:text-accent"
            >
              + {t("okr.addKr")}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingKr}
        messageKey="confirm.deleteKr"
        onCancel={() => setPendingKr(null)}
        onConfirm={() => pendingKr && deleteKr.mutate(pendingKr)}
      />
    </article>
  );
}
