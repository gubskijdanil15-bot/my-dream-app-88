import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/workspace-data";

export type Board = {
  id: string;
  name: string;
  description: string | null;
  position: number;
};

export type BoardColumn = {
  id: string;
  board_id: string;
  name: string;
  position: number;
};

export type BoardCard = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  detail: string | null;
  position: number;
};

async function ownerOrSelf(ownerId?: string) {
  return ownerId ?? (await currentUserId());
}

/* ---------------- boards ---------------- */

export function useBoards(ownerId?: string) {
  return useQuery({
    queryKey: ["boards", ownerId ?? "me"],
    queryFn: async (): Promise<Board[]> => {
      const owner = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("boards")
        .select("id, name, description, position")
        .eq("user_id", owner)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBoard(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description: string | null }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { data, error } = await supabase
        .from("boards")
        .insert({ ...input, user_id })
        .select("id")
        .single();
      if (error) throw error;
      const columns = ["To do", "Doing", "Done"].map((name, position) => ({
        board_id: data.id,
        user_id,
        name,
        position,
      }));
      const { error: colError } = await supabase.from("board_columns").insert(columns);
      if (colError) throw colError;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["board-columns"] });
    },
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("boards").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boards"] }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["board-columns"] });
      qc.invalidateQueries({ queryKey: ["board-cards"] });
    },
  });
}

/* ---------------- columns ---------------- */

export function useBoardColumns(boardId?: string) {
  return useQuery({
    enabled: !!boardId,
    queryKey: ["board-columns", boardId],
    queryFn: async (): Promise<BoardColumn[]> => {
      const { data, error } = await supabase
        .from("board_columns")
        .select("id, board_id, name, position")
        .eq("board_id", boardId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateColumn(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { board_id: string; name: string; position: number }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("board_columns").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-columns"] }),
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; position?: number }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("board_columns").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-columns"] }),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board-columns"] });
      qc.invalidateQueries({ queryKey: ["board-cards"] });
    },
  });
}

/* ---------------- cards ---------------- */

export function useBoardCards(boardId?: string) {
  return useQuery({
    enabled: !!boardId,
    queryKey: ["board-cards", boardId],
    queryFn: async (): Promise<BoardCard[]> => {
      const { data, error } = await supabase
        .from("board_cards")
        .select("id, board_id, column_id, title, detail, position")
        .eq("board_id", boardId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCard(ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      board_id: string;
      column_id: string;
      title: string;
      detail: string | null;
      position: number;
    }) => {
      const user_id = await ownerOrSelf(ownerId);
      const { error } = await supabase.from("board_cards").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-cards"] }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      detail?: string | null;
      column_id?: string;
      position?: number;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("board_cards").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-cards"] }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("board_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-cards"] }),
  });
}
