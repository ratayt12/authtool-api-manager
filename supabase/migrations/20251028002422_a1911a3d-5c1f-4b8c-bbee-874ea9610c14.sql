-- Add segment_color column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS segment_color text DEFAULT '200 100% 50%';

-- Create function to auto-delete old private messages after 24 hours
CREATE OR REPLACE FUNCTION delete_old_private_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.private_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run every hour using pg_cron
-- First, enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run every hour
SELECT cron.schedule(
  'delete-old-private-messages',
  '0 * * * *', -- Run at the start of every hour
  'SELECT delete_old_private_messages();'
);