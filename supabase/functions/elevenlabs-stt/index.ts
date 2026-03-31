import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mistral Voxtral STT — remplace ElevenLabs Scribe
// Modèle : voxtral-mini-latest
// Docs : https://docs.mistral.ai/capabilities/audio/speech_to_text

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "Fichier audio manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mistral STT utilise le même format multipart/form-data
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile, audioFile.name || "audio.webm");
    apiFormData.append("model", "voxtral-mini-latest");

    const response = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Mistral STT error:", response.status, err);
      if (response.status === 401) {
        throw new Error("Clé Mistral invalide ou expirée");
      } else if (response.status === 429) {
        throw new Error("Quota Mistral dépassé, réessayez plus tard");
      } else {
        throw new Error(`Erreur Mistral STT (${response.status}): ${err.substring(0, 200)}`);
      }
    }

    const transcription = await response.json();

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("STT error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
