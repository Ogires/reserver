-- 1. Add slot_interval_minutes to tenants
ALTER TABLE public.tenants ADD COLUMN slot_interval_minutes INTEGER NOT NULL DEFAULT 30;

-- 2. Modify schedules table for validity ranges and split shifts
ALTER TABLE public.schedules ADD COLUMN valid_from DATE NOT NULL DEFAULT '2020-01-01';
ALTER TABLE public.schedules ADD COLUMN valid_to DATE NOT NULL DEFAULT '2099-12-31';

-- Drop the unique constraint so we can have multiple shifts per day
ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_tenant_id_day_of_week_key;

-- 3. Create schedule_exceptions table
CREATE TABLE public.schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    open_time TIME,
    close_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for schedule_exceptions
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Schedule exceptions Policies
CREATE POLICY "Schedule exceptions are viewable by everyone" ON public.schedule_exceptions
  FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_schedule_exceptions_modtime BEFORE UPDATE ON public.schedule_exceptions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
