-- ============================================================
-- Migration : sécurisation du auth_pin (bcrypt via pgcrypto)
-- ============================================================
-- Activation de l'extension pgcrypto (disponible sur Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Fonction : vérifier le PIN d'un utilisateur ──────────────
-- Utilisée par l'Edge Function verify-voice-otp via RPC
CREATE OR REPLACE FUNCTION public.check_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT auth_pin INTO stored_hash
  FROM public.profiles
  WHERE id = p_user_id;

  -- Aucun PIN défini → connexion bloquée
  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;

  -- Comparaison bcrypt : crypt(input, hash) doit égaler le hash
  RETURN crypt(p_pin, stored_hash) = stored_hash;
END;
$$;

-- ── Fonction : définir / mettre à jour le PIN d'un utilisateur ─
-- À utiliser par les admins ou une Edge Function d'onboarding
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validation : le PIN brut doit faire 4 chiffres
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Le PIN doit comporter exactement 4 chiffres';
  END IF;

  UPDATE public.profiles
  SET auth_pin = crypt(p_pin, gen_salt('bf', 10))
  WHERE id = p_user_id;
END;
$$;

-- ── Hasher les PINs existants en clair ───────────────────────
-- Condition : longueur ≤ 10 = probablement un PIN brut, pas déjà hashé
-- Un hash bcrypt fait 60 caractères → ne sera pas retouché
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, auth_pin
    FROM public.profiles
    WHERE auth_pin IS NOT NULL
      AND auth_pin != ''
      AND length(auth_pin) <= 10
  LOOP
    UPDATE public.profiles
    SET auth_pin = crypt(r.auth_pin, gen_salt('bf', 10))
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- ── Permissions ──────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.check_user_pin(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_pin(uuid, text) FROM PUBLIC;

-- Seul le service role (Edge Functions) peut appeler ces fonctions
GRANT EXECUTE ON FUNCTION public.check_user_pin(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_user_pin(uuid, text) TO service_role;
