import { ArrowLeft, Music, Radio, Play, ExternalLink, Globe, Headphones, Disc, Mic2, Heart, Star, StarOff } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";

interface RadioStation {
  id: number;
  name: string;
  genre: string;
  emoji: string;
  url: string;
  category: string;
}

const RADIOS: RadioStation[] = [
  { id: 1, name: "France Inter", genre: "Généraliste", emoji: "📻", url: "https://www.radiofrance.fr/franceinter", category: "fr" },
  { id: 2, name: "RTL", genre: "Généraliste", emoji: "🎙️", url: "https://www.rtl.fr/", category: "fr" },
  { id: 3, name: "Nostalgie", genre: "Oldies", emoji: "🎵", url: "https://www.nostalgie.fr/", category: "fr" },
  { id: 4, name: "France Musique", genre: "Classique", emoji: "🎼", url: "https://www.radiofrance.fr/francemusique", category: "fr" },
  { id: 5, name: "RFM", genre: "Variétés", emoji: "🎶", url: "https://www.rfm.fr/", category: "fr" },
  { id: 6, name: "Radio Classique", genre: "Classique", emoji: "🎻", url: "https://www.radioclassique.fr/", category: "fr" },
  { id: 7, name: "France Culture", genre: "Culture", emoji: "📖", url: "https://www.radiofrance.fr/franceculture", category: "fr" },
  { id: 8, name: "Europe 1", genre: "Généraliste", emoji: "🌍", url: "https://www.europe1.fr/", category: "fr" },
  { id: 9, name: "France Bleu", genre: "Régionale", emoji: "💙", url: "https://www.radiofrance.fr/francebleu", category: "fr" },
  { id: 10, name: "FIP", genre: "Éclectique", emoji: "🎧", url: "https://www.radiofrance.fr/fip", category: "fr" },
  { id: 11, name: "Chérie FM", genre: "Variétés", emoji: "💕", url: "https://www.cheriefm.fr/", category: "fr" },
  { id: 12, name: "Jazz Radio", genre: "Jazz", emoji: "🎷", url: "https://www.jazzradio.fr/", category: "genre" },
  { id: 13, name: "TSF Jazz", genre: "Jazz", emoji: "🎺", url: "https://www.tsfjazz.com/", category: "genre" },
  { id: 14, name: "OÜI FM", genre: "Rock", emoji: "🎸", url: "https://www.ouifm.fr/", category: "genre" },
  { id: 15, name: "BBC Radio 2", genre: "UK", emoji: "🇬🇧", url: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_two", category: "intl" },
  { id: 16, name: "Radio Nova", genre: "World", emoji: "🌎", url: "https://www.nova.fr/", category: "genre" },
];

const CURATED = [
  { title: "Relaxation & Bien-être", emoji: "🧘", url: "https://www.youtube.com/results?search_query=musique+relaxation+1+heure" },
  { title: "Classiques français", emoji: "🇫🇷", url: "https://www.youtube.com/results?search_query=chanson+francaise+classique+playlist" },
  { title: "Années 60-70", emoji: "📀", url: "https://www.youtube.com/results?search_query=musique+annees+60+70+francaise" },
  { title: "Piano détente", emoji: "🎹", url: "https://www.youtube.com/results?search_query=piano+relaxation+musique+douce" },
  { title: "Opéra & airs célèbres", emoji: "🎭", url: "https://www.youtube.com/results?search_query=opera+airs+celebres" },
  { title: "Musique de films", emoji: "🎬", url: "https://www.youtube.com/results?search_query=musique+de+film+celebre+playlist" },
];

const FAVORITES_KEY = "oscar_radio_favorites";

export function MusicPage() {
  const goBack = useBackNavigation();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"france" | "favorites" | "playlists">("france");

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

  const handleClick = (url: string) => window.open(url, "_blank");

  const frRadios = RADIOS.filter(r => r.category === "fr");
  const favoriteRadios = RADIOS.filter(r => favorites.includes(r.id));

  const RadioCard = ({ radio }: { radio: RadioStation }) => (
    <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
        {radio.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{radio.name}</p>
        <p className="text-sm text-muted-foreground">{radio.genre}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleFavorite(radio.id)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          {favorites.includes(radio.id) ? (
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          ) : (
            <Star className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => handleClick(radio.url)}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Musique & radio</h1>
          <p className="text-sm text-muted-foreground">Écoutez vos favoris</p>
        </div>
        <Music className="w-6 h-6 text-primary" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card flex-shrink-0">
        {[
          { key: "france", label: "Radios", icon: Radio },
          { key: "favorites", label: `Favoris${favorites.length > 0 ? ` (${favorites.length})` : ""}`, icon: Heart },
          { key: "playlists", label: "Playlists", icon: Headphones },
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {activeTab === "france" && (
          <>
            <p className="text-sm text-muted-foreground">Appuyez sur ▶ pour écouter • ⭐ pour sauvegarder en favori</p>
            <div className="space-y-3">
              {frRadios.map(r => <RadioCard key={r.id} radio={r} />)}
            </div>
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Disc className="w-4 h-4" />Autres radios
              </h2>
              {RADIOS.filter(r => r.category !== "fr" && r.category !== "intl").map(r => <RadioCard key={r.id} radio={r} />)}
            </div>
          </>
        )}

        {activeTab === "favorites" && (
          favoriteRadios.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground font-medium mb-1">Aucun favori</p>
              <p className="text-sm text-muted-foreground">Appuyez sur ⭐ sur une radio pour l'ajouter ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteRadios.map(r => <RadioCard key={r.id} radio={r} />)}
            </div>
          )
        )}

        {activeTab === "playlists" && (
          <>
            <p className="text-sm text-muted-foreground">Sélections musicales pour vous, sur YouTube</p>
            <div className="space-y-3">
              {CURATED.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(item.url)}
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

            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-foreground font-medium mb-2 flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-primary" />
                Astuce Oscar
              </p>
              <p className="text-sm text-muted-foreground">
                Demandez à Oscar de lancer votre radio ! Dites "Lance Nostalgie" ou "Mets de la musique classique".
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
