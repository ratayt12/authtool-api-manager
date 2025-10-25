-- Create device sessions table for device authorization
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own device sessions
CREATE POLICY "Users can insert their own device sessions"
ON public.device_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own device sessions
CREATE POLICY "Users can view their own device sessions"
ON public.device_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own device sessions (for last_active)
CREATE POLICY "Users can update their own device sessions"
ON public.device_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all device sessions
CREATE POLICY "Admins can view all device sessions"
ON public.device_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all device sessions (for approval/banning)
CREATE POLICY "Admins can update all device sessions"
ON public.device_sessions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete device sessions
CREATE POLICY "Admins can delete device sessions"
ON public.device_sessions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));