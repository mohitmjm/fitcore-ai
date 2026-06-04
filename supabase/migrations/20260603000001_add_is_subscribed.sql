-- Add is_subscribed and wallet/alerts columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance int DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals text[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_enabled boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_enabled boolean DEFAULT true;
