-- Migration to add booking notice rules to tenants

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS min_booking_notice_hours INT NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_booking_notice_days INT NOT NULL DEFAULT 60;

-- Optional: Add comments to the columns for better documentation
COMMENT ON COLUMN public.tenants.min_booking_notice_hours IS 'Minimum hours of notice required to make a booking';
COMMENT ON COLUMN public.tenants.max_booking_notice_days IS 'Maximum days in advance a booking can be made';
