-- Add description and image_url to Services

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS description_translatable JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS image_url TEXT;
