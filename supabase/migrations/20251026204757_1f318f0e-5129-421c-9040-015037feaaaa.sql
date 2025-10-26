-- Add column to track when username was last changed
ALTER TABLE public.profiles 
ADD COLUMN last_username_change timestamp with time zone DEFAULT now();

-- Add column to store user's preferred theme colors
ALTER TABLE public.profiles
ADD COLUMN theme_colors jsonb DEFAULT '{"primary": "263 70% 50%", "accent": "263 70% 60%"}'::jsonb;