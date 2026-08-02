import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ExternalLink = { label: string; url: string };

export function parseLinks(value: unknown): ExternalLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((l): l is ExternalLink =>
      !!l && typeof l === "object" && typeof (l as ExternalLink).url === "string",
    )
    .map((l) => ({ label: String(l.label ?? l.url).slice(0, 80), url: l.url }));
}

export type Note = {
  id: string;
  title: string;
  body: string;
  body_html: string;
  links: ExternalLink[];
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  title: string;
  detail: string | null;
  target_date: string | null;
  progress: number;
  archived: boolean;
};

export const STAGES = [
  "idea",
  "script",
  "production",
  "post",
  "published",
] as const;
export type Stage = (typeof STAGES)[number];

export type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  due_date: string;
  due_time: string | null;
  remind_at: string | null;
  stage: Stage;
  key_result_id: string | null;
  links: ExternalLink[];
};

export type KeyResult = {
  id: string;
  objective_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
};

export type Objective = {
  id: string;
  title: string;
  description: string | null;
  timeframe: string | null;
  category: string | null;
  archived: boolean;
  key_results: KeyResult[];
};

export const krProgress = (kr: KeyResult) =>
  kr.target_value > 0
    ? Math.max(0, Math.min(100, Math.round((kr.current_value / kr.target_value) * 100)))
    : 0;

export const objectiveProgress = (o: Objective) =>
  o.key_results.length === 0
    ? 0
    : Math.round(o.key_results.reduce((sum, kr) => sum + krProgress(kr), 0) / o.key_results.length);

export const todayISO = () => new Date().toISOString().slice(0, 10);


export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

async function ownerOrSelf(ownerId?: string) {
  return ownerId ?? (await currentUserId());
}

/* ---------------- notes ---------------- */

export function useNotes(ownerId?: string) {
  return useQuery({
    queryKey: ["notes", ownerId ?? "me"],
    queryFn: async (): Promise<Note[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, body, body_html, links, created_at, updated_at")
        .eq("user_id", owner)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((n) => ({ ...n, links: parseLinks(n.links) }));
    },
  });
}

export function useCreateNote(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const user_id = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id, title })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      body?: string;
      body_html?: string;
      links?: ExternalLink[];
    }) => {
      const { id, ...rest } = input;
      const patch = { ...rest, ...(rest.links ? { links: rest.links as unknown as Json } : {}) };
      const { error } = await supabase.from("notes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}


export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

/* ---------------- goals ---------------- */

export function useGoals(ownerId?: string) {
  return useQuery({
    queryKey: ["goals", ownerId ?? "me"],
    queryFn: async (): Promise<Goal[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("goals")
        .select("id, title, detail, target_date, progress, archived")
        .eq("user_id", owner)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });
}

export function useCreateGoal(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; target_date: string | null }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("goals").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; progress?: number; archived?: boolean }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("goals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

/* ---------------- tasks ---------------- */

const TASK_COLUMNS =
  "id, title, priority, done, due_date, due_time, remind_at, stage, key_result_id, links";

const mapTask = (row: Record<string, unknown>): Task => ({
  id: row['id'] as string,
  title: row['title'] as string,
  priority: row['priority'] as Task["priority"],
  done: row['done'] as boolean,
  due_date: row['due_date'] as string,
  due_time: (row['due_time'] as string | null) ?? null,
  remind_at: (row['remind_at'] as string | null) ?? null,
  stage: ((row['stage'] as Stage) ?? "idea") as Stage,
  key_result_id: (row['key_result_id'] as string | null) ?? null,
  links: parseLinks(row['links']),
});

export function useTasks(due: string, ownerId?: string) {
  return useQuery({
    queryKey: ["tasks", due, ownerId ?? "me"],
    queryFn: async (): Promise<Task[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq("user_id", owner)
        .eq("due_date", due)
        .order("due_time", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTask);
    },
  });
}

/** All tasks in a date range — used by the Kanban board and content calendar. */
export function useTasksRange(from: string, to: string, ownerId?: string) {
  return useQuery({
    queryKey: ["tasks-range", from, to, ownerId ?? "me"],
    queryFn: async (): Promise<Task[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq("user_id", owner)
        .gte("due_date", from)
        .lte("due_date", to)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTask);
    },
  });
}

export function useCreateTask(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      priority: Task["priority"];
      due_date: string;
      due_time?: string | null;
      remind_at?: string | null;
      key_result_id?: string | null;
      stage?: Stage;
    }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("tasks").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      priority?: Task["priority"];
      due_date?: string;
      due_time?: string | null;
      remind_at?: string | null;
      stage?: Stage;
      key_result_id?: string | null;
      links?: ExternalLink[];
    }) => {
      const { id, ...rest } = input;
      const patch = { ...rest, ...(rest.links ? { links: rest.links as unknown as Json } : {}) };
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-range"] });
    },
  });
}


export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ done: input.done })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-range"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
