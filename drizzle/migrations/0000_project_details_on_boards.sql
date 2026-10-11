ALTER TABLE public.boards
  ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  ADD COLUMN script text,
  ADD COLUMN dispo text,
  ADD COLUMN locations text,
  ADD COLUMN production_notes text,
  ADD COLUMN completed_at timestamptz;
COMMENT ON TABLE public.boards IS 'Projects with custom workflow columns and cards; existing journal-sharing policies apply to project details.';