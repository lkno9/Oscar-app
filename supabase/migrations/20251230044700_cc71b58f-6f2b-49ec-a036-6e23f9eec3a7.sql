-- Add phone number to profiles table for SMS notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add sms_notifications preference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;