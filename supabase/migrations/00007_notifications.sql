-- Migration 00007: Notifications schema
-- Add notification settings to tenants
ALTER TABLE tenants
ADD COLUMN reminder_hours_prior INTEGER DEFAULT 24,
ADD COLUMN reminder_template TEXT;

-- Add notification tracking to bookings
ALTER TABLE bookings
ADD COLUMN confirmation_sent_at TIMESTAMPTZ,
ADD COLUMN reminder_sent_at TIMESTAMPTZ;
