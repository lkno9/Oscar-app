-- Fix: replace NEW.related_senior_id with NEW.senior_id in dispatch_notification_email_sms
-- The column in family_notifications is named senior_id, not related_senior_id.
-- The old function was silently doing nothing when senior_id was set (condition always false).

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

  -- If settings are not available, bail out gracefully
  IF supabase_url IS NULL OR service_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get senior name using the correct column name: senior_id (was wrongly: related_senior_id)
  IF NEW.senior_id IS NOT NULL THEN
    SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.senior_id;
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
