import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RulerProgress } from "@/components/ruler-progress";
import { LanguageToggle } from "@/components/language-toggle";
import { NoteEditor } from "@/components/note-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { KanbanBoard } from "@/components/kanban-board";
import { ContentCalendar } from "@/components/content-calendar";
import { OkrBoard } from "@/components/okr-board";
import { IdeaHub } from "@/components/idea-hub";
import { AssetsBoard } from "@/components/assets-board";
import { ReleaseRadar } from "@/components/release-radar";
import { StatusTabs } from "@/components/status-tabs";
import { NotificationBanner } from "@/components/notification-settings";

import { useLang, type TranslationKey } from "@/lib/i18n";
import { useJoinedJournals } from "@/lib/journal-data";
import { useNotificationPrefs, useTaskReminders } from "@/lib/notifications";
import {
  todayISO,
  useCreateGoal,
  useCreateNote,
  useCreateTask,
  useDeleteNote,
  useDeleteTask,
  useGoals,
  useNotes,
  useObjectives,
  useTasks,
  useTasksRange,
  useToggleTask,
  useUpdateGoal,
  useUpdateNote,
  useUpdateTask,
  ROLES,
  type Role,
  type Stage,
  type StatusFilter,
  type Task,
} from "@/lib/workspace-data";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Paperweight" },
      {
        name: "description",
        content:
          "Notes, goals, OKRs, a production board and today's plan in a single quiet workspace.",
      },
      { property: "og:title", content: "Workspace — Paperweight" },
      { property: "og:description", content: "Notes, goals, OKRs and today's plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

type Tab = "notes" | "note" | "goals" | "okr" | "plan" | "calendar" | "ideas" | "assets";

const ROLE_KEY = "paperweight-role";

const roleLabel = {
  director: "role.director",
  editor: "role.editor",
  dp: "role.dp",
  writer: "role.writer",
  producer: "role.producer",
  sound: "role.sound",
} as const;
type PlanView = "list" | "board";
type Reminder = "none" | "at" | "1h" | "1d";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
    new Date(iso).toLocaleString(locale, {
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
  const goals = useGoals(scope, goalFilter);
  const tasks = useTasks(today, scope);
  const objectives = useObjectives(scope);
  const boardTasks = useTasksRange(addDays(new Date(), -30), addDays(new Date(), 120), scope);

  const createNote = useCreateNote(scope);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createGoal = useCreateGoal(scope);
  const updateGoal = useUpdateGoal();
  const createTask = useCreateTask(scope);
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const prefs = useNotificationPrefs();
  useTaskReminders(tasks.data, !ownerId && !!prefs.data?.taskReminders);

  const [capture, setCapture] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [planView, setPlanView] = useState<PlanView>("list");
  const [okrFormOpen, setOkrFormOpen] = useState(false);
  const [ideaFormOpen, setIdeaFormOpen] = useState(false);
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [goalFilter, setGoalFilter] = useState<StatusFilter>("active");
  const [moreOpen, setMoreOpen] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [myRole, setMyRole] = useState<Role | "">("");
  const [taskRole, setTaskRole] = useState<Role | "">("");
  const [pendingGoal, setPendingGoal] = useState<{ id: string; title: string } | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [taskTime, setTaskTime] = useState("");
  const [taskReminder, setTaskReminder] = useState<Reminder>("none");
  const [taskKr, setTaskKr] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [pendingClear, setPendingClear] = useState(false);

  const selected = notes.data?.find((n) => n.id === selectedId) ?? null;
  const onNotes = tab === "notes" || tab === "note";
  const keyResults = (objectives.data ?? []).flatMap((o) =>
    o.key_results.map((kr) => ({ ...kr, objective: o.title })),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(ROLE_KEY);
    if (stored && (ROLES as readonly string[]).includes(stored)) setMyRole(stored as Role);
  }, []);

  const chooseRole = (value: Role | "") => {
    setMyRole(value);
    if (value) window.localStorage.setItem(ROLE_KEY, value);
    else window.localStorage.removeItem(ROLE_KEY);
  };

  const visibleTasks = (tasks.data ?? []).filter(
    (x) => !onlyMine || !myRole || x.assigned_role === myRole,
  );

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
      setTab("note");
    } catch {
      toast.error(t("ws.errNote"));
    }
  }

  function reminderAt(): string | null {
    if (taskReminder === "none") return null;
    const base = new Date(`${today}T${taskTime || "09:00"}:00`);
    if (taskReminder === "1h") base.setHours(base.getHours() - 1);
    if (taskReminder === "1d") base.setDate(base.getDate() - 1);
    return base.toISOString();
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
        due_time: taskTime || null,
        remind_at: reminderAt(),
        key_result_id: taskKr || null,
        assigned_role: taskRole || null,
      });
      setTaskTitle("");
      setTaskTime("");
      setTaskReminder("none");
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

  const headerTitle: TranslationKey =
    tab === "goals"
      ? "ws.activeGoals"
      : tab === "plan"
        ? "ws.todayList"
        : tab === "okr"
          ? "okr.title"
          : tab === "calendar"
            ? "cal.title"
            : tab === "ideas"
              ? "idea.title"
              : tab === "assets"
                ? "assets.title"
                : "ws.notes";

  const notebookSwitcher = (joined.data?.length ?? 0) > 0 && (
    <select
      value={ownerId ?? ""}
      onChange={(e) => {
        setOwnerId(e.target.value || null);
        setSelectedId(null);
      }}
      aria-label={t("ws.viewingNotebook")}
      className="mt-2 max-w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">{t("share.myNotebook")}</option>
      {joined.data?.map((j) => (
        <option key={j.id} value={j.owner_id}>
          {j.name ?? t("share.someone")}
          {j.permission === "read" ? ` · ${t("share.readOnly")}` : ""}
        </option>
      ))}
    </select>
  );

  const tabButton = (key: Tab, label: string, count?: number) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        (key === "notes" ? onNotes : tab === key)
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-accent"
      }`}
    >
      {label}
      {count !== undefined && <span className="ml-1 opacity-60">{count}</span>}
    </button>
  );

  const primaryAction: { label: TranslationKey; open: boolean; onClick: () => void } | null =
    tab === "goals"
      ? { label: "ws.newGoal", open: goalOpen, onClick: () => setGoalOpen((v) => !v) }
      : tab === "okr"
        ? { label: "okr.new", open: okrFormOpen, onClick: () => setOkrFormOpen((v) => !v) }
        : tab === "ideas"
          ? { label: "idea.new", open: ideaFormOpen, onClick: () => setIdeaFormOpen((v) => !v) }
          : tab === "assets"
            ? { label: "ws.add", open: assetFormOpen, onClick: () => setAssetFormOpen((v) => !v) }
            : null;

  const field =
    "min-w-0 rounded-xl border border-border bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground md:flex-row">
      {/* Desktop rail */}
      <nav className="hidden w-16 flex-col items-center gap-8 border-r border-border py-8 md:flex">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          P
        </div>
        <div className="mt-auto flex flex-col items-center gap-4">
          <Link
            to="/shared"
            className="text-center text-[11px] font-semibold leading-tight text-muted-foreground hover:text-accent"
          >
            {t("ws.tabShare")}
          </Link>
          <Link
            to="/profile"
            className="text-center text-[11px] font-semibold leading-tight text-muted-foreground hover:text-accent"
          >
            {t("ws.tabProfile")}
          </Link>
          <ThemeToggle />
          <LanguageToggle className="scale-90" />
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
          <ThemeToggle />
          <LanguageToggle />
          <button onClick={handleSignOut} className="text-xs font-semibold text-muted-foreground">
            {t("ws.out")}
          </button>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-4 py-4 sm:px-8 sm:py-5">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
              {t(headerTitle)}
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {longDate(new Date())}
            </p>
            {notebookSwitcher}
            <div className="mt-2 flex max-w-full">
              <ReleaseRadar tasks={boardTasks.data ?? []} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!canEdit && (
              <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
                {t("share.readOnly")}
              </span>
            )}
            {canEdit && primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background shadow-sm transition-colors hover:bg-accent active:scale-95"
              >
                {primaryAction.open ? t("ws.close") : t(primaryAction.label)}
              </button>
            )}
            {tab === "note" && (
              <button
                onClick={() => setTab("notes")}
                className="rounded-full border border-border px-4 py-2 text-xs font-bold md:hidden"
              >
                {t("ws.tabNotes")}
              </button>
            )}
          </div>
        </header>

        {/* Tabs — scrollable on tablet, wrapped on desktop */}
        <div className="hidden shrink-0 items-center gap-2 overflow-x-auto border-b border-border px-8 py-2.5 md:flex">
          {tabButton("notes", t("ws.tabNotes"), notes.data?.length ?? 0)}
          {tabButton("goals", t("ws.tabGoals"), goals.data?.length ?? 0)}
          {tabButton("okr", t("ws.tabOkr"), objectives.data?.length ?? 0)}
          {tabButton("plan", t("ws.tabPlan"), tasks.data?.filter((x) => !x.done).length ?? 0)}
          {tabButton("ideas", t("ws.tabIdeas"))}
          {tabButton("assets", t("ws.tabAssets"))}
          {tabButton("calendar", t("ws.tabCalendar"))}
        </div>

        <NotificationBanner />

        {/* NOTES */}
        {onNotes && (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <section
              className={`min-w-0 flex-col border-border bg-foreground/[0.01] md:flex md:w-[300px] md:shrink-0 md:border-r lg:w-[340px] ${
                tab === "note" ? "hidden" : "flex w-full flex-1"
              }`}
            >
              <div className="shrink-0 border-b border-border p-4">
                {canEdit && (
                  <form onSubmit={submitCapture}>
                    <input
                      value={capture}
                      onChange={(e) => setCapture(e.target.value)}
                      placeholder={t("ws.quickCapture")}
                      maxLength={200}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </form>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
                {notes.isLoading && (
                  <p className="p-6 text-xs text-muted-foreground">{t("ws.loading")}</p>
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
                    className={`group block w-full border-b border-border p-4 text-left transition-colors hover:bg-card ${
                      note.id === selectedId ? "bg-card" : ""
                    }`}
                  >
                    <div
                      className={`mb-2 text-[11px] ${
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

            <div
              className={`min-w-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:block md:pb-10 ${
                tab === "note" ? "block" : "hidden"
              }`}
            >
              {!selected && <p className="text-xs text-muted-foreground">{t("ws.selectNote")}</p>}
              {selected && (
                <NoteEditor
                  key={selected.id}
                  note={selected}
                  canEdit={canEdit}
                  ownerId={scope}
                  saving={updateNote.isPending}
                  onSave={(input) =>
                    updateNote.mutate(
                      { id: selected.id, ...input },
                      { onSuccess: () => toast.success(t("ws.noteSaved")) },
                    )
                  }
                  onLinksChange={(links) => updateNote.mutate({ id: selected.id, links })}
                  onDelete={() => setPendingNote(selected.id)}
                />
              )}
            </div>
          </div>
        )}

        {/* GOALS */}
        {tab === "goals" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-6xl">
              <StatusTabs value={goalFilter} onChange={setGoalFilter} />
              {goalOpen && canEdit && (
                <form
                  onSubmit={submitGoal}
                  className="animate-entry mb-8 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
                >
                  <div className="min-w-0 space-y-1">
                    <label className="label-mono block" htmlFor="goal-title">
                      {t("ws.goal")}
                    </label>
                    <input
                      id="goal-title"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      maxLength={160}
                      className={`${field} w-full bg-background`}
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
                      className={`${field} w-full bg-background`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground"
                  >
                    {t("ws.add")}
                  </button>
                </form>
              )}

              {goals.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("ws.emptyGoals")}</p>
              )}
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {goals.data?.map((goal) => (
                  <div
                    key={goal.id}
                    className="animate-entry rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="min-w-0 break-words text-sm font-bold">{goal.title}</h4>
                          {goal.status === "completed" && (
                            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {t("status.badge")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {goal.target_date
                            ? `${t("ws.target")}: ${goal.target_date}`
                            : t("ws.ongoing")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {canEdit && (
                          <button
                            onClick={() =>
                              updateGoal.mutate({
                                id: goal.id,
                                progress: Math.max(0, goal.progress - 10),
                              })
                            }
                            className="size-8 rounded-full border border-border text-xs hover:border-accent hover:text-accent"
                            aria-label={`− ${goal.title}`}
                          >
                            −
                          </button>
                        )}
                        <span className="w-10 text-right text-xs">{goal.progress}%</span>
                        {canEdit && (
                          <>
                            <button
                              onClick={() =>
                                updateGoal.mutate({
                                  id: goal.id,
                                  progress: Math.min(100, goal.progress + 10),
                                })
                              }
                              className="size-8 rounded-full border border-border text-xs hover:border-accent hover:text-accent"
                              aria-label={`+ ${goal.title}`}
                            >
                              +
                            </button>
                            <button
                              onClick={() =>
                                goal.status === "completed"
                                  ? updateGoal.mutate({
                                      id: goal.id,
                                      status: "active",
                                      completed_at: null,
                                    })
                                  : setPendingGoal({ id: goal.id, title: goal.title })
                              }
                              className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
                            >
                              {t(goal.status === "completed" ? "status.reopen" : "status.markDone")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <RulerProgress value={goal.progress} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OKR */}
        {tab === "okr" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-7xl">
              <OkrBoard
                ownerId={scope}
                canEdit={canEdit}
                formOpen={okrFormOpen}
                onCloseForm={() => setOkrFormOpen(false)}
              />
            </div>
          </div>
        )}

        {/* IDEAS */}
        {tab === "ideas" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-7xl">
              <IdeaHub
                ownerId={scope}
                canEdit={canEdit}
                formOpen={ideaFormOpen}
                onCloseForm={() => setIdeaFormOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ASSETS */}
        {tab === "assets" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-7xl">
              <AssetsBoard
                ownerId={scope}
                canEdit={canEdit}
                formOpen={assetFormOpen}
                onCloseForm={() => setAssetFormOpen(false)}
              />
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-6xl">
              <ContentCalendar ownerId={scope} />
            </div>
          </div>
        )}

        {/* PLAN */}
        {tab === "plan" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-8 md:pb-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-border p-1">
                  {(
                    [
                      ["list", "view.list"],
                      ["board", "view.board"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setPlanView(value)}
                      aria-pressed={planView === value}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        planView === value
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
                {planView === "list" && (
                  <div className="inline-flex rounded-full border border-border p-1">
                    {(
                      [
                        [false, "task.all"],
                        [true, "task.mine"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={String(value)}
                        onClick={() => setOnlyMine(value)}
                        aria-pressed={onlyMine === value}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          onlyMine === value
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-accent"
                        }`}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                )}
                {planView === "list" && onlyMine && (
                  <select
                    value={myRole}
                    onChange={(e) => chooseRole(e.target.value as Role | "")}
                    aria-label={t("task.role")}
                    className="min-w-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
                  >
                    <option value="">{t("role.none")}</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(roleLabel[r])}
                      </option>
                    ))}
                  </select>
                )}
                {canEdit && planView === "list" && (tasks.data?.some((x) => x.done) ?? false) && (
                  <button
                    onClick={() => setPendingClear(true)}
                    className="ml-auto rounded-full border border-border px-4 py-2 text-[11px] font-bold hover:border-destructive hover:text-destructive"
                  >
                    {t("ws.clearDone")}
                  </button>
                )}
              </div>

              {planView === "board" ? (
                <KanbanBoard
                  tasks={boardTasks.data ?? []}
                  canEdit={canEdit}
                  onMove={(id, stage: Stage) => updateTask.mutate({ id, stage })}
                />
              ) : (
                <>
                  {canEdit && (
                    <form
                      onSubmit={submitTask}
                      className="mb-6 grid gap-2 rounded-2xl border border-border bg-card/60 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_7rem_minmax(0,8rem)_minmax(0,10rem)_minmax(0,9rem)_auto]"
                    >
                      <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder={t("ws.addTask")}
                        maxLength={200}
                        className={`${field} w-full sm:col-span-2 lg:col-span-1`}
                      />
                      <input
                        type="time"
                        value={taskTime}
                        onChange={(e) => setTaskTime(e.target.value)}
                        aria-label={t("task.time")}
                        className={`${field} w-full`}
                      />
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                        aria-label={t("priority.medium")}
                        className={`${field} w-full`}
                      >
                        <option value="high">{t("priority.high")}</option>
                        <option value="medium">{t("priority.medium")}</option>
                        <option value="low">{t("priority.low")}</option>
                      </select>
                      <select
                        value={taskReminder}
                        onChange={(e) => setTaskReminder(e.target.value as Reminder)}
                        aria-label={t("task.remind")}
                        className={`${field} w-full`}
                      >
                        <option value="none">{t("remind.none")}</option>
                        <option value="at">{t("remind.atTime")}</option>
                        <option value="1h">{t("remind.1h")}</option>
                        <option value="1d">{t("remind.1d")}</option>
                      </select>
                      <select
                        value={taskRole}
                        onChange={(e) => setTaskRole(e.target.value as Role | "")}
                        aria-label={t("task.role")}
                        className={`${field} w-full`}
                      >
                        <option value="">{t("role.none")}</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {t(roleLabel[r])}
                          </option>
                        ))}
                      </select>
                      {keyResults.length > 0 && (
                        <select
                          value={taskKr}
                          onChange={(e) => setTaskKr(e.target.value)}
                          aria-label={t("task.linkKr")}
                          className={`${field} w-full sm:col-span-2 lg:col-span-5`}
                        >
                          <option value="">
                            {t("task.linkKr")}: {t("okr.none")}
                          </option>
                          {keyResults.map((kr) => (
                            <option key={kr.id} value={kr.id}>
                              {kr.objective} — {kr.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold text-background hover:bg-accent sm:col-span-2 lg:col-span-1 lg:w-auto"
                      >
                        {t("ws.add")}
                      </button>
                    </form>
                  )}

                  <div className="space-y-1">
                    {visibleTasks.length === 0 && (
                      <p className="py-3 text-xs text-muted-foreground">{t("ws.emptyTasks")}</p>
                    )}
                    {visibleTasks.map((task) => {
                      const kr = keyResults.find((k) => k.id === task.key_result_id);
                      return (
                        <div
                          key={task.id}
                          className="group flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/40 py-3"
                        >
                          <button
                            onClick={() => toggleTask.mutate({ id: task.id, done: !task.done })}
                            disabled={!canEdit}
                            aria-label={task.title}
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              task.done
                                ? "border-accent bg-accent"
                                : "border-border hover:border-accent"
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
                          {task.due_time && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                              {task.due_time.slice(0, 5)}
                            </span>
                          )}
                          {kr && (
                            <span className="max-w-full truncate rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                              {kr.title}
                            </span>
                          )}
                          {task.assigned_role && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              {t(roleLabel[task.assigned_role])}
                            </span>
                          )}
                          <span className="shrink-0 text-[11px] text-muted-foreground/60">
                            {priorityLabel(task.priority)}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => setPendingTask(task)}
                              className="shrink-0 text-[11px] font-semibold text-muted-foreground/60 transition-colors hover:text-destructive"
                              aria-label={`${t("ws.delete")} ${task.title}`}
                            >
                              {t("ws.del")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {(
          [
            ["notes", "ws.tabNotes"],
            ["goals", "ws.tabGoals"],
            ["okr", "ws.tabOkr"],
            ["plan", "ws.tabPlan"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-3.5 text-[11px] font-semibold transition-colors ${
              (key === "notes" ? onNotes : tab === key) ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {t(label)}
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={`py-3.5 text-[11px] font-semibold transition-colors ${
            tab === "ideas" || tab === "assets" || tab === "calendar"
              ? "text-accent"
              : "text-muted-foreground"
          }`}
        >
          {t("ws.more")}
        </button>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-foreground/30 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-entry w-full rounded-t-3xl border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            {(
              [
                ["ideas", "ws.tabIdeas"],
                ["assets", "ws.tabAssets"],
                ["calendar", "ws.tabCalendar"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setMoreOpen(false);
                }}
                className="block w-full rounded-xl px-4 py-3.5 text-left text-sm font-semibold hover:bg-card"
              >
                {t(label)}
              </button>
            ))}
            <Link
              to="/shared"
              className="block w-full rounded-xl px-4 py-3.5 text-left text-sm font-semibold hover:bg-card"
            >
              {t("ws.tabShare")}
            </Link>
            <Link
              to="/profile"
              className="block w-full rounded-xl px-4 py-3.5 text-left text-sm font-semibold hover:bg-card"
            >
              {t("ws.tabProfile")}
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingNote}
        messageKey="confirm.deleteNote"
        onCancel={() => setPendingNote(null)}
        onConfirm={() => {
          if (!pendingNote) return;
          deleteNote.mutate(pendingNote);
          setSelectedId(null);
          setTab("notes");
        }}
      />
      <ConfirmDialog
        open={!!pendingTask}
        messageKey="confirm.deleteTask"
        detail={pendingTask?.title}
        onCancel={() => setPendingTask(null)}
        onConfirm={() => pendingTask && deleteTask.mutate(pendingTask.id)}
      />
      <ConfirmDialog
        open={!!pendingGoal}
        messageKey="confirm.completeGoal"
        detail={pendingGoal?.title}
        onCancel={() => setPendingGoal(null)}
        onConfirm={() =>
          pendingGoal &&
          updateGoal.mutate({
            id: pendingGoal.id,
            status: "completed",
            completed_at: new Date().toISOString(),
            progress: 100,
          })
        }
      />
      <ConfirmDialog
        open={pendingClear}
        messageKey="confirm.clearDone"
        onCancel={() => setPendingClear(false)}
        onConfirm={() => {
          for (const task of tasks.data ?? []) if (task.done) deleteTask.mutate(task.id);
        }}
      />
    </div>
  );
}
