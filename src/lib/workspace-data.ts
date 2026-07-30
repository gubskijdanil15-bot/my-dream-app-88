import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Note = {
  id: string;
  title: string;
  body: string;
  body_html: string;
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

export type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  due_date: string;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function ownerOrSelf(ownerId?: string) {
  const uid = ownerId ?? (await currentUserId());
  if (!uid) throw Object.assign(new Error('Unauthenticated'), { code: 'UNAUTH' });
  return uid;
}

/* ---------------- notes ---------------- */

export function useNotes(ownerId?: string) {
  return useQuery({
    queryKey: ["notes", ownerId ?? "me"],
    queryFn: async (): Promise<Note[]> => {
      try {
        const owner = await ownerOrSelf(ownerId);
        const { data, error } = await supabase
          .from("notes")
          .select("id, title, body, body_html, created_at, updated_at")
          .eq("user_id", owner)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      } catch (e: any) {
        if (e?.code === 'UNAUTH') return [];
        throw e;
      }
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
    mutationFn: async (input: { id: string; title?: string; body?: string; body_html?: string }) => {
      const { id, ...patch } = input;
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
      try {
        const owner = await ownerOrSelf(ownerId);
        const { data, error } = await supabase
          .from("goals")
          .select("id, title, detail, target_date, progress, archived")
          .eq("user_id", owner)
          .eq("archived", false)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as Goal[];
      } catch (e: any) {
        if (e?.code === 'UNAUTH') return [] as Goal[];
        throw e;
      }
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

export function useTasks(due: string, ownerId?: string) {
  return useQuery({
    queryKey: ["tasks", due, ownerId ?? "me"],
    queryFn: async (): Promise<Task[]> => {
      try {
        const owner = await ownerOrSelf(ownerId);
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, priority, done, due_date")
          .eq("user_id", owner)
          .eq("due_date", due)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []) as Task[];
      } catch (e: any) {
        if (e?.code === 'UNAUTH') return [] as Task[];
        throw e;
      }
    },
  });
}

export function useCreateTask(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; priority: Task["priority"]; due_date: string }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("tasks").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
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
