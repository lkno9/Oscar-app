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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Vérifier le code OTP (preuve de possession du téléphone)
    const { data: otpData, error: otpError } = await supabase
      .from('voice_otps')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      console.error('OTP check failed:', otpError?.message);
      return new Response(JSON.stringify({ valid: false, error: 'Code OTP invalide ou expiré' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Marquer l'OTP comme utilisé
    await supabase.from('voice_otps').update({ used: true }).eq('id', otpData.id);

    // 2. Trouver l'utilisateur existant par son numéro de téléphone
    //    (le compte a été pré-créé à la souscription)
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(u => u.phone === phone_number);

    if (!existingUser) {
      return new Response(JSON.stringify({ valid: false, error: 'Aucun compte trouvé pour ce numéro. Contactez le support Oscar.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Vérifier le code PIN (preuve d'identité)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('auth_pin')
      .eq('id', existingUser.id)
      .single();

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

    // 4. Tout est vérifié — créer une session pour cet utilisateur
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: existingUser.id,
    });

    if (sessionError || !sessionData) {
      console.error('Session error:', sessionError);
      return new Response(JSON.stringify({ valid: false, error: 'Erreur création session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        valid: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        user: sessionData.session.user,
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
