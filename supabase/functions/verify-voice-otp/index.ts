import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, otp_code, pin_code } = await req.json();

    if (!phone_number || !otp_code || !pin_code) {
      return new Response(JSON.stringify({ valid: false, error: 'Numéro, code OTP et code secret requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Vérifier le code OTP
    const { data: otpData, error: otpError } = await supabase
      .from('voice_otps')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpData) {
      console.error('OTP check failed:', otpError?.message ?? 'OTP introuvable');
      return new Response(JSON.stringify({ valid: false, error: 'Code OTP invalide ou expiré' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Marquer l'OTP comme utilisé
    await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);

    // 2. Trouver l'utilisateur par son numéro (normalisation du format)
    const normalizePhone = (p: string) => p.replace(/[\s+\-().]/g, '');
    const normalizedInput = normalizePhone(phone_number);

    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(
      (u) => u.phone && normalizePhone(u.phone) === normalizedInput
    );

    if (!existingUser) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Aucun compte trouvé pour ce numéro. Contactez le support Oscar.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Vérifier le code PIN
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('auth_pin')
      .eq('id', existingUser.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('Profile lookup failed:', profileError?.message);
      return new Response(JSON.stringify({ valid: false, error: 'Erreur de vérification du profil' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profileData.auth_pin || profileData.auth_pin !== pin_code) {
      return new Response(JSON.stringify({ valid: false, error: 'Code secret incorrect' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Générer un magic link token pour créer la session côté client
    // On s'assure que l'utilisateur a un email (sinon on en crée un fictif)
    let userEmail = existingUser.email;
    if (!userEmail) {
      userEmail = `senior_${existingUser.id}@oscar-internal.app`;
      await supabase.auth.admin.updateUserById(existingUser.id, { email: userEmail });
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('GenerateLink error:', linkError?.message);
      return new Response(JSON.stringify({ valid: false, error: 'Erreur création session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        valid: true,
        hashed_token: linkData.properties.hashed_token,
        email: userEmail,
        user_id: existingUser.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ valid: false, error: 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
