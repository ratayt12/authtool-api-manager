-- Add ban fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ban_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ban_message TEXT;