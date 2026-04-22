import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MAX_PIN_ATTEMPTS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, otp_code, pin_code } = await req.json();

    if (!phone_number || !otp_code || !pin_code) {
      return json({ valid: false, error: 'Numéro, code OTP et code secret requis' }, 400);
    }

    const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Vérifier l'OTP (sans le marquer comme utilisé tout de suite) ───────
    const { data: otpData, error: otpError } = await supabase
      .from('voice_otps')
      .select('id, pin_attempts, used, expires_at')
      .eq('phone_number', phone_number)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpData) {
      return json({ valid: false, error: 'Code OTP invalide ou expiré' }, 400);
    }

    // ── 2. Vérifier le nombre de tentatives PIN ───────────────────────────────
    if (otpData.pin_attempts >= MAX_PIN_ATTEMPTS) {
      // Invalider l'OTP définitivement
      await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);
      return json({ valid: false, error: 'Trop de tentatives. Demandez un nouvel appel.' }, 429);
    }

    // ── 3. Trouver l'utilisateur par numéro (requête directe, pas scan total) ─
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
        return json({ valid: false, error: 'Aucun compte trouvé pour ce numéro.' }, 400);
      }
      userId = user.id;
    }

    if (!userId) {
      return json({ valid: false, error: 'Aucun compte trouvé pour ce numéro.' }, 400);
    }

    // ── 4. Vérifier le PIN (comparaison bcrypt via RPC pgcrypto) ─────────────
    const { data: pinValid, error: pinError } = await supabase
      .rpc('check_user_pin', { p_user_id: userId, p_pin: pin_code });

    if (pinError || !pinValid) {
      // Incrémenter le compteur d'échecs
      await supabase
        .from('voice_otps')
        .update({ pin_attempts: otpData.pin_attempts + 1 })
        .eq('id', otpData.id);

      const remaining = MAX_PIN_ATTEMPTS - otpData.pin_attempts - 1;
      return json({
        valid: false,
        error: remaining > 0
          ? `Code secret incorrect. ${remaining} tentative(s) restante(s).`
          : 'Trop de tentatives. Demandez un nouvel appel.',
      }, 400);
    }

    // ── 5. PIN correct — marquer l'OTP comme utilisé ─────────────────────────
    await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);

    // ── 5b. Garantir que le rôle senior est bien présent dans user_roles ─────
    // La contrainte unique est sur (user_id, role) — on ignore si déjà présent.
    await supabase
      .from('user_roles')
      .upsert(
        { user_id: userId, role: 'senior' },
        { onConflict: 'user_id,role' }
      );

    // ── 6. Créer ou récupérer l'email interne et générer le magic link ────────
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
      return json({ valid: false, error: 'Erreur création session' }, 500);
    }

    return json({
      valid: true,
      hashed_token: linkData.properties.hashed_token,
      email: userEmail,
      user_id: userId,
    });
  } catch (error) {
    console.error('Error:', error);
    return json({ valid: false, error: 'Erreur interne' }, 500);
  }
});
