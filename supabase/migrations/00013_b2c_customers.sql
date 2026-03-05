-- Migration: Support for B2C Global Customers

-- 1. Link customers to Supabase Auth Users
ALTER TABLE public.customers ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD CONSTRAINT customers_auth_id_key UNIQUE (auth_id);

-- 2. Clean up existing customer RLS and apply strict rules
-- Note: 'Anyone can insert customers' logic is usually bypassed by service_role in Next.js Server Actions,
-- but we define it here if we want direct client-side insertion.
DROP POLICY IF EXISTS "Customers are viewable by everyone" ON public.customers;
DROP POLICY IF EXISTS "Anyone can insert customers" ON public.customers;

-- Enable RLS (Should already be enabled, but making sure)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own profile
CREATE POLICY "Customers can view own profile" ON public.customers
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_id);

-- Policy: Customers can update their own profile
CREATE POLICY "Customers can update own profile" ON public.customers
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_id);

-- Policy: Tenants can view customers who have booked with them
CREATE POLICY "Tenants can view their booked customers" ON public.customers
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT customer_id FROM public.bookings b
            JOIN public.tenants t ON b.tenant_id = t.id
            WHERE t.owner_id = auth.uid()
        )
    );

-- 3. Update Bookings RLS to allow B2C customers to see their bookings
-- First, ensure bookings has RLS enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Note: We assume "Tenants can view own bookings" is already there from `00004_secure_rls_policies.sql`.
-- We just need to ADD policies for the B2C customers.

-- Policy: Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings" ON public.bookings
    FOR SELECT TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_id = auth.uid()
        )
    );

-- Policy: Customers can update their own bookings (e.g., to cancel them)
CREATE POLICY "Customers can update their own bookings" ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_id = auth.uid()
        )
    );
