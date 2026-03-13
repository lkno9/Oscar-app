import { useState } from "react";
import { ArrowLeft, Radio, Play, Pause, Volume2 } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface Station {
  id: string;
  name: string;
  genre: string;
  emoji: string;
  streamUrl: string;
  description: string;
}

const STATIONS: Station[] = [
  {
    id: "france-inter",
    name: "France Inter",
    genre: "Généraliste",
    emoji: "🇫🇷",
    streamUrl: "https://icecast.radiofrance.fr/franceinter-midfi.mp3",
    description: "Actualités, culture, humour et divertissement",
  },
  {
    id: "france-info",
    name: "franceinfo",
    genre: "Info en continu",
    emoji: "📰",
    streamUrl: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3",
    description: "L'actualité en continu, 24h/24",
  },
  {
    id: "france-musique",
    name: "France Musique",
    genre: "Classique",
    emoji: "🎻",
    streamUrl: "https://icecast.radiofrance.fr/francemusique-midfi.mp3",
    description: "Musique classique, jazz et musiques du monde",
  },
  {
    id: "france-culture",
    name: "France Culture",
    genre: "Culture",
    emoji: "📚",
    streamUrl: "https://icecast.radiofrance.fr/franceculture-midfi.mp3",
    description: "Débats, documentaires, savoirs et idées",
  },
  {
    id: "nostalgie",
    name: "Nostalgie",
    genre: "Hits d'époque",
    emoji: "🎶",
    streamUrl: "https://scdn.nrjaudio.fm/adwz2/fr/30601/mp3_128.mp3",
    description: "Les plus grands tubes des années 60 à 90",
  },
  {
    id: "rtl",
    name: "RTL",
    genre: "Généraliste",
    emoji: "📻",
    streamUrl: "https://streamer-02.rtl.fr/rtl-1-44-128",
    description: "Info, divertissement et émissions cultes",
  },
  {
    id: "rfi",
    name: "RFI",
    genre: "International",
    emoji: "🌍",
    streamUrl: "https://live02.rfi.fr/rfimonde-96k.mp3",
    description: "L'actualité internationale en français",
  },
  {
    id: "radio-classique",
    name: "Radio Classique",
    genre: "Classique",
    emoji: "🎹",
    streamUrl: "https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3",
    description: "Le meilleur de la musique classique",
  },
];

export function RadioPage() {
  const goBack = useBackNavigation();
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  const playStation = (station: Station) => {
    if (currentStation?.id === station.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = station.streamUrl;
    audio.play().then(() => {
      setCurrentStation(station);
      setIsPlaying(true);
    }).catch(() => {
      // Fallback si le stream ne démarre pas
      setCurrentStation(station);
      setIsPlaying(false);
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { audio.pause(); goBack(); }} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Ma Radio</h1>
              <p className="text-sm text-muted-foreground">Écoutez vos stations préférées</p>
            </div>
          </div>
        </div>
      </header>

      {/* Now Playing */}
      {currentStation && (
        <div className="mx-4 mt-4 p-4 rounded-2xl" style={{
          background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
          boxShadow: "0 8px 28px rgba(72,162,158,0.25)",
        }}>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: 40 }}>{currentStation.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg">{currentStation.name}</p>
              <p className="text-white/70 text-sm">{currentStation.genre}</p>
            </div>
            <button
              onClick={() => playStation(currentStation)}
              className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
              style={{ backdropFilter: "blur(12px)" }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" />
              )}
            </button>
          </div>
          {isPlaying && (
            <div className="flex items-center gap-2 mt-3">
              <Volume2 className="w-4 h-4 text-white/60" />
              <div className="flex gap-0.5 items-end">
                {[3, 5, 4, 6, 3, 5, 4, 6, 3, 5].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/50 rounded-full"
                    style={{
                      height: h * 2 + Math.random() * 4,
                      animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <span className="text-white/60 text-sm ml-2">En direct</span>
            </div>
          )}
        </div>
      )}

      {/* Station List */}
      <div className="flex-1 p-4 space-y-3 pb-24">
        <p className="text-sm text-muted-foreground font-medium mb-2">
          {STATIONS.length} stations disponibles
        </p>
        {STATIONS.map((station) => {
          const isCurrent = currentStation?.id === station.id;
          return (
            <button
              key={station.id}
              onClick={() => playStation(station)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                isCurrent && isPlaying
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-card border-border hover:shadow-md"
              }`}
            >
              <span style={{ fontSize: 32 }}>{station.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">{station.name}</p>
                <p className="text-sm text-muted-foreground">{station.description}</p>
                <span className="text-sm text-primary font-medium mt-1 inline-block bg-primary/5 px-2 py-0.5 rounded-full">
                  {station.genre}
                </span>
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isCurrent && isPlaying ? "rgba(72,162,158,0.15)" : "rgba(148,163,184,0.1)",
                }}>
                {isCurrent && isPlaying ? (
                  <Pause className="w-5 h-5 text-primary" />
                ) : (
                  <Play className="w-5 h-5 text-muted-foreground ml-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
