-- Create storage bucket for support videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-videos', 'support-videos', true)
ON CONFLICT (id) DO NOTHING;