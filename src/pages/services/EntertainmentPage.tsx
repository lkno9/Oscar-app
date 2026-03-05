import { ArrowLeft, ExternalLink, Music, Ticket, Clapperboard, Palette, BookOpen, Radio, Star, Play, Heart, Headphones } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";

interface RadioStation {
  id: number;
  name: string;
  genre: string;
  emoji: string;
  url: string;
}

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
    category: "Cinéma",
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

const FAVORITES_KEY = "oscar_radio_favorites";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"sorties" | "radio" | "playlists">("sorties");

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Sorties & Loisirs</h1>
          <p className="text-sm text-muted-foreground">Culture, musique et divertissement</p>
        </div>
        <Ticket className="w-6 h-6 text-primary" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card flex-shrink-0">
        {[
          { key: "sorties", label: "Sorties", icon: Clapperboard },
          { key: "radio", label: "Radios", icon: Radio },
          { key: "playlists", label: "Musique", icon: Headphones },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
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
            Dites-lui par exemple : « Oscar, qu'est-ce qui passe au cinéma en ce moment ? »
          </p>
        </div>

        {activeTab === "sorties" && (
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

        {activeTab === "radio" && (
          <>
            <p className="text-sm text-muted-foreground">Appuyez sur ▶ pour écouter • ⭐ pour sauvegarder en favori</p>

            {/* Favorites first */}
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
