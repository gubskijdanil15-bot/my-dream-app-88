import { useState } from "react";
import { Check, RotateCcw, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLang, type TranslationKey } from "@/lib/i18n";
import { useUpdateBoard, type Board } from "@/lib/boards-data";
import { completionPatch } from "@/lib/project-status";
import { addProjectDate, removeProjectDate } from "@/lib/project-dates";
import { ProjectDatePicker } from "@/components/project-date-picker";

const sections = [
  ["description", "boards.desc"],
  ["script", "projects.script"],
  ["dispo", "projects.dispo"],
  ["locations", "projects.locations"],
  ["production_notes", "projects.notes"],
] as const satisfies readonly (readonly [keyof Board, TranslationKey])[];

export function ProjectInfo({ project, canEdit }: { project: Board; canEdit: boolean }) {
  const { t, lang } = useLang();
  const update = useUpdateBoard();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project);
  const completed = project.status === "completed";

  return (
    <section className="mb-8 min-w-0">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-muted-foreground">
          {t(completed ? "projects.completed" : "projects.active")}
          {project.completed_at && ` · ${new Date(project.completed_at).toLocaleDateString(lang)}`}
        </span>
        {project.date_mode === "days" ? <div className="flex flex-wrap gap-2">
          {project.specific_dates.map((date) => <span key={date} className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
            {new Date(`${date}T00:00:00`).toLocaleDateString(lang)}
          </span>)}
        </div> : (project.start_date || project.end_date) && (
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {project.start_date ? new Date(`${project.start_date}T00:00:00`).toLocaleDateString(lang) : "…"}
            {" → "}
            {project.end_date ? new Date(`${project.end_date}T00:00:00`).toLocaleDateString(lang) : "…"}
          </span>
        )}
        {canEdit && <div className="flex flex-wrap gap-2 sm:ml-auto">
          {!editing && <Button variant="outline" onClick={() => { setDraft(project); setEditing(true); }}>
            <Pencil />{t("projects.edit")}
          </Button>}
          <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate(
            { id: project.id, ...completionPatch(completed ? "active" : "completed") },
            { onError: () => toast.error(t("boards.err")) },
          )}>{completed ? <RotateCcw /> : <Check />}{t(completed ? "projects.reopen" : "projects.complete")}</Button>
        </div>}
      </div>
      {editing ? (
        <form className="grid gap-5" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await update.mutateAsync({ id: project.id, name: draft.name.trim(),
              description: draft.description?.trim() || null, script: draft.script?.trim() || null,
              dispo: draft.dispo?.trim() || null, locations: draft.locations?.trim() || null,
              production_notes: draft.production_notes?.trim() || null,
              start_date: draft.start_date || null, end_date: draft.end_date || null,
              date_mode: draft.date_mode, specific_dates: draft.specific_dates });
            setEditing(false);
            toast.success(t("projects.saved"));
          } catch { toast.error(t("boards.err")); }
        }}>
          <label className="grid gap-2 text-sm font-bold">{t("boards.name")}
            <input required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base" />
          </label>
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {(["range", "days"] as const).map((mode) => <Button key={mode} type="button" variant={draft.date_mode === mode ? "default" : "outline"}
                aria-pressed={draft.date_mode === mode} onClick={() => setDraft({ ...draft, date_mode: mode })}>
                {t(mode === "range" ? "projects.dateRange" : "projects.specificDays")}
              </Button>)}
              <Button type="button" variant="ghost" onClick={() => setDraft(draft.date_mode === "days" ? { ...draft, specific_dates: [] } : { ...draft, start_date: null, end_date: null })}>{t("projects.clearDates")}</Button>
            </div>
            {draft.date_mode === "range" ? <div className="grid gap-4 sm:grid-cols-2">
              <ProjectDatePicker label={t("projects.start")} value={draft.start_date} onChange={(date) => setDraft({ ...draft, start_date: date,
                end_date: date && draft.end_date && draft.end_date < date ? null : draft.end_date })} />
              <ProjectDatePicker label={t("projects.end")} value={draft.end_date} min={draft.start_date} onChange={(date) => setDraft({ ...draft, end_date: date })} />
            </div> : <div className="grid gap-3">
              <div className="max-w-xs"><ProjectDatePicker label={t("projects.addDate")} value={null} onChange={(date) => {
                if (date) setDraft({ ...draft, specific_dates: addProjectDate(draft.specific_dates, date) });
              }} /></div>
              <div className="flex flex-wrap gap-2">
                {draft.specific_dates.map((date) => <div key={date} className="flex items-center gap-1 rounded-md border border-border pl-3 text-sm">
                  <span>{new Date(`${date}T00:00:00`).toLocaleDateString(lang)}</span>
                  <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`${t("projects.removeDate")}: ${date}`} title={t("projects.removeDate")}
                    onClick={() => setDraft({ ...draft, specific_dates: removeProjectDate(draft.specific_dates, date) })}><X /></Button>
                </div>)}
              </div>
            </div>}
          </div>
          {sections.map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-bold">{t(label)}
            <textarea rows={key === "script" || key === "dispo" ? 7 : 3} value={draft[key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-1 focus:ring-ring" />
          </label>)}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={update.isPending || !draft.name.trim()}><Save />{t("ws.saveChanges")}</Button>
            <Button type="button" variant="outline" disabled={update.isPending} onClick={() => setEditing(false)}>{t("ws.cancel")}</Button>
          </div>
        </form>
      ) : <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {sections.map(([key, label]) => <div key={key} className={key === "description" ? "md:col-span-2" : "min-w-0"}>
          <h3 className="mb-2 text-base font-bold">{t(label)}</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
            {project[key] || t("projects.noInfo")}
          </p>
        </div>)}
      </div>}
    </section>
  );
}