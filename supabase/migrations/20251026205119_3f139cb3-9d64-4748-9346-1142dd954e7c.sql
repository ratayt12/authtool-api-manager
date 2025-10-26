-- Add column to store user's preferred background color
ALTER TABLE public.profiles
ADD COLUMN background_color text DEFAULT '240 10% 3.9%';