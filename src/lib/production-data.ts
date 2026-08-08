import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, type StatusFilter } from "@/lib/workspace-data";

/** Suggested content types — users may type any custom tag. */
export const IDEA_TAGS = ["reels", "shorts", "shortfilm", "bts"] as const;
export type PresetIdeaTag = (typeof IDEA_TAGS)[number];
/** Any free-form content type. */
export type IdeaTag = string;

export const EQUIPMENT_CATEGORIES = ["camera", "audio", "lighting", "grip", "other"] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export type Idea = {
  id: string;
  title: string;
  detail: string | null;
  tag: IdeaTag;
  status: "active" | "completed";
  votes: number;
  voted: boolean;
};

export type Equipment = {
  id: string;
  name: string;
  category: EquipmentCategory;
  owner_note: string | null;
  assigned_to: string | null;
  packed: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  notes: string | null;
};

async function ownerOrSelf(ownerId?: string) {
  return ownerId ?? (await currentUserId());
}

/* ---------------- ideas ---------------- */

export function useIdeas(ownerId?: string, filter: StatusFilter = "active") {
  return useQuery({
    queryKey: ["ideas", ownerId ?? "me", filter],
    queryFn: async (): Promise<Idea[]> => {
      const owner = await ownerOrSelf(ownerId);
      const me = await currentUserId();
      let query = supabase
        .from("ideas")
        .select("id, title, detail, tag, status")
        .eq("user_id", owner);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const { data: votes, error: voteError } = await supabase
        .from("idea_votes")
        .select("idea_id, voter_id")
        .in(
          "idea_id",
          rows.map((r) => r.id),
        );
      if (voteError) throw voteError;
      return rows.map((r) => {
        const mine = (votes ?? []).filter((v) => v.idea_id === r.id);
        return {
          id: r.id,
          title: r.title,
          detail: r.detail,
          tag: (r.tag ?? "reels") as IdeaTag,
          status: (r.status ?? "active") as Idea["status"],
          votes: mine.length,
          voted: mine.some((v) => v.voter_id === me),
        };
      });
    },
  });
}

export function useCreateIdea(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; detail: string | null; tag: IdeaTag }) => {
      const user_id = await ownerOrSelf(ownerId);
      const created_by = await currentUserId();
      const { error } = await supabase.from("ideas").insert({ ...input, user_id, created_by });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });
}

export function useUpdateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: Idea["status"] }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("ideas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });
}

export function useToggleVote(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ideaId: string; voted: boolean }) => {
      const voter_id = await currentUserId();
      if (input.voted) {
        const { error } = await supabase
          .from("idea_votes")
          .delete()
          .eq("idea_id", input.ideaId)
          .eq("voter_id", voter_id);
        if (error) throw error;
        return;
      }
      const owner_id = await ownerOrSelf(ownerId);
      const { error } = await supabase
        .from("idea_votes")
        .insert({ idea_id: input.ideaId, owner_id, voter_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });
}

/* ---------------- equipment ---------------- */

export function useEquipment(ownerId?: string) {
  return useQuery({
    queryKey: ["equipment", ownerId ?? "me"],
    queryFn: async (): Promise<Equipment[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, category, owner_note, assigned_to, packed")
        .eq("user_id", owner)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e) => ({ ...e, category: e.category as EquipmentCategory }));
    },
  });
}

export function useCreateEquipment(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      category: EquipmentCategory;
      owner_note: string | null;
      assigned_to: string | null;
    }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("equipment").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; packed?: boolean }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("equipment").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipment"] }),
  });
}

/* ---------------- locations ---------------- */

export function useLocations(ownerId?: string) {
  return useQuery({
    queryKey: ["locations", ownerId ?? "me"],
    queryFn: async (): Promise<Location[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, address, contact, notes")
        .eq("user_id", owner)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLocation(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      address: string | null;
      contact: string | null;
      notes: string | null;
    }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("locations").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}
