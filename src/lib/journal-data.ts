import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./workspace-data";

export type Permission = "read" | "edit";

export type Membership = {
  id: string;
  owner_id: string;
  member_id: string;
  permission: Permission;
  created_at: string;
  name: string | null;
};

export type ActivityEntry = {
  id: string;
  actor_id: string;
  entity_type: string;
  entity_title: string | null;
  action: string;
  created_at: string;
  name: string | null;
};

async function namesFor(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, string | null>();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, p.display_name]));
}

export function useMyJournalCode() {
  return useQuery({
    queryKey: ["journal-code"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_journal_code");
      if (error) throw error;
      return data as string;
    },
    staleTime: Infinity,
  });
}

/** People who joined MY notebook. */
export function useMembers() {
  return useQuery({
    queryKey: ["journal-members"],
    queryFn: async (): Promise<Membership[]> => {
      const me = await currentUserId();
      const { data, error } = await supabase
        .from("journal_members")
        .select("id, owner_id, member_id, permission, created_at")
        .eq("owner_id", me)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const names = await namesFor(rows.map((r) => r.member_id));
      return rows.map((r) => ({
        ...r,
        permission: r.permission as Permission,
        name: names.get(r.member_id) ?? null,
      }));
    },
  });
}

/** Notebooks I joined. */
export function useJoinedJournals() {
  return useQuery({
    queryKey: ["journals-joined"],
    queryFn: async (): Promise<Membership[]> => {
      const me = await currentUserId();
      const { data, error } = await supabase
        .from("journal_members")
        .select("id, owner_id, member_id, permission, created_at")
        .eq("member_id", me)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      const names = await namesFor(rows.map((r) => r.owner_id));
      return rows.map((r) => ({
        ...r,
        permission: r.permission as Permission,
        name: names.get(r.owner_id) ?? null,
      }));
    },
  });
}

export function useJoinJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("join_journal", { _code: code.trim() });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journals-joined"] }),
  });
}

export function useSetPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; permission: Permission }) => {
      const { error } = await supabase
        .from("journal_members")
        .update({ permission: input.permission })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-members"] }),
  });
}

export function useRemoveMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-members"] });
      qc.invalidateQueries({ queryKey: ["journals-joined"] });
    },
  });
}

/** Changes other people made in my notebook. */
export function useActivity() {
  return useQuery({
    queryKey: ["journal-activity"],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const me = await currentUserId();
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, actor_id, entity_type, entity_title, action, created_at")
        .eq("owner_id", me)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data ?? [];
      const names = await namesFor(rows.map((r) => r.actor_id));
      return rows.map((r) => ({ ...r, name: names.get(r.actor_id) ?? null }));
    },
  });
}
