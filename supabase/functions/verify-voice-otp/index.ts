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
    const { phone_number, otp_code } = await req.json();

    if (!phone_number || !otp_code) {
      return new Response(JSON.stringify({ error: 'phone_number et otp_code requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check OTP
    const { data, error } = await supabase
      .from('voice_otps')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, error: 'Code invalide ou expiré' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as used
    await supabase.from('voice_otps').update({ used: true }).eq('id', data.id);

    // Sign in or create user with phone via admin
    const { data: authData, error: authError } = await supabase.auth.admin.getUserByPhone(phone_number).catch(() => ({ data: null, error: null }));

    let userId: string;

    if (authData?.user) {
      userId = authData.user.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: phone_number,
        phone_confirm: true,
        user_metadata: { role: 'senior' },
      });

      if (createError || !newUser.user) {
        console.error('Create user error:', createError);
        return new Response(JSON.stringify({ valid: false, error: 'Erreur création utilisateur' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = newUser.user.id;
    }

    // Generate a session link (magic link approach for phone)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone_number.replace('+', '')}@oscar-phone.app`,
    }).catch(() => ({ data: null, error: null }));

    // Alternative: create a custom session token
    // For now return the userId for client-side session creation
    return new Response(JSON.stringify({ valid: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
