-- Add management_token to bookings for magic link cancellation
ALTER TABLE bookings
ADD COLUMN management_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Create an index to make token lookups fast since we will query by it
CREATE INDEX idx_bookings_management_token ON bookings(management_token);
