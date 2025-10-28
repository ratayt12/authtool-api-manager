-- Fix security vulnerability: Restrict support_messages to only show user's own messages or admin
DROP POLICY IF EXISTS "Users can view all support messages" ON public.support_messages;

CREATE POLICY "Users can view their own support messages or admins can view all"
ON public.support_messages
FOR SELECT
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix security vulnerability: Restrict read receipts to only the user who created them or admins
DROP POLICY IF EXISTS "Users can view read receipts" ON public.message_read_receipts;

CREATE POLICY "Users can view their own read receipts or admins can view all"
ON public.message_read_receipts
FOR SELECT
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);