-- ── Sécurité OTP : rate limiting + tentatives PIN ───────────────────────────

-- 1. Compteur de tentatives PIN sur chaque OTP
ALTER TABLE voice_otps
  ADD COLUMN IF NOT EXISTS pin_attempts INT NOT NULL DEFAULT 0;

-- 2. Table de rate limiting par numéro de téléphone
--    (max 3 demandes d'OTP par tranche de 10 minutes)
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes rapides par numéro + date
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_phone_created
  ON otp_rate_limits (phone_number, created_at);

-- RLS : table inaccessible en direct depuis le client (service role only)
ALTER TABLE otp_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON otp_rate_limits
  USING (false);

-- Nettoyage automatique des entrées > 1h (via pg_cron si disponible, sinon manuel)
-- Les Edge Functions nettoient les entrées de plus de 10 min elles-mêmes.
