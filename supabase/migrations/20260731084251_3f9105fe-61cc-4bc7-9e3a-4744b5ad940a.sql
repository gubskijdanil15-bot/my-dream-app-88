DROP TRIGGER IF EXISTS set_updated_at_notes ON public.notes;
CREATE TRIGGER set_updated_at_notes BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_goals ON public.goals;
CREATE TRIGGER set_updated_at_goals BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_members ON public.journal_members;
CREATE TRIGGER set_updated_at_members BEFORE UPDATE ON public.journal_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS log_activity_notes ON public.notes;
CREATE TRIGGER log_activity_notes AFTER INSERT OR UPDATE OR DELETE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();

DROP TRIGGER IF EXISTS log_activity_goals ON public.goals;
CREATE TRIGGER log_activity_goals AFTER INSERT OR UPDATE OR DELETE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();

DROP TRIGGER IF EXISTS log_activity_tasks ON public.tasks;
CREATE TRIGGER log_activity_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_journal_activity();