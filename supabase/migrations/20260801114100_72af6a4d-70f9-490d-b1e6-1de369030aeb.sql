CREATE POLICY "Read note files in accessible notebooks" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'note-files'
  AND public.journal_permission(((storage.foldername(name))[1])::uuid, auth.uid()) IS NOT NULL
);

CREATE POLICY "Upload note files when editor" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'note-files'
  AND public.journal_permission(((storage.foldername(name))[1])::uuid, auth.uid()) = ANY (ARRAY['owner','edit'])
);

CREATE POLICY "Delete note files when editor" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'note-files'
  AND public.journal_permission(((storage.foldername(name))[1])::uuid, auth.uid()) = ANY (ARRAY['owner','edit'])
);