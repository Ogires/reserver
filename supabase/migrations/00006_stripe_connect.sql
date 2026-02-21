-- Migration 00006: Stripe Connect Accounts

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- Create an index to quickly look up tenants by their Stripe Account ID (often needed in Webhook payloads)
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_account_id ON public.tenants(stripe_account_id);
