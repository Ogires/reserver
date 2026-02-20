-- Add missing INSERT and UPDATE policies for authenticated users
-- Note: In a production B2B SaaS, this would be scoped to tenant_id = current_tenant_id() or owner_id = auth.uid()
-- For this MVP, we allow any authenticated user to manage these records.

-- Tenants
CREATE POLICY "Authenticated users can insert tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (true);

-- Services 
CREATE POLICY "Authenticated users can insert services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update services" ON public.services
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete services" ON public.services
  FOR DELETE TO authenticated USING (true);

-- Schedules
CREATE POLICY "Authenticated users can insert schedules" ON public.schedules
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedules" ON public.schedules
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete schedules" ON public.schedules
  FOR DELETE TO authenticated USING (true);
