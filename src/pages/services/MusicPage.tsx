import { ArrowLeft, Music, Radio, Play, ListMusic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MusicPage() {
  const navigate = useNavigate();

  // Radios are static - these are public radio stations
  const radios = [
    { id: 1, name: "France Inter", genre: "Généraliste", emoji: "📻", url: "https://www.radiofrance.fr/franceinter" },
    { id: 2, name: "RTL", genre: "Généraliste", emoji: "🎙️", url: "https://www.rtl.fr/" },
    { id: 3, name: "Nostalgie", genre: "Oldies", emoji: "🎵", url: "https://www.nostalgie.fr/" },
    { id: 4, name: "France Musique", genre: "Classique", emoji: "🎼", url: "https://www.radiofrance.fr/francemusique" },
    { id: 5, name: "RFM", genre: "Variétés", emoji: "🎶", url: "https://www.rfm.fr/" },
    { id: 6, name: "Radio Classique", genre: "Classique", emoji: "🎻", url: "https://www.radioclassique.fr/" },
  ];

  const handleRadioClick = (url: string) => {
    window.open(url, '_blank');
  };

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
        {/* Info */}
        <div className="bg-accent rounded-xl p-4">
          <p className="text-foreground font-medium mb-1">🎧 Écoutez la radio</p>
          <p className="text-sm text-muted-foreground">
            Cliquez sur une radio pour l'écouter sur son site officiel
          </p>
        </div>

        {/* Radios */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Radios françaises
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {radios.map((radio) => (
              <button
                key={radio.id}
                onClick={() => handleRadioClick(radio.url)}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-colors active:bg-secondary"
              >
                <span className="text-3xl">{radio.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{radio.name}</span>
                <span className="text-xs text-muted-foreground">{radio.genre}</span>
                <ExternalLink className="w-4 h-4 text-primary mt-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            Idées d'écoute
          </h2>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-foreground font-medium mb-2">💡 Suggestions</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>Le matin :</strong> France Inter pour les infos</li>
              <li>• <strong>Détente :</strong> France Musique ou Radio Classique</li>
              <li>• <strong>Souvenirs :</strong> Nostalgie pour les tubes d'antan</li>
              <li>• <strong>Variétés :</strong> RTL ou RFM pour la musique actuelle</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
