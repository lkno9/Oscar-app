import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sources officielles d'alertes arnaques en France
const SCAM_SOURCES = [
  {
    name: "Cybermalveillance.gouv.fr",
    url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites",
    type: "official"
  },
  {
    name: "Signal-Arnaques",
    url: "https://www.signal-arnaques.com/scam/rss",
    type: "community"
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pour l'instant, on retourne les alertes existantes de la base
    // Dans une version future, on pourrait parser des flux RSS
    const { data: alerts, error } = await supabase
      .from("scam_alerts")
      .select("*")
      .eq("is_active", true)
      .order("date_detected", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts: alerts || [],
        sources: SCAM_SOURCES.map(s => s.name),
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching scam alerts:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        alerts: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
