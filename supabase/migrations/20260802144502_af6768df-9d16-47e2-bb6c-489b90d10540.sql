-- OBJECTIVES
CREATE TABLE public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  timeframe text,
  category text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objectives TO authenticated;
GRANT ALL ON public.objectives TO service_role;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or shared objectives" ON public.objectives FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable objectives" ON public.objectives FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Update own or editable objectives" ON public.objectives FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Delete own or editable objectives" ON public.objectives FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));

CREATE TRIGGER objectives_updated_at BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER objectives_activity AFTER INSERT OR UPDATE OR DELETE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();

-- KEY RESULTS
CREATE TABLE public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_value numeric NOT NULL DEFAULT 100,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.key_results TO authenticated;
GRANT ALL ON public.key_results TO service_role;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or shared key results" ON public.key_results FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable key results" ON public.key_results FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Update own or editable key results" ON public.key_results FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));
CREATE POLICY "Delete own or editable key results" ON public.key_results FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) = ANY (ARRAY['owner','edit']));

CREATE TRIGGER key_results_updated_at BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX key_results_objective_idx ON public.key_results (objective_id);
CREATE INDEX objectives_user_idx ON public.objectives (user_id);

-- TASKS: time, reminders, kanban, key result link, external links
ALTER TABLE public.tasks
  ADD COLUMN due_time time,
  ADD COLUMN remind_at timestamptz,
  ADD COLUMN stage text NOT NULL DEFAULT 'idea',
  ADD COLUMN key_result_id uuid REFERENCES public.key_results(id) ON DELETE SET NULL,
  ADD COLUMN links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- NOTES: external links
ALTER TABLE public.notes
  ADD COLUMN links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- PROFILES: notification preferences
ALTER TABLE public.profiles
  ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{"taskReminders":true,"dailyRecap":false,"system":true}'::jsonb;