-- set_updated_at already SECURITY INVOKER by default but make explicit + search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke public execute on SECURITY DEFINER trigger functions (only triggers need them)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_answer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;

-- has_role is intentionally callable by signed-in users (used in RLS policies via auth context); keep it.
-- Tighten notifications insert: only authenticated users can insert (triggers run as definer anyway)
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);