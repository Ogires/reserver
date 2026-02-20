-- Add owner_id to associate a tenant with a Supabase Auth User
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Optional: Update RLS policies to restrict tenant access to owners
-- (Skipping strict RLS updates for this initial migration phase to keep the UI functional)
