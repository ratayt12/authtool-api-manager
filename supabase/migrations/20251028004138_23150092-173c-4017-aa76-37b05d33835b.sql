-- Create table for weekly spin tracking
CREATE TABLE IF NOT EXISTS public.weekly_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_won INTEGER NOT NULL,
  spin_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.weekly_spins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own spins"
  ON public.weekly_spins
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spins"
  ON public.weekly_spins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_weekly_spins_user_date ON public.weekly_spins(user_id, spin_date DESC);