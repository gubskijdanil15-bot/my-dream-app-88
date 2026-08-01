import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/workspace-data";

export const NOTE_BUCKET = "note-files";
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export type Attachment = {
  id: string;
  note_id: string;
  owner_id: string;
  path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export function useAttachments(noteId: string | null) {
  return useQuery({
    queryKey: ["attachments", noteId],
    enabled: !!noteId,
    queryFn: async (): Promise<Attachment[]> => {
      const { data, error } = await supabase
        .from("note_attachments")
        .select("id, note_id, owner_id, path, name, mime_type, size_bytes, created_at")
        .eq("note_id", noteId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Attachment[];
    },
  });
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(-120);
}

export function useUploadAttachment(noteId: string, ownerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("too-large");
      const me = await currentUserId();
      const owner = ownerId ?? me;
      const path = `${owner}/${noteId}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const up = await supabase.storage.from(NOTE_BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (up.error) throw up.error;
      const { error } = await supabase.from("note_attachments").insert({
        note_id: noteId,
        owner_id: owner,
        uploaded_by: me,
        path,
        name: file.name.slice(0, 200),
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      if (error) {
        await supabase.storage.from(NOTE_BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", noteId] }),
  });
}

export function useDeleteAttachment(noteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Attachment) => {
      const { error } = await supabase.from("note_attachments").delete().eq("id", a.id);
      if (error) throw error;
      await supabase.storage.from(NOTE_BUCKET).remove([a.path]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", noteId] }),
  });
}

export async function attachmentUrl(path: string) {
  const { data, error } = await supabase.storage.from(NOTE_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
