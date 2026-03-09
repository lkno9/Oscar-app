
CREATE TABLE IF NOT EXISTS public.voice_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false
);

ALTER TABLE public.voice_otps ENABLE ROW LEVEL SECURITY;

-- No user access needed — only edge functions (service role) access this table
CREATE POLICY "No direct access" ON public.voice_otps
  FOR ALL TO public USING (false);
