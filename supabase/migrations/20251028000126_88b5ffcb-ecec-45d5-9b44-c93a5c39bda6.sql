-- Add lightning color field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lightning_color text DEFAULT '200 100% 50%';