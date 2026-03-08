-- Migration: Add email/SMS notification dispatch for family notifications
-- This uses pg_net extension to call the send-family-notification edge function
-- whenever a family notification is created (mood, medication, activity, alert)
-- Messages already send email/SMS via the frontend (useFamilyMessages hook)

-- Enable pg_net extension for HTTP calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function that dispatches email/SMS via the send-family-notification edge function
-- Called AFTER INSERT on family_notifications
CREATE OR REPLACE FUNCTION public.dispatch_notification_email_sms()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  senior_name TEXT;
  request_body JSONB;
BEGIN
  -- Skip message notifications (already handled by frontend)
  IF NEW.type = 'message' THEN
    RETURN NEW;
  END IF;

  -- Get config from Supabase vault or environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  -- If settings are not available, try to get from env
  IF supabase_url IS NULL OR service_key IS NULL THEN
    -- Fallback: use the Supabase project URL pattern
    RETURN NEW;
  END IF;

  -- Get senior name if senior_id is available
  IF NEW.related_senior_id IS NOT NULL THEN
    SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.related_senior_id;
  END IF;

  -- Build request body
  request_body := jsonb_build_object(
    'type', NEW.type,
    'recipientId', NEW.user_id,
    'seniorName', COALESCE(senior_name, 'Votre proche'),
    'content', NEW.message
  );

  -- Add type-specific fields
  IF NEW.type = 'medication' THEN
    request_body := request_body || jsonb_build_object('medicationName', NEW.title);
  END IF;

  -- Make HTTP POST to the edge function via pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-family-notification',
    body := request_body::TEXT,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )::JSONB
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the notification insert if email/SMS dispatch fails
  RAISE WARNING 'Email/SMS dispatch failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: dispatch email/SMS after family notification is created
DROP TRIGGER IF EXISTS dispatch_email_sms_on_notification ON public.family_notifications;
CREATE TRIGGER dispatch_email_sms_on_notification
  AFTER INSERT ON public.family_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_notification_email_sms();
