-- Create Tenants Table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    preferred_currency TEXT NOT NULL DEFAULT 'EUR',
    default_language TEXT NOT NULL DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
CREATE POLICY "Tenants are viewable by everyone" ON public.tenants
  FOR SELECT USING (true);


-- Create Services Table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_translatable JSONB NOT NULL DEFAULT '{"es": "Servicio", "en": "Service"}',
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services Policies
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (true);


-- Create Schedules Table (General Opening Hours)
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday...
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    UNIQUE(tenant_id, day_of_week)
);

-- Enable RLS for schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Schedules Policies
CREATE POLICY "Schedules are viewable by everyone" ON public.schedules
  FOR SELECT USING (true);


-- Create Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;


-- Create Bookings Table
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid_online', 'paid_local');

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Booking Policies
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true); -- Refine later with auth.

-- Basic triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tenant_modtime BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_service_modtime BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_booking_modtime BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
