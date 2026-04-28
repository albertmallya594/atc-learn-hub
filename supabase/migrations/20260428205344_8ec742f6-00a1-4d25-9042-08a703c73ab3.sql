DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);