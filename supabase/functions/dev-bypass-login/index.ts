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
    const { phone_number, email } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let existingUser: any = null;

    if (email) {
      // Email-based lookup
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      existingUser = listData?.users?.find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      );
    } else if (phone_number) {
      // Phone-based lookup
      const normalizePhone = (p: string) => p.replace(/[\s+\-().]/g, '');
      const normalizedInput = normalizePhone(phone_number);
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      existingUser = listData?.users?.find(
        (u) => u.phone && normalizePhone(u.phone) === normalizedInput
      );
    }

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      return new Response(JSON.stringify({ error: 'Erreur création session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        hashed_token: linkData.properties.hashed_token,
        user_id: existingUser.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bypass error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
