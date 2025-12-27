import { ArrowLeft, Music, Radio, Play, Heart, ListMusic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MusicPage() {
  const navigate = useNavigate();

  const radios = [
    { id: 1, name: "France Inter", genre: "Généraliste", emoji: "📻" },
    { id: 2, name: "RTL", genre: "Généraliste", emoji: "🎙️" },
    { id: 3, name: "Nostalgie", genre: "Oldies", emoji: "🎵" },
    { id: 4, name: "France Musique", genre: "Classique", emoji: "🎼" },
  ];

  const playlists = [
    { id: 1, name: "Mes favoris", count: 24, emoji: "❤️" },
    { id: 2, name: "Détente", count: 18, emoji: "😌" },
    { id: 3, name: "Années 60-70", count: 45, emoji: "🕺" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Musique & radio</h1>
          <p className="text-sm text-muted-foreground">Écoutez vos favoris</p>
        </div>
        <Music className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Radios */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Radios
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {radios.map((radio) => (
              <button
                key={radio.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-colors"
              >
                <span className="text-3xl">{radio.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{radio.name}</span>
                <span className="text-xs text-muted-foreground">{radio.genre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Playlists */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            Mes playlists
          </h2>
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {playlist.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">{playlist.count} titres</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full">
                <Play className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
