import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RulerProgress } from "@/components/ruler-progress";
import { StatusTabs } from "@/components/status-tabs";
import {
  krProgress,
  objectiveProgress,
  useCreateKeyResult,
  useCreateObjective,
  useDeleteKeyResult,
  useDeleteObjective,
  useObjectives,
  useUpdateKeyResult,
  useUpdateObjective,
  type Objective,
  type StatusFilter,
} from "@/lib/workspace-data";

type Props = { ownerId?: string; canEdit: boolean; formOpen: boolean; onCloseForm: () => void };

export function OkrBoard({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const [filter, setFilter] = useState<StatusFilter>("active");
  const objectives = useObjectives(ownerId, filter);
  const allObjectives = useObjectives(ownerId, "all");
  const createObjective = useCreateObjective(ownerId);
  const deleteObjective = useDeleteObjective();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
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
        target_date: targetDate || null,
      });
      setTitle("");
      setDescription("");
      setTimeframe("");
      setCategory("");
      setTargetDate("");
      onCloseForm();
    } catch {
      toast.error(t("okr.errObjective"));
    }
  }

  const all = allObjectives.data ?? [];
  const activeCount = all.filter((o) => o.status !== "completed").length;
  const doneCount = all.length - activeCount;
  const overall =
    all.length === 0 ? 0 : Math.round(all.reduce((s, o) => s + objectiveProgress(o), 0) / all.length);

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["okr.total", String(all.length)],
            ["okr.activeCount", String(activeCount)],
            ["okr.completedCount", String(doneCount)],
            ["okr.quarterProgress", `${overall}%`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card px-3 py-2.5">
            <div className="truncate text-[11px] text-muted-foreground">{t(label)}</div>
            <div className="text-lg font-extrabold">{value}</div>
          </div>
        ))}
      </div>

      <StatusTabs value={filter} onChange={setFilter} />

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
          <label className="sm:col-span-2 grid gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {t("okr.targetDate")}
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={field}
            />
          </label>
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
  const updateObjective = useUpdateObjective();
  const createKr = useCreateKeyResult(ownerId);
  const updateKr = useUpdateKeyResult();
  const deleteKr = useDeleteKeyResult();

  const [open, setOpen] = useState(false);
  const [krTitle, setKrTitle] = useState("");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("%");
  const [pendingKr, setPendingKr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const progress = objectiveProgress(objective);
  const completed = objective.status === "completed";
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
    <article
      className={`animate-entry flex flex-col rounded-2xl border bg-card p-5 transition-colors ${
        completed ? "border-emerald-500/40" : "border-border"
      }`}
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-base font-bold">{objective.title}</h3>
            {completed && (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {t("status.badge")}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
            {objective.timeframe && <span>{objective.timeframe}</span>}
            {objective.target_date && (
              <span>
                · {t("okr.targetDate")}: {objective.target_date}
              </span>
            )}
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
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={() =>
                  updateObjective.mutate({
                    id: objective.id,
                    status: completed ? "active" : "completed",
                    completed_at: completed ? null : new Date().toISOString(),
                  })
                }
                className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
              >
                {t(completed ? "status.reopen" : "status.markDone")}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
              >
                {t("okr.edit")}
              </button>
              <button
                onClick={onDelete}
                className="text-[11px] font-semibold text-muted-foreground hover:text-destructive"
              >
                {t("ws.delete")}
              </button>
            </div>
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

      {editing && (
        <ObjectiveEditModal
          objective={objective}
          ownerId={ownerId}
          onClose={() => setEditing(false)}
        />
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

function ObjectiveEditModal({
  objective,
  ownerId,
  onClose,
}: {
  objective: Objective;
  ownerId?: string;
  onClose: () => void;
}) {
  const { t } = useLang();
  const updateObjective = useUpdateObjective();
  const createKr = useCreateKeyResult(ownerId);
  const updateKr = useUpdateKeyResult();
  const deleteKr = useDeleteKeyResult();

  const [title, setTitle] = useState(objective.title);
  const [description, setDescription] = useState(objective.description ?? "");
  const [timeframe, setTimeframe] = useState(objective.timeframe ?? "");
  const [category, setCategory] = useState(objective.category ?? "");
  const [targetDate, setTargetDate] = useState(objective.target_date ?? "");
  const [pendingKr, setPendingKr] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("100");
  const [newUnit, setNewUnit] = useState("%");
  const [saving, setSaving] = useState(false);

  const field =
    "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setSaving(true);
    try {
      await updateObjective.mutateAsync({
        id: objective.id,
        title: value.slice(0, 160),
        description: description.trim() || null,
        timeframe: timeframe.trim() || null,
        category: category.trim() || null,
        target_date: targetDate || null,
      });
      onClose();
    } catch {
      toast.error(t("okr.errObjective"));
    } finally {
      setSaving(false);
    }
  }

  async function addKr() {
    const value = newTitle.trim();
    if (!value) return;
    try {
      await createKr.mutateAsync({
        objective_id: objective.id,
        title: value.slice(0, 160),
        target_value: Number(newTarget) || 100,
        current_value: 0,
        unit: newUnit.trim().slice(0, 16) || "%",
      });
      setNewTitle("");
    } catch {
      toast.error(t("okr.errKr"));
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-entry max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-lg"
      >
        <h2 className="text-base font-bold">{t("okr.editObjective")}</h2>

        <form onSubmit={save} className="mt-4 grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("okr.objective")}
            maxLength={160}
            className={field}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("okr.description")}
            maxLength={400}
            className={field}
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {t("okr.targetDate")}
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={field}
            />
          </label>
        </form>

        <h3 className="mt-6 text-sm font-bold">{t("okr.editKr")}</h3>
        <ul className="mt-2 space-y-3">
          {objective.key_results.map((kr) => (
            <li key={kr.id} className="rounded-xl border border-border/60 p-3">
              <input
                defaultValue={kr.title}
                maxLength={160}
                aria-label={t("okr.krTitle")}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== kr.title) updateKr.mutate({ id: kr.id, title: value });
                }}
                className={field}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  defaultValue={kr.current_value}
                  aria-label={t("okr.current")}
                  onBlur={(e) =>
                    updateKr.mutate({ id: kr.id, current_value: Number(e.target.value) || 0 })
                  }
                  className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                />
                <span className="text-xs text-muted-foreground">/</span>
                <input
                  type="number"
                  defaultValue={kr.target_value}
                  aria-label={t("okr.target")}
                  onBlur={(e) =>
                    updateKr.mutate({ id: kr.id, target_value: Number(e.target.value) || 1 })
                  }
                  className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                />
                <input
                  defaultValue={kr.unit}
                  maxLength={16}
                  aria-label={t("okr.unit")}
                  onBlur={(e) =>
                    updateKr.mutate({ id: kr.id, unit: e.target.value.trim().slice(0, 16) || "%" })
                  }
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setPendingKr(kr.id)}
                  className="ml-auto text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                >
                  {t("ws.del")}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_4rem_auto]">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t("okr.krTitle")}
            maxLength={160}
            className={field}
          />
          <input
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            aria-label={t("okr.target")}
            className={field}
          />
          <input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            aria-label={t("okr.unit")}
            maxLength={16}
            className={field}
          />
          <button
            type="button"
            onClick={addKr}
            className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:bg-accent"
          >
            + {t("okr.addKr")}
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2.5 text-xs font-bold hover:border-accent hover:text-accent"
          >
            {t("ws.cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground disabled:opacity-60"
          >
            {t("ws.save")}
          </button>
        </div>

        <ConfirmDialog
          open={!!pendingKr}
          messageKey="confirm.deleteKr"
          onCancel={() => setPendingKr(null)}
          onConfirm={() => pendingKr && deleteKr.mutate(pendingKr)}
        />
      </div>
    </div>
  );
}
