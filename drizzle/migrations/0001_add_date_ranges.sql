ALTER TABLE public.tasks ADD COLUMN due_end date;
ALTER TABLE public.boards ADD COLUMN start_date date;
ALTER TABLE public.boards ADD COLUMN end_date date;
COMMENT ON COLUMN public.tasks.due_end IS 'Optional end date; task spans due_date..due_end when set';
COMMENT ON COLUMN public.boards.start_date IS 'Optional project start date';
COMMENT ON COLUMN public.boards.end_date IS 'Optional project end date';