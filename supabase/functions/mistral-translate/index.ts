import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LANGUAGES: Record<string, string> = {
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
  pt: "portugais",
  ar: "arabe",
  fr: "français",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLang, sourceLang } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Veuillez fournir un texte à traduire." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const source = LANGUAGES[sourceLang] || "français";
    const target = LANGUAGES[targetLang] || "anglais";

    const systemPrompt = `Tu es un traducteur professionnel. Traduis le texte suivant du ${source} vers le ${target}. Renvoie UNIQUEMENT la traduction, sans explication, sans commentaire, sans guillemets.`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text.trim() },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service temporairement surchargé, réessayez." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Mistral error:", response.status, errorText);
      throw new Error("Erreur lors de la traduction");
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content?.trim();

    if (!translation) {
      throw new Error("Réponse vide du traducteur");
    }

    return new Response(
      JSON.stringify({ translation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mistral-translate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
