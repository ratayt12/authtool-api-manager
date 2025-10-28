-- Fix the function search path by setting it to public
CREATE OR REPLACE FUNCTION delete_old_private_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.private_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;