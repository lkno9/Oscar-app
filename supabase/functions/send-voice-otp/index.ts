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

/** OTP cryptographiquement sécurisé à 6 chiffres */
function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 900000 + 100000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number } = await req.json();

    if (!phone_number || typeof phone_number !== 'string') {
      return json({ error: 'phone_number requis' }, 400);
    }

    // Validation format E.164 basique
    if (!/^\+\d{8,15}$/.test(phone_number.trim())) {
      return json({ error: 'Format de numéro invalide (ex: +33612345678)' }, 400);
    }

    const phone = phone_number.trim();

    const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TWILIO_ACCOUNT_SID       = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN        = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER      = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return json({ error: 'Twilio non configuré' }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Rate limiting : max 3 demandes par numéro sur 10 minutes ──────────────
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('otp_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phone)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= 3) {
      return json({ error: 'Trop de demandes. Réessayez dans 10 minutes.' }, 429);
    }

    // Enregistrer cette tentative
    await supabase.from('otp_rate_limits').insert({ phone_number: phone });

    // Nettoyer les anciennes entrées de rate limit (> 10 min)
    await supabase
      .from('otp_rate_limits')
      .delete()
      .lt('created_at', windowStart);

    // ── Générer et stocker l'OTP ───────────────────────────────────────────────
    const otp = generateOtp();

    await supabase.from('voice_otps').delete().eq('phone_number', phone);

    const { error: insertError } = await supabase.from('voice_otps').insert({
      phone_number: phone,
      otp_code: otp,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return json({ error: 'Erreur base de données' }, 500);
    }

    // ── Appel vocal Twilio ────────────────────────────────────────────────────
    const digits = otp.split('').join(', ');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">Bonjour, voici votre code de connexion Oscar.</Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">${digits}</Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">Je répète.</Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">${digits}</Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">Au revoir.</Say>
</Response>`;

    const formData = new URLSearchParams({
      To: phone,
      From: TWILIO_PHONE_NUMBER,
      Twiml: twiml,
    });

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    if (!twilioResponse.ok) {
      const err = await twilioResponse.text();
      console.error('Twilio error:', err);
      return json({ error: "Impossible d'initier l'appel" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: 'Erreur interne' }, 500);
  }
});
