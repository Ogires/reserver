-- Migration 00008: Telegram Notifications schema
-- Add Telegram ID to tenants for receiving booking alerts
ALTER TABLE tenants
ADD COLUMN telegram_chat_id TEXT;

-- Add Telegram ID to customers for receiving booking confirmations
ALTER TABLE customers
ADD COLUMN telegram_chat_id TEXT;
