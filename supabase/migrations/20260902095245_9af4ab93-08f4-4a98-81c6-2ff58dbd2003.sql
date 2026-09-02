CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO authenticated;
GRANT ALL ON public.boards TO service_role;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boards_select" ON public.boards FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "boards_insert" ON public.boards FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "boards_update" ON public.boards FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "boards_delete" ON public.boards FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE TRIGGER set_updated_at_boards BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_columns TO authenticated;
GRANT ALL ON public.board_columns TO service_role;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_columns_select" ON public.board_columns FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "board_columns_insert" ON public.board_columns FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "board_columns_update" ON public.board_columns FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "board_columns_delete" ON public.board_columns FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE TRIGGER set_updated_at_board_columns BEFORE UPDATE ON public.board_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.board_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_cards TO authenticated;
GRANT ALL ON public.board_cards TO service_role;
ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "board_cards_select" ON public.board_cards FOR SELECT TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IS NOT NULL);
CREATE POLICY "board_cards_insert" ON public.board_cards FOR INSERT TO authenticated
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "board_cards_update" ON public.board_cards FOR UPDATE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'))
  WITH CHECK (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE POLICY "board_cards_delete" ON public.board_cards FOR DELETE TO authenticated
  USING (public.journal_permission(user_id, auth.uid()) IN ('owner','edit'));
CREATE TRIGGER set_updated_at_board_cards BEFORE UPDATE ON public.board_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_board_columns_board ON public.board_columns(board_id, position);
CREATE INDEX idx_board_cards_column ON public.board_cards(column_id, position);