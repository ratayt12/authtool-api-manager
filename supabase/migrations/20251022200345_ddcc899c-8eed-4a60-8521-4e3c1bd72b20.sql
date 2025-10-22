-- Create user actions tracking table
CREATE TABLE public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create private messages table (admin to user, one-way)
CREATE TABLE public.private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  image_url TEXT,
  video_url TEXT,
  sender_name TEXT NOT NULL DEFAULT 'SonicBot',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user requests table (for delete key, ban udid, device info)
CREATE TABLE public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  request_type TEXT NOT NULL,
  key_code TEXT,
  udid TEXT,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add video_url and username to support_messages
ALTER TABLE public.support_messages 
ADD COLUMN video_url TEXT,
ADD COLUMN username TEXT;

-- Create message read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create user sessions table for device management
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL,
  device_fingerprint TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_actions
CREATE POLICY "Admins can view all actions"
ON public.user_actions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own actions"
ON public.user_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for private_messages
CREATE POLICY "Users can view their own private messages"
ON public.private_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert private messages"
ON public.private_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all private messages"
ON public.private_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_requests
CREATE POLICY "Users can view their own requests"
ON public.user_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
ON public.user_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
ON public.user_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests"
ON public.user_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for message_read_receipts
CREATE POLICY "Users can insert their own read receipts"
ON public.message_read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view read receipts"
ON public.message_read_receipts FOR SELECT
USING (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sessions"
ON public.user_sessions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- Create indexes for performance
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_created_at ON public.user_actions(created_at DESC);
CREATE INDEX idx_private_messages_user_id ON public.private_messages(user_id);
CREATE INDEX idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX idx_user_requests_status ON public.user_requests(status);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_device_fingerprint ON public.user_sessions(device_fingerprint);