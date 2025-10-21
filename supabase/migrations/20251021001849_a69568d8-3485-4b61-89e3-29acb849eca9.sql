-- Create support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  image_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all support messages" 
ON public.support_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert support messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Create storage bucket for support images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-images', 'support-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view support images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'support-images');

CREATE POLICY "Admins can upload support images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'support-images' AND has_role(auth.uid(), 'admin'::app_role));