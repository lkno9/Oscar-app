import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    if (!TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY non configurée. Créez un compte gratuit sur themoviedb.org.");
    }

    const { action } = await req.json();

    let url: string;
    if (action === "now_playing") {
      url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=fr-FR&region=FR&page=1`;
    } else if (action === "trending") {
      url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=fr-FR`;
    } else {
      throw new Error("Action inconnue");
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur TMDB: ${response.status}`);

    const data = await response.json();

    const movies = (data.results || []).slice(0, 12).map((m: any) => ({
      id: m.id,
      title: m.title,
      overview: m.overview
        ? m.overview.substring(0, 200) + (m.overview.length > 200 ? "..." : "")
        : "",
      posterPath: m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : null,
      releaseDate: m.release_date || "",
      voteAverage: Math.round((m.vote_average || 0) * 10) / 10,
      genreIds: m.genre_ids || [],
    }));

    return new Response(JSON.stringify({ movies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message, movies: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
