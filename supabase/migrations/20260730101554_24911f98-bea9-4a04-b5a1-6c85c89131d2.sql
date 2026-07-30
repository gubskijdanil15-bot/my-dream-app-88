-- rich text body
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS body_html text NOT NULL DEFAULT '';

-- ---------- journal codes ----------
CREATE TABLE public.journal_codes (
  user_id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.journal_codes TO authenticated;
GRANT ALL ON public.journal_codes TO service_role;
ALTER TABLE public.journal_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own code" ON public.journal_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------- journal members ----------
CREATE TABLE public.journal_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  member_id uuid NOT NULL,
  permission text NOT NULL DEFAULT 'read',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journal_members_permission_check CHECK (permission IN ('read','edit')),
  CONSTRAINT journal_members_not_self CHECK (owner_id <> member_id),
  UNIQUE (owner_id, member_id)
);
GRANT SELECT, UPDATE, DELETE ON public.journal_members TO authenticated;
GRANT ALL ON public.journal_members TO service_role;
ALTER TABLE public.journal_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner and member can read membership" ON public.journal_members
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR auth.uid() = member_id);
CREATE POLICY "Owner can update membership" ON public.journal_members
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or member can remove membership" ON public.journal_members
  FOR DELETE TO authenticated USING (auth.uid() = owner_id OR auth.uid() = member_id);
CREATE TRIGGER journal_members_updated_at BEFORE UPDATE ON public.journal_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- permission helper ----------
CREATE OR REPLACE FUNCTION public.journal_permission(_owner uuid, _user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _user IS NULL THEN NULL
    WHEN _owner = _user THEN 'owner'
    ELSE (SELECT permission FROM public.journal_members WHERE owner_id = _owner AND member_id = _user)
  END
$$;
REVOKE ALL ON FUNCTION public.journal_permission(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.journal_permission(uuid, uuid) TO authenticated, service_role;

-- ---------- activity log ----------
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_title text,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or actor can read activity" ON public.activity_log
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR auth.uid() = actor_id);
CREATE INDEX activity_log_owner_created_idx ON public.activity_log (owner_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_journal_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _title text; _action text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _owner := OLD.user_id; _title := OLD.title; _action := 'delete';
  ELSIF TG_OP = 'UPDATE' THEN
    _owner := NEW.user_id; _title := NEW.title; _action := 'update';
  ELSE
    _owner := NEW.user_id; _title := NEW.title; _action := 'create';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> _owner THEN
    INSERT INTO public.activity_log (owner_id, actor_id, entity_type, entity_title, action)
    VALUES (_owner, auth.uid(), TG_TABLE_NAME, left(coalesce(_title,''), 200), _action);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.log_journal_activity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notes_activity AFTER INSERT OR UPDATE OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();
CREATE TRIGGER goals_activity AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();
CREATE TRIGGER tasks_activity AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();

-- ---------- shared access policies ----------
DROP POLICY IF EXISTS "Users manage own notes" ON public.notes;
CREATE POLICY "Read own or shared notes" ON public.notes
  FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable notes" ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Update own or editable notes" ON public.notes
  FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Delete own or editable notes" ON public.notes
  FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));

DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
CREATE POLICY "Read own or shared goals" ON public.goals
  FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable goals" ON public.goals
  FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Update own or editable goals" ON public.goals
  FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Delete own or editable goals" ON public.goals
  FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));

DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;
CREATE POLICY "Read own or shared tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "Write own or editable tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Update own or editable tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "Delete own or editable tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));

-- profiles: owners and members of a shared journal can see each other's display name
CREATE POLICY "Journal partners read profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_members m
      WHERE (m.owner_id = profiles.id AND m.member_id = auth.uid())
         OR (m.member_id = profiles.id AND m.owner_id = auth.uid())
    )
  );

-- ---------- RPCs ----------
CREATE OR REPLACE FUNCTION public.my_journal_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _code text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT code INTO _code FROM public.journal_codes WHERE user_id = _uid;
  IF _code IS NOT NULL THEN RETURN _code; END IF;
  FOR i IN 1..20 LOOP
    _code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    BEGIN
      INSERT INTO public.journal_codes (user_id, code) VALUES (_uid, _code);
      RETURN _code;
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO _code FROM public.journal_codes WHERE user_id = _uid;
      IF _code IS NOT NULL THEN RETURN _code; END IF;
    END;
  END LOOP;
  RAISE EXCEPTION 'Could not allocate a code';
END $$;
REVOKE ALL ON FUNCTION public.my_journal_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_journal_code() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.join_journal(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id INTO _owner FROM public.journal_codes WHERE code = btrim(_code);
  IF _owner IS NULL THEN RAISE EXCEPTION 'No notebook found for that code'; END IF;
  IF _owner = _uid THEN RAISE EXCEPTION 'That is your own code'; END IF;
  INSERT INTO public.journal_members (owner_id, member_id, permission)
  VALUES (_owner, _uid, 'read')
  ON CONFLICT (owner_id, member_id) DO NOTHING;
  RETURN _owner;
END $$;
REVOKE ALL ON FUNCTION public.join_journal(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_journal(text) TO authenticated, service_role;