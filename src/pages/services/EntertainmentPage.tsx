import { ArrowLeft, ExternalLink, Ticket, Clapperboard, Palette, Radio, Star, Play, Heart, Headphones, Loader2, X } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Types ---
interface RadioStation {
  id: number;
  name: string;
  genre: string;
  emoji: string;
  url: string;
}

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
const RADIOS: RadioStation[] = [
  { id: 1, name: "France Inter", genre: "Généraliste", emoji: "📻", url: "https://www.radiofrance.fr/franceinter" },
  { id: 2, name: "RTL", genre: "Généraliste", emoji: "🎙️", url: "https://www.rtl.fr/" },
  { id: 3, name: "Nostalgie", genre: "Oldies", emoji: "🎵", url: "https://www.nostalgie.fr/" },
  { id: 4, name: "France Musique", genre: "Classique", emoji: "🎼", url: "https://www.radiofrance.fr/francemusique" },
  { id: 5, name: "RFM", genre: "Variétés", emoji: "🎶", url: "https://www.rfm.fr/" },
  { id: 6, name: "Radio Classique", genre: "Classique", emoji: "🎻", url: "https://www.radioclassique.fr/" },
  { id: 7, name: "France Culture", genre: "Culture", emoji: "📖", url: "https://www.radiofrance.fr/franceculture" },
  { id: 8, name: "Jazz Radio", genre: "Jazz", emoji: "🎷", url: "https://www.jazzradio.fr/" },
  { id: 9, name: "FIP", genre: "Éclectique", emoji: "🎧", url: "https://www.radiofrance.fr/fip" },
];

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

const PLAYLISTS = [
  { title: "Relaxation & Bien-être", emoji: "🧘", url: "https://www.youtube.com/results?search_query=musique+relaxation+1+heure" },
  { title: "Classiques français", emoji: "🇫🇷", url: "https://www.youtube.com/results?search_query=chanson+francaise+classique+playlist" },
  { title: "Années 60-70", emoji: "📀", url: "https://www.youtube.com/results?search_query=musique+annees+60+70+francaise" },
  { title: "Piano détente", emoji: "🎹", url: "https://www.youtube.com/results?search_query=piano+relaxation+musique+douce" },
];

const TMDB_GENRES: Record<number, string> = {
  28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie",
  80: "Crime", 99: "Documentaire", 18: "Drame", 10751: "Famille",
  14: "Fantastique", 36: "Histoire", 27: "Horreur", 10402: "Musique",
  9648: "Mystère", 10749: "Romance", 878: "Sci-fi",
  53: "Thriller", 10752: "Guerre", 37: "Western",
};

const FAVORITES_KEY = "oscar_radio_favorites";

type TabKey = "cinema" | "culture" | "radio" | "playlists";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("cinema");

  // Cinéma
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [movieSection, setMovieSection] = useState<"now_playing" | "trending">("now_playing");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [moviesFetched, setMoviesFetched] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

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

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const ratingColor = (v: number) => v >= 7 ? "text-green-600" : v >= 5 ? "text-yellow-600" : "text-red-500";

  const TABS = [
    { key: "cinema" as TabKey, label: "Cinéma", icon: Clapperboard },
    { key: "culture" as TabKey, label: "Culture", icon: Palette },
    { key: "radio" as TabKey, label: "Radios", icon: Radio },
    { key: "playlists" as TabKey, label: "Musique", icon: Headphones },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
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
                          <span className="text-xs text-muted-foreground">{TMDB_GENRES[movie.genreIds[0]]}</span>
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

        {/* ========== RADIO ========== */}
        {activeTab === "radio" && (
          <>
            <p className="text-sm text-muted-foreground">Appuyez sur ▶ pour écouter • ⭐ pour sauvegarder en favori</p>

            {favorites.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Mes favoris
                </h2>
                <div className="space-y-3">
                  {RADIOS.filter(r => favorites.includes(r.id)).map(radio => (
                    <RadioCard key={radio.id} radio={radio} isFav toggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Toutes les radios
              </h2>
              <div className="space-y-3">
                {RADIOS.map(radio => (
                  <RadioCard key={radio.id} radio={radio} isFav={favorites.includes(radio.id)} toggleFavorite={toggleFavorite} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ========== PLAYLISTS ========== */}
        {activeTab === "playlists" && (
          <>
            <p className="text-sm text-muted-foreground">Sélections musicales sur YouTube</p>
            <div className="space-y-3">
              {PLAYLISTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => window.open(item.url, "_blank")}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">YouTube</p>
                  </div>
                  <Play className="w-5 h-5 text-primary flex-shrink-0" />
                </button>
              ))}
            </div>
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
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g}</span>
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

function RadioCard({ radio, isFav, toggleFavorite }: { radio: RadioStation; isFav: boolean; toggleFavorite: (id: number) => void }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
        {radio.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{radio.name}</p>
        <p className="text-sm text-muted-foreground">{radio.genre}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => toggleFavorite(radio.id)} className="p-2 rounded-full hover:bg-secondary transition-colors">
          {isFav ? <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> : <Star className="w-5 h-5 text-muted-foreground" />}
        </button>
        <button onClick={() => window.open(radio.url, "_blank")} className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
