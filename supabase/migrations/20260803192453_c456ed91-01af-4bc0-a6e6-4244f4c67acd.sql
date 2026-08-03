
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_role text;

CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  detail text,
  tag text NOT NULL DEFAULT 'reels',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or shared ideas" ON public.ideas FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable ideas" ON public.ideas FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Update own or editable ideas" ON public.ideas FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Delete own or editable ideas" ON public.ideas FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE TRIGGER set_updated_at_ideas BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, voter_id)
);
GRANT SELECT, INSERT, DELETE ON public.idea_votes TO authenticated;
GRANT ALL ON public.idea_votes TO service_role;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read votes in visible notebooks" ON public.idea_votes FOR SELECT TO authenticated
  USING (public.journal_permission(owner_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Vote in visible notebooks" ON public.idea_votes FOR INSERT TO authenticated
  WITH CHECK (voter_id = auth.uid() AND public.journal_permission(owner_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Remove own vote" ON public.idea_votes FOR DELETE TO authenticated
  USING (voter_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'camera',
  owner_note text,
  assigned_to text,
  packed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment TO authenticated;
GRANT ALL ON public.equipment TO service_role;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or shared equipment" ON public.equipment FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable equipment" ON public.equipment FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Update own or editable equipment" ON public.equipment FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Delete own or editable equipment" ON public.equipment FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE TRIGGER set_updated_at_equipment BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  contact text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or shared locations" ON public.locations FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable locations" ON public.locations FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Update own or editable locations" ON public.locations FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Delete own or editable locations" ON public.locations FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE TRIGGER set_updated_at_locations BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
