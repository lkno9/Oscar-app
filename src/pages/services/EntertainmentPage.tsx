import { ArrowLeft, ExternalLink, Ticket, Clapperboard, Palette, Loader2, X, MapPin, Navigation, UtensilsCrossed } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentPosition, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { searchNearbyPOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";

// --- Types ---
interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genreIds: number[];
}

// --- Données ---
const ENTERTAINMENT_LINKS = [
  {
    category: "Spectacles & Sorties",
    items: [
      { name: "Fnac Spectacles", desc: "Billetterie concerts, théâtre, spectacles", url: "https://www.fnacspectacles.com", emoji: "🎭" },
      { name: "France Billet", desc: "Événements culturels et sportifs", url: "https://www.francebillet.com", emoji: "🎫" },
      { name: "L'Officiel des spectacles", desc: "Agenda culturel : cinéma, expos, concerts", url: "https://www.offi.fr", emoji: "📰" },
    ],
  },
  {
    category: "Cinéma & Réservation",
    items: [
      { name: "AlloCiné", desc: "Films à l'affiche, horaires, bandes-annonces", url: "https://www.allocine.fr", emoji: "🎬" },
      { name: "UGC", desc: "Programme et réservation de places", url: "https://www.ugc.fr", emoji: "🍿" },
    ],
  },
  {
    category: "Culture & Musées",
    items: [
      { name: "Paris Musées", desc: "Collections et expositions gratuites", url: "https://www.parismusees.paris.fr", emoji: "🖼️" },
      { name: "Arte Replay", desc: "Documentaires, films et émissions en replay", url: "https://www.arte.tv/fr/", emoji: "📺" },
      { name: "France TV", desc: "Replay gratuit des chaînes France Télévisions", url: "https://www.france.tv", emoji: "📡" },
    ],
  },
];

const TMDB_GENRES: Record<number, string> = {
  28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie",
  80: "Crime", 99: "Documentaire", 18: "Drame", 10751: "Famille",
  14: "Fantastique", 36: "Histoire", 27: "Horreur", 10402: "Musique",
  9648: "Mystère", 10749: "Romance", 878: "Sci-fi",
  53: "Thriller", 10752: "Guerre", 37: "Western",
};

