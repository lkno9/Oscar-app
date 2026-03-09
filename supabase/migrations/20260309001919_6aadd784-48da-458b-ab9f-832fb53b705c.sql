
-- Enable the custom SMS hook to use the edge function for voice OTP
CREATE OR REPLACE FUNCTION public.custom_sms_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_json jsonb;
BEGIN
  -- Forward to edge function via net.http_post
  SELECT content::jsonb INTO response_json
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/custom-sms-hook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := event
  );
  RETURN response_json;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_sms_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_sms_hook(jsonb) FROM PUBLIC, anon, authenticated;
