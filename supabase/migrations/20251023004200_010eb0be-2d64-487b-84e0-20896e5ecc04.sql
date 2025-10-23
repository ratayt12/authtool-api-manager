-- Allow users to insert their own support messages
CREATE POLICY "Users can insert support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to mark private messages as read
CREATE POLICY "Users can mark their own messages as read"
ON public.private_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage private messages
CREATE POLICY "Admins can update private messages"
ON public.private_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));