type TabKey = "cinema" | "sortir" | "culture";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>("cinema");

  // Cinéma
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [movieSection, setMovieSection] = useState<"now_playing" | "trending">("now_playing");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [moviesFetched, setMoviesFetched] = useState(false);

  // Sortir : recherche à proximité
  const [nearbyPOIs, setNearbyPOIs] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySearched, setNearbySearched] = useState(false);
  const [nearbyFilter, setNearbyFilter] = useState<POIType>("restaurant");

  const searchNearby = async (type?: POIType) => {
    const searchType = type || nearbyFilter;
    setNearbyLoading(true);
    setNearbyPOIs([]);
    try {
      const coords = await getCurrentPosition();
      const radius = searchType === "cinema" ? 5000 : 1500;
      const results = await searchNearbyPOIs(coords, searchType, radius);
      setNearbyPOIs(results);
      setNearbySearched(true);
      if (results.length === 0) toast("Aucun résultat trouvé à proximité.");
    } catch (err: any) {
      toast.error(err.message || "Impossible d'obtenir votre position.");
    } finally {
      setNearbyLoading(false);
    }
  };

  // Charger les films quand on arrive sur l'onglet cinéma
  useEffect(() => {
    if (activeTab === "cinema" && !moviesFetched) {
      fetchMovies("now_playing");
    }
  }, [activeTab]);

  const fetchMovies = async (action: "now_playing" | "trending") => {
    setMoviesLoading(true);
    setMoviesError(null);
    try {
      const res = await supabase.functions.invoke("tmdb-movies", {
        body: { action },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as { movies: Movie[]; error?: string };
      if (data.error) throw new Error(data.error);
      setMovies(data.movies || []);
      setMoviesFetched(true);
    } catch (err: any) {
      setMoviesError(err.message || "Impossible de charger les films.");
    } finally {
      setMoviesLoading(false);
    }
  };

  const ratingColor = (v: number) => v >= 7 ? "text-green-600" : v >= 5 ? "text-yellow-600" : "text-red-500";

  const TABS = [
    { key: "cinema" as TabKey, label: "Cinéma", icon: Clapperboard },
    { key: "sortir" as TabKey, label: "Sortir", icon: UtensilsCrossed },
    { key: "culture" as TabKey, label: "Culture", icon: Palette },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Sorties & Loisirs</h1>
          <p className="text-sm text-muted-foreground">Culture, musique et divertissement</p>
        </div>
        <Ticket className="w-6 h-6 text-primary" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card flex-shrink-0 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-w-0 ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {/* Oscar banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-primary">Oscar peut aussi vous aider !</span>{" "}
            Dites-lui : « Oscar, qu'est-ce qui passe au cinéma ? »
          </p>
        </div>

        {/* ========== CINÉMA ========== */}
        {activeTab === "cinema" && (
          <>
            {/* Toggle à l'affiche / tendances */}
            <div className="flex gap-2">
              {([
                { key: "now_playing" as const, label: "À l'affiche" },
                { key: "trending" as const, label: "Tendances" },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => { setMovieSection(s.key); fetchMovies(s.key); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: movieSection === s.key ? "rgba(72,162,158,0.12)" : undefined,
                    border: `1.5px solid ${movieSection === s.key ? "#48A29E" : "hsl(var(--border))"}`,
                    color: movieSection === s.key ? "#48A29E" : undefined,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {moviesLoading && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Chargement des films...</p>
              </div>
            )}

            {/* Erreur */}
            {moviesError && !moviesLoading && (
              <div className="bg-destructive/10 rounded-xl p-4 text-center">
                <p className="text-destructive text-sm mb-2">{moviesError}</p>
                <button
                  onClick={() => fetchMovies(movieSection)}
                  className="text-sm font-medium text-primary underline"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Grille films */}
            {!moviesLoading && !moviesError && movies.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {movies.map(movie => (
                  <button
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-card rounded-xl border border-border overflow-hidden text-left transition-all hover:border-primary"
                  >
                    {movie.posterPath ? (
                      <img
                        src={movie.posterPath}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                        <Clapperboard className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{movie.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-sm font-bold ${ratingColor(movie.voteAverage)}`}>
                          ★ {movie.voteAverage}
                        </span>
                        {movie.genreIds[0] && TMDB_GENRES[movie.genreIds[0]] && (
                          <span className="text-sm text-muted-foreground">{TMDB_GENRES[movie.genreIds[0]]}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Aucun film */}
            {!moviesLoading && !moviesError && movies.length === 0 && moviesFetched && (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🎬</span>
                <p className="text-muted-foreground">Aucun film disponible</p>
              </div>
            )}

            {/* Lien AlloCiné */}
            <button
              onClick={() => window.open("https://www.allocine.fr", "_blank")}
              className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🎬</div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">AlloCiné</h3>
                <p className="text-sm text-muted-foreground">Horaires et bandes-annonces</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          </>
        )}

        {/* ========== SORTIR — Recherche proches ========== */}
        {activeTab === "sortir" && (
          <>
            <p className="text-sm text-muted-foreground">Trouvez des lieux autour de vous pour sortir, manger ou boire un café.</p>

            {/* Filtres */}
            <div className="flex gap-2">
              {([
                { type: "restaurant" as POIType, label: "Restaurants", emoji: "🍽️" },
                { type: "cafe" as POIType, label: "Cafés", emoji: "☕" },
                { type: "cinema" as POIType, label: "Cinémas", emoji: "🎬" },
              ]).map(f => (
                <button
                  key={f.type}
                  onClick={() => { setNearbyFilter(f.type); if (nearbySearched) searchNearby(f.type); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: nearbyFilter === f.type ? "rgba(72,162,158,0.12)" : undefined,
                    border: `1.5px solid ${nearbyFilter === f.type ? "#48A29E" : "hsl(var(--border))"}`,
                    color: nearbyFilter === f.type ? "#48A29E" : undefined,
                  }}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>

            {/* Bouton recherche */}
            <button
              onClick={() => searchNearby()}
              disabled={nearbyLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{
                background: nearbyLoading ? "#94a3b8" : "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
                border: "none",
                cursor: nearbyLoading ? "wait" : "pointer",
                fontSize: 15,
              }}
            >
              {nearbyLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Recherche en cours...</>
              ) : (
                <><MapPin className="w-5 h-5" /> Chercher près de moi</>
              )}
            </button>

            {/* Résultats */}
            {nearbySearched && !nearbyLoading && (
              <div className="space-y-3">
                {nearbyPOIs.length > 0 ? nearbyPOIs.map(poi => (
                  <div key={poi.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {getPOIEmoji(poi.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-base">{poi.name}</h3>
                          <span className="text-sm font-medium text-primary flex-shrink-0">{formatDistance(poi.distance)}</span>
                        </div>
                        {poi.address && <p className="text-sm text-muted-foreground mt-0.5">{poi.address}</p>}
                        {poi.openingHours && <p className="text-sm text-muted-foreground mt-1">🕐 {poi.openingHours}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-medium"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Y aller
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-muted-foreground">Aucun résultat trouvé à proximité</p>
                  </div>
                )}
              </div>
            )}

            {/* Lien AlloCiné en bonus */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2">Réserver en ligne</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3">
              {[
                { name: "TheFork (LaFourchette)", desc: "Réserver une table au restaurant", url: "https://www.thefork.fr", emoji: "🍴" },
                { name: "AlloCiné", desc: "Horaires et billets de cinéma", url: "https://www.allocine.fr", emoji: "🎬" },
                { name: "L'Officiel", desc: "Agenda des sorties et spectacles", url: "https://www.offi.fr", emoji: "📰" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => window.open(item.url, "_blank")}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ========== CULTURE ========== */}
        {activeTab === "culture" && (
          <>
            {ENTERTAINMENT_LINKS.map((cat, ci) => (
              <section key={ci}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  {ci === 0 && <Ticket className="w-4 h-4" />}
                  {ci === 1 && <Clapperboard className="w-4 h-4" />}
                  {ci === 2 && <Palette className="w-4 h-4" />}
                  {cat.category}
                </h2>
                <div className="space-y-3">
                  {cat.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => window.open(item.url, "_blank")}
                      className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

      </div>

      {/* ========== MODAL DÉTAIL FILM ========== */}
      {selectedMovie && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedMovie(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-lg rounded-t-2xl overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header avec poster */}
            <div className="relative">
              {selectedMovie.posterPath && (
                <img
                  src={selectedMovie.posterPath}
                  alt={selectedMovie.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              <h2 className="text-xl font-bold text-foreground">{selectedMovie.title}</h2>

              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-lg font-bold ${ratingColor(selectedMovie.voteAverage)}`}>
                  ★ {selectedMovie.voteAverage}/10
                </span>
                {selectedMovie.releaseDate && (
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedMovie.releaseDate).getFullYear()}
                  </span>
                )}
                {selectedMovie.genreIds.map(gid => TMDB_GENRES[gid]).filter(Boolean).slice(0, 3).map((g, i) => (
                  <span key={i} className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g}</span>
                ))}
              </div>

              {selectedMovie.overview && (
                <p className="text-foreground leading-relaxed">{selectedMovie.overview}</p>
              )}

              <button
                onClick={() => window.open(`https://www.allocine.fr/rechercher/?q=${encodeURIComponent(selectedMovie.title)}`, "_blank")}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)" }}
              >
                🎬 Voir sur AlloCiné
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
