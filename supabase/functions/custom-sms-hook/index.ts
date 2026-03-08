import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * Custom SMS Hook pour Supabase Auth
 *
 * Au lieu d'envoyer un SMS, cette fonction appelle le senior
 * via Twilio Voice API et lui dicte le code de connexion.
 *
 * Format du payload Supabase Auth Hook (Send SMS):
 * {
 *   "user": { "phone": "+33612345678" },
 *   "sms": { "otp": "123456" }
 * }
 *
 * Doit retourner 200 pour que Supabase considère le hook réussi.
 */

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Génère le TwiML pour dicter le code avec des pauses entre chaque chiffre.
 * Le code est répété 2 fois pour que le senior ait le temps de noter.
 */
function buildTwiml(otp: string): string {
  // Sépare chaque chiffre avec une pause pour la clarté
  const spaced = otp.split("").join(". . ");
  return `
<Response>
  <Say language="fr-FR" voice="alice">
    Bonjour, ici Oscar.
    Votre code de connexion est :
    ${spaced}.
  </Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">
    Je répète, votre code est :
    ${spaced}.
  </Say>
  <Pause length="1"/>
  <Say language="fr-FR" voice="alice">
    Entrez ce code dans l'application pour vous connecter.
    Au revoir.
  </Say>
</Response>`.trim();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("custom-sms-hook: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("custom-sms-hook: Payload received for phone:", payload?.user?.phone);

    // Extraire téléphone et OTP du payload Supabase Auth Hook
    const phone = payload?.user?.phone;
    const otp = payload?.sms?.otp;

    if (!phone || !otp) {
      console.error("custom-sms-hook: Missing phone or otp", { phone: !!phone, otp: !!otp });
      return new Response(
        JSON.stringify({ error: "Missing phone or otp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("custom-sms-hook: Twilio not configured");
      return new Response(
        JSON.stringify({ error: "Twilio not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Appeler le senior via Twilio Voice API
    const twiml = buildTwiml(otp);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    const body = new URLSearchParams({
      To: phone,
      From: TWILIO_PHONE_NUMBER,
      Twiml: twiml,
    });

    console.log("custom-sms-hook: Initiating voice call to", phone);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("custom-sms-hook: Twilio error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to initiate call" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("custom-sms-hook: Voice call initiated successfully, SID:", data.sid);

    return new Response(
      JSON.stringify({ success: true, call_sid: data.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("custom-sms-hook: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
