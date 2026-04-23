import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCAM_ANALYSIS_PROMPT = `Tu es un expert en cybersécurité spécialisé dans la détection des arnaques ciblant les seniors en France.

Ton rôle est d'analyser les messages (SMS, emails, liens, textes) qu'on te soumet et de déterminer s'il s'agit d'une arnaque.

CRITÈRES D'ANALYSE :
1. Urgence artificielle ("Dernière chance", "Action immédiate requise", "Votre compte sera bloqué")
2. Fautes d'orthographe ou de grammaire inhabituelles
3. Demande d'informations personnelles (codes, mots de passe, numéros de carte)
4. Liens suspects (URLs raccourcies, domaines inhabituels, fautes dans les noms officiels)
5. Usurpation d'identité (Ameli, impôts, banques, La Poste, CAF, etc.)
6. Promesses de gains ou remboursements inattendus
7. Pression émotionnelle ou menaces
8. Demande de paiement par moyens inhabituels (cartes cadeaux, virement urgent)

ARNAQUES COURANTES EN FRANCE (2024-2025) :
- Faux SMS Ameli "carte vitale expirée"
- Appels CPF frauduleux
- Faux colis Colissimo/Chronopost avec frais
- Faux remboursement des impôts
- Arnaque au faux conseiller bancaire
- Faux support technique Microsoft
- Arnaques sentimentales

IMPORTANT :
- Sois rassurant dans ton explication
- Explique simplement pourquoi c'est suspect ou non
- Donne des conseils pratiques adaptés aux seniors
- Ne fais jamais de diagnostic médical ou juridique

Tu dois OBLIGATOIREMENT utiliser la fonction analyze_message pour retourner ton analyse structurée.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Veuillez fournir un message à analyser" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: SCAM_ANALYSIS_PROMPT },
          { role: "user", content: `Analyse ce message et détermine s'il s'agit d'une arnaque :\n\n"${content}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_message",
              description: "Retourne l'analyse structurée du message suspect",
              parameters: {
                type: "object",
                properties: {
                  riskLevel: {
                    type: "string",
                    enum: ["safe", "suspicious", "dangerous"],
                    description: "Niveau de risque : safe (pas d'arnaque), suspicious (méfiance), dangerous (arnaque probable)"
                  },
                  explanation: {
                    type: "string",
                    description: "Explication claire et rassurante en 2-3 phrases, adaptée aux seniors"
                  },
                  redFlags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste des signaux d'alerte détectés (vide si safe)"
                  },
                  recommendation: {
                    type: "string",
                    description: "Conseil pratique sur quoi faire maintenant"
                  },
                  scamType: {
                    type: "string",
                    description: "Type d'arnaque identifié si applicable (ex: 'Faux SMS Ameli', 'Phishing bancaire')"
                  }
                },
                required: ["riskLevel", "explanation", "redFlags", "recommendation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_message" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Mistral API error:", response.status, errorText);
      throw new Error("Erreur lors de l'analyse");
    }

    const data = await response.json();

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_message") {
      throw new Error("Réponse IA invalide");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log("Scam analysis completed:", {
      contentLength: content.length,
      riskLevel: analysis.riskLevel,
      redFlagsCount: analysis.redFlags?.length || 0
    });

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-scam function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
