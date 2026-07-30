import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SafeBoundary } from "@/components/SafeBoundary";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RulerProgress } from "@/components/ruler-progress";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NoteEditor } from "@/components/note-editor";
import { HandwritingDialog } from "@/components/handwriting-dialog";
import { useLang } from "@/lib/i18n";
import { useJoinedJournals } from "@/lib/journal-data";
import {
  todayISO,
  useCreateGoal,
  useCreateNote,
  useCreateTask,
  useDeleteNote,
  useDeleteTask,
  useGoals,
  useNotes,
  useTasks,
  useToggleTask,
  useUpdateGoal,
  useUpdateNote,
  type Task,
} from "@/lib/workspace-data";


export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Paperweight" },
      {
        name: "description",
        content: "Your notes, active goals and today's plan in a single quiet workspace.",
      },
      { property: "og:title", content: "Workspace — Paperweight" },
      { property: "og:description", content: "Notes, goals and today's plan." },
    ],
  }),
  component: Workspace,
});

type Tab = "notes" | "plan" | "note";

function Workspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = todayISO();
  const { t, lang } = useLang();

  const locale = lang === "uk" ? "uk-UA" : undefined;
  const longDate = (d: Date) =>
    d.toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const shortStamp = (iso: string) =>
    new Date(iso)
      .toLocaleString(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const joined = useJoinedJournals();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const activeJournal = joined.data?.find((j) => j.owner_id === ownerId) ?? null;
  const scope = ownerId ?? undefined;
  const canEdit = ownerId ? activeJournal?.permission === "edit" : true;

  const notes = useNotes(scope);
  const goals = useGoals(scope);
  const tasks = useTasks(today, scope);

  const createNote = useCreateNote(scope);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createGoal = useCreateGoal(scope);
  const updateGoal = useUpdateGoal();
  const createTask = useCreateTask(scope);
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const [capture, setCapture] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("plan");

  const [taskTitle, setTaskTitle] = useState("");
  const taskTitleDebounce = useRef<number | null>(null);
  const onTaskTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (taskTitleDebounce.current) window.clearTimeout(taskTitleDebounce.current);
    taskTitleDebounce.current = window.setTimeout(() => setTaskTitle(value), 400);
  };
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const selected = notes.data?.find((n) => n.id === selectedId) ?? null;


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function submitCapture(e: React.FormEvent) {
    e.preventDefault();
    const title = capture.trim();
    if (!title) return;
    try {
      const created = await createNote.mutateAsync(title.slice(0, 200));
      setCapture("");
      setSelectedId(created.id);
    } catch {
      toast.error(t("ws.errNote"));
    }
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    try {
      await createTask.mutateAsync({
        title: title.slice(0, 200),
        priority: taskPriority,
        due_date: today,
      });
      setTaskTitle("");
    } catch {
      toast.error(t("ws.errTask"));
    }
  }

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    const title = goalTitle.trim();
    if (!title) return;
    try {
      await createGoal.mutateAsync({
        title: title.slice(0, 160),
        target_date: goalDate || null,
      });
      setGoalTitle("");
      setGoalDate("");
      setGoalOpen(false);
    } catch {
      toast.error(t("ws.errGoal"));
    }
  }

  const priorityLabel = (p: Task["priority"]) =>
    t(p === "high" ? "priority.high" : p === "low" ? "priority.low" : "priority.medium");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground md:flex-row">
      {/* Desktop rail */}
      <nav className="hidden w-16 flex-col items-center gap-8 border-r border-border py-8 md:flex">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          P
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 font-mono text-xs font-bold text-accent">
            {String(notes.data?.length ?? 0).padStart(2, "0")}
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl font-mono text-xs font-bold text-muted-foreground">
            {String(goals.data?.length ?? 0).padStart(2, "0")}
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl font-mono text-xs font-bold text-muted-foreground">
            {String(tasks.data?.filter((t2) => !t2.done).length ?? 0).padStart(2, "0")}
          </div>
        </div>
        <div className="mt-auto flex flex-col items-center gap-4">
          <Link
            to="/shared"
            className="text-center text-[11px] font-semibold leading-tight text-muted-foreground hover:text-accent"
          >
            {t("ws.tabShare")}
          </Link>
          <LanguageToggle className="scale-90" />
          <ThemeToggle className="scale-90" />
          <button
            onClick={handleSignOut}
            className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
          >
            {t("ws.out")}
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[10px] font-bold text-background">
            P
          </div>
          <span className="truncate text-sm font-bold tracking-tight">Paperweight</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-muted-foreground"
          >
            {t("ws.out")}
          </button>
        </div>

      </header>

      {/* Notes column */}
      <section data-notes-section
        className={`flex-col border-border bg-foreground/[0.01] md:flex md:w-[380px] md:border-r ${
          tab === "notes" ? "flex flex-1 overflow-hidden" : "hidden"
        }`}
      >
        <div className="border-b border-border p-4 sm:p-6">
          {(joined.data?.length ?? 0) > 0 && (
            <select
              value={ownerId ?? ""}
              onChange={(e) => {
                setOwnerId(e.target.value || null);
                setSelectedId(null);
              }}
              className="mb-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t("share.myNotebook")}</option>
              {joined.data?.map((j) => (
                <option key={j.id} value={j.owner_id}>
                  {j.name ?? t("share.someone")}
                  {j.permission === "read" ? ` · ${t("share.readOnly")}` : ""}
                </option>
              ))}
            </select>
          )}
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="label-mono">{t("ws.notes")}</h2>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {notes.data?.length ?? 0} {t("ws.total")}
            </span>
          </div>
          {canEdit && (
            <form onSubmit={submitCapture}>
              <input
                value={capture}
                onChange={(e) => setCapture(e.target.value)}
                placeholder={t("ws.quickCapture")}
                maxLength={200}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
              />
            </form>
          )}
        </div>


        <div className="flex-1 overflow-y-auto">
          {notes.isLoading && (
            <p className="p-6 font-mono text-[10px] tracking-wide text-muted-foreground">
              {t("ws.loading")}
            </p>
          )}
          {notes.data?.length === 0 && (
            <p className="p-6 text-xs leading-relaxed text-muted-foreground">
              {t("ws.emptyNotes")}
            </p>
          )}
          {notes.data?.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedId(note.id);
                setTab("note");
              }}
              className={`group block w-full border-b border-border p-4 text-left transition-colors hover:bg-card sm:p-6 ${
                note.id === selectedId ? "bg-card" : ""
              }`}
            >
              <div
                className={`mb-2 font-mono text-[10px] ${
                  note.id === selectedId ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {shortStamp(note.updated_at)}
              </div>
              <h3 className="mb-2 text-sm font-semibold transition-colors group-hover:text-accent">
                {note.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {note.body || t("ws.noDetail")}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Main workspace */}
      <main
        className={`relative flex-1 flex-col overflow-y-auto md:flex ${
          tab === "notes" ? "hidden" : "flex"
        }`}
      >
        <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md sm:px-8 sm:py-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
              {t("ws.planner")}
            </h1>
            <p className="truncate font-mono text-xs text-muted-foreground sm:text-sm">
              {longDate(new Date())}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => setGoalOpen((v) => !v)}
              className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs font-bold tracking-wide text-background shadow-sm transition-colors hover:bg-accent active:scale-95"
            >
              {goalOpen ? t("ws.close") : t("ws.newGoal")}
            </button>
          )}
          {!canEdit && (
            <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
              {t("share.readOnly")}
            </span>
          )}
          {canEdit && (
            <HandwritingDialog
              onInsert={(text) => {
                if (!text) return;
                createNote.mutate(text.slice(0, 200), {
                  onSuccess: (created) => {
                    toast.success(t("ws.noteSaved"));
                    setSelectedId(created.id);
                  },
                  onError: () => toast.error(t("ws.errNote")),
                });
              }}
            />
          )}
        </header>

        <div className="max-w-4xl p-4 pb-28 sm:p-8 md:pb-8">
          {goalOpen && (
            <form
              onSubmit={submitGoal}
              className="animate-entry mb-10 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-[180px] flex-1 space-y-1">
                <label className="label-mono block" htmlFor="goal-title">
                  {t("ws.goal")}
                </label>
                <input
                  id="goal-title"
                  value={goalTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Defer state update to next tick to avoid layout thrash while typing
                    requestAnimationFrame(() => setGoalTitle(v));
                  }}
                  maxLength={160}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="label-mono block" htmlFor="goal-date">
                  {t("ws.target")}
                </label>
                <input
                  id="goal-date"
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-wide text-accent-foreground"
              >
                {t("ws.add")}
              </button>
            </form>
          )}

          {/* Note editor on mobile */}
          {tab === "note" && (
            <div className="animate-entry mb-10 md:hidden">
              <h2 className="label-mono mb-4">{t("ws.note")}</h2>
              {!selected && <p className="text-xs text-muted-foreground">{t("ws.selectNote")}</p>}
              {selected && (
                <NoteEditor
                  key={selected.id}
                  note={selected}
                  canEdit={canEdit}
                  saving={updateNote.isPending}
                  onSave={(input) =>
                    updateNote.mutate(
                      { id: selected.id, ...input },
                      { onSuccess: () => toast.success(t("ws.noteSaved")) },
                    )
                  }
                  onDelete={() => {
                    deleteNote.mutate(selected.id);
                    setSelectedId(null);
                  }}
                />
              )}
            </div>
          )}

          {tab !== "note" && (
            <>
              {/* Goals */}
              <div className="mb-12">
                <h2 className="label-mono mb-6">{t("ws.activeGoals")}</h2>
                {goals.data?.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("ws.emptyGoals")}</p>
                )}
                <div className="grid gap-8">
                  {goals.data?.map((goal) => (
                    <div key={goal.id} className="animate-entry">
                      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold">{goal.title}</h4>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {goal.target_date
                              ? `${t("ws.target")}: ${goal.target_date}`
                              : t("ws.ongoing")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                          <button
                            onClick={() =>
                              updateGoal.mutate({
                                id: goal.id,
                                progress: Math.max(0, goal.progress - 10),
                              })
                            }
                            className="size-8 rounded-full border border-border font-mono text-xs hover:border-accent hover:text-accent"
                            aria-label={`− ${goal.title}`}
                            disabled={!canEdit}
                          >
                            −
                          </button>
                          <span className="w-10 text-right font-mono text-xs">
                            {goal.progress}%
                          </span>
                          <button
                            onClick={() =>
                              updateGoal.mutate({
                                id: goal.id,
                                progress: Math.min(100, goal.progress + 10),
                              })
                            }
                            className="size-8 rounded-full border border-border font-mono text-xs hover:border-accent hover:text-accent"
                            aria-label={`+ ${goal.title}`}
                            disabled={!canEdit}
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateGoal.mutate({ id: goal.id, archived: true })}
                            disabled={!canEdit}
                            className="font-mono text-[10px] tracking-wide text-muted-foreground hover:text-accent"
                          >
                            {t("ws.done")}
                          </button>
                        </div>
                      </div>
                      <RulerProgress value={goal.progress} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's list */}
              <div className="animate-entry mb-12">
                <h2 className="label-mono mb-6">{t("ws.todayList")}</h2>
                {canEdit && (
                  <form onSubmit={submitTask} className="mb-4 flex flex-wrap gap-2">
                    <input
                      value={taskTitle}
                      onChange={onTaskTitleChange}
                      placeholder={t("ws.addTask")}
                      maxLength={200}
                      className="w-full min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto sm:text-sm"
                    />
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                      className="flex-1 rounded-xl border border-border bg-card px-2 py-2 text-xs focus:outline-none sm:flex-none"
                    >
                      <option value="high">{t("priority.high")}</option>
                      <option value="medium">{t("priority.medium")}</option>
                      <option value="low">{t("priority.low")}</option>
                    </select>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent sm:flex-none"
                    >
                      {t("ws.add")}
                    </button>
                  </form>
                )}


                <div className="space-y-1">
                  {tasks.data?.length === 0 && (
                    <p className="py-3 text-xs text-muted-foreground">{t("ws.emptyTasks")}</p>
                  )}
                  {tasks.data?.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 border-b border-border/40 py-3"
                    >
                      <button
                        onClick={() => toggleTask.mutate({ id: task.id, done: !task.done })}
                        disabled={!canEdit}
                        aria-label={task.title}
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          task.done ? "border-accent bg-accent" : "border-border hover:border-accent"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full bg-background ${
                            task.done ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </button>
                      <span
                        className={`min-w-0 flex-1 break-words text-sm transition-all ${
                          task.done ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
                        {priorityLabel(task.priority)}
                      </span>
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        disabled={!canEdit}
                        className="shrink-0 font-mono text-[10px] tracking-wide text-muted-foreground/60 transition-colors hover:text-accent md:text-muted-foreground/0 md:group-hover:text-muted-foreground"
                        aria-label={`${t("ws.delete")} ${task.title}`}
                      >
                        {t("ws.del")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note detail (desktop) */}
              {selected && (
                <div className="animate-entry hidden border-t border-border pt-8 md:block">
                  <h2 className="label-mono mb-4">{t("ws.note")}</h2>
                  <NoteEditor
                    key={selected.id}
                    note={selected}
                    canEdit={canEdit}
                    saving={updateNote.isPending}
                    onSave={(input) =>
                      updateNote.mutate(
                        { id: selected.id, ...input },
                        { onSuccess: () => toast.success(t("ws.noteSaved")) },
                      )
                    }
                    onDelete={() => {
                      deleteNote.mutate(selected.id);
                      setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {(
          [
            ["notes", "ws.tabNotes"],
            ["plan", "ws.tabPlan"],
            ["note", "ws.tabNote"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-3.5 text-xs font-semibold tracking-wide transition-colors ${
              tab === key ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {t(label)}
          </button>
        ))}
        <Link
          to="/shared"
          className="py-3.5 text-center text-xs font-semibold tracking-wide text-muted-foreground"
        >
          {t("ws.tabShare")}
        </Link>
      </nav>

    </div>
  );

}


