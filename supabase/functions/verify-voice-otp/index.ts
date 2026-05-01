import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://oscar-ia-mvp.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

const json = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });

/** Hash SHA-256 d'une chaîne, retourne la représentation hex */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const MAX_PIN_ATTEMPTS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { phone_number, otp_code, pin_code } = await req.json();

    if (!phone_number || !otp_code || !pin_code) {
      return json(req, { valid: false, error: 'Numéro, code OTP et code secret requis' }, 400);
    }

    const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Hasher le code soumis pour comparaison avec la valeur stockée ──────
    const otpHash = await sha256Hex(otp_code);

    // ── 2. Vérifier l'OTP (sans le marquer comme utilisé tout de suite) ───────
    const { data: otpData, error: otpError } = await supabase
      .from('voice_otps')
      .select('id, pin_attempts, used, expires_at')
      .eq('phone_number', phone_number)
      .eq('otp_code', otpHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpData) {
      return json(req, { valid: false, error: 'Code OTP invalide ou expiré' }, 400);
    }

    // ── 3. Vérifier le nombre de tentatives PIN ───────────────────────────────
    if (otpData.pin_attempts >= MAX_PIN_ATTEMPTS) {
      // Invalider l'OTP définitivement
      await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);
      return json(req, { valid: false, error: 'Trop de tentatives. Demandez un nouvel appel.' }, 429);
    }

    // ── 4. Trouver l'utilisateur par numéro (requête directe, pas scan total) ─
    const normalizePhone = (p: string) => p.replace(/[\s+\-().]/g, '');
    const normalizedInput = normalizePhone(phone_number);

    // Chercher directement par numéro dans auth.users via la table profiles
    const { data: profileByPhone, error: phoneError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', normalizedInput)
      .maybeSingle();

    // Fallback : scan limité si la colonne phone_number n'existe pas dans profiles
    let userId: string | null = profileByPhone?.id ?? null;

    if (phoneError || !profileByPhone) {
      // Fallback : listUsers avec filtre (max 1000, acceptable car seniors peu nombreux en MVP)
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = listData?.users?.find(
        (u) => u.phone && normalizePhone(u.phone) === normalizedInput
      );
      if (!user) {
        return json(req, { valid: false, error: 'Aucun compte trouvé pour ce numéro.' }, 400);
      }
      userId = user.id;
    }

    if (!userId) {
      return json(req, { valid: false, error: 'Aucun compte trouvé pour ce numéro.' }, 400);
    }

    // ── 5. Vérifier le PIN (comparaison bcrypt via RPC pgcrypto) ─────────────
    const { data: pinValid, error: pinError } = await supabase
      .rpc('check_user_pin', { p_user_id: userId, p_pin: pin_code });

    if (pinError || !pinValid) {
      // Incrémenter le compteur d'échecs
      await supabase
        .from('voice_otps')
        .update({ pin_attempts: otpData.pin_attempts + 1 })
        .eq('id', otpData.id);

      const remaining = MAX_PIN_ATTEMPTS - otpData.pin_attempts - 1;
      return json(req, {
        valid: false,
        error: remaining > 0
          ? `Code secret incorrect. ${remaining} tentative(s) restante(s).`
          : 'Trop de tentatives. Demandez un nouvel appel.',
      }, 400);
    }

    // ── 6. PIN correct — marquer l'OTP comme utilisé ─────────────────────────
    await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);

    // ── 6b. Garantir que le rôle senior est bien présent dans user_roles ─────
    // La contrainte unique est sur (user_id, role) — on ignore si déjà présent.
    await supabase
      .from('user_roles')
      .upsert(
        { user_id: userId, role: 'senior' },
        { onConflict: 'user_id,role' }
      );

    // ── 7. Créer ou récupérer l'email interne et générer le magic link ────────
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    let userEmail = userData?.user?.email;

    if (!userEmail) {
      userEmail = `senior_${userId}@oscar-internal.app`;
      await supabase.auth.admin.updateUserById(userId, { email: userEmail });
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('GenerateLink error:', linkError?.message);
      return json(req, { valid: false, error: 'Erreur création session' }, 500);
    }

    return json(req, {
      valid: true,
      hashed_token: linkData.properties.hashed_token,
      email: userEmail,
      user_id: userId,
    });
  } catch (error) {
    console.error('Error:', error);
    return json(req, { valid: false, error: 'Erreur interne' }, 500);
  }
});
