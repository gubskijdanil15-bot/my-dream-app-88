CREATE TABLE public.note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  path text NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX note_attachments_note_id_idx ON public.note_attachments(note_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_attachments TO authenticated;
GRANT ALL ON public.note_attachments TO service_role;

ALTER TABLE public.note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own or shared attachments" ON public.note_attachments
FOR SELECT TO authenticated
USING (public.journal_permission(owner_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Write own or editable attachments" ON public.note_attachments
FOR INSERT TO authenticated
WITH CHECK (public.journal_permission(owner_id, auth.uid()) = ANY (ARRAY['owner','edit']));

CREATE POLICY "Delete own or editable attachments" ON public.note_attachments
FOR DELETE TO authenticated
USING (public.journal_permission(owner_id, auth.uid()) = ANY (ARRAY['owner','edit']));