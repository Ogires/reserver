-- Security Migration: Enforce strict multi-tenant isolation
-- Drops permissive INSERT/UPDATE/DELETE policies and replaces them with strict auth.uid() bound policies

-- 1. Tenants Table
DROP POLICY IF EXISTS "Authenticated users can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Auth can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Auth can update tenants" ON public.tenants;

CREATE POLICY "Tenant owners can insert their own tenant" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tenant owners can update their own tenant" ON public.tenants
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- 2. Services Table
DROP POLICY IF EXISTS "Authenticated users can insert services" ON public.services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON public.services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON public.services;
DROP POLICY IF EXISTS "Auth can insert services" ON public.services;
DROP POLICY IF EXISTS "Auth can update services" ON public.services;
DROP POLICY IF EXISTS "Auth can delete services" ON public.services;

CREATE POLICY "Tenant owners can insert services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can update services" ON public.services
  FOR UPDATE TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can delete services" ON public.services
  FOR DELETE TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- 3. Schedules Table
DROP POLICY IF EXISTS "Authenticated users can insert schedules" ON public.schedules;
DROP POLICY IF EXISTS "Authenticated users can update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Authenticated users can delete schedules" ON public.schedules;
DROP POLICY IF EXISTS "Auth can insert schedules" ON public.schedules;
DROP POLICY IF EXISTS "Auth can update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Auth can delete schedules" ON public.schedules;

CREATE POLICY "Tenant owners can insert schedules" ON public.schedules
  FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can update schedules" ON public.schedules
  FOR UPDATE TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can delete schedules" ON public.schedules
  FOR DELETE TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
