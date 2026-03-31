import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mistral Voxtral TTS — remplace ElevenLabs
// Pour configurer la voix d'Oscar :
//   1. Créer une voix via l'API Mistral (POST /v1/audio/voices) avec un échantillon audio
//   2. Stocker le voice_id retourné dans la variable d'env MISTRAL_VOICE_ID
// Docs : https://docs.mistral.ai/capabilities/audio/text_to_speech

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Texte manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const MISTRAL_VOICE_ID = Deno.env.get("MISTRAL_VOICE_ID");
    if (!MISTRAL_VOICE_ID) {
      throw new Error("MISTRAL_VOICE_ID is not configured — créez une voix via l'API Mistral Voices");
    }

    const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voxtral-mini-tts-2603",
        input: text,
        voice_id: MISTRAL_VOICE_ID,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Mistral TTS error:", response.status, err);
      if (response.status === 401) {
        throw new Error("Clé Mistral invalide ou expirée");
      } else if (response.status === 429) {
        throw new Error("Quota Mistral dépassé, réessayez plus tard");
      }
      throw new Error(`Erreur Mistral TTS (${response.status})`);
    }

    // Mistral retourne du JSON avec l'audio en base64
    const result = await response.json();
    const audioBytes = Uint8Array.from(atob(result.audio_data), (c) => c.charCodeAt(0));

    return new Response(audioBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
