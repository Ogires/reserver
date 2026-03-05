-- Create the tenant_integrations table to store OAuth credentials
CREATE TABLE tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'google_calendar'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- Add external_event_id to bookings to track the synced event
ALTER TABLE bookings
ADD COLUMN external_event_id TEXT;

-- RLS for tenant_integrations
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own integrations
CREATE POLICY "Tenants can read their own integrations"
ON tenant_integrations FOR SELECT
USING (tenant_id IN (
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
));

-- Tenants can insert their own integrations
CREATE POLICY "Tenants can insert their own integrations"
ON tenant_integrations FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
));

-- Tenants can update their own integrations
CREATE POLICY "Tenants can update their own integrations"
ON tenant_integrations FOR UPDATE
USING (tenant_id IN (
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
))
WITH CHECK (tenant_id IN (
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
));

-- Tenants can delete their own integrations
CREATE POLICY "Tenants can delete their own integrations"
ON tenant_integrations FOR DELETE
USING (tenant_id IN (
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
));

-- Function to update updated_at timestamp
CREATE TRIGGER set_tenant_integrations_updated_at
BEFORE UPDATE ON tenant_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
