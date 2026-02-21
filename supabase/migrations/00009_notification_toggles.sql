-- Migration 00009: Configurable notification toggles
-- Add boolean flags to control notification behavior per tenant
ALTER TABLE tenants
ADD COLUMN notify_email_confirmations BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_telegram_confirmations BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_email_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_telegram_reminders BOOLEAN DEFAULT TRUE;
