import { ArrowLeft, BookOpen, Headphones, Newspaper, BookMarked, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LibraryPage() {
  const navigate = useNavigate();

  const resources = [
    { 
      icon: BookMarked, 
      label: "Livres audio", 
      description: "Écoutez des livres gratuitement",
      color: "text-blue-500", 
      bg: "bg-blue-100 dark:bg-blue-900/30",
      url: "https://www.audiocite.net/"
    },
    { 
      icon: Headphones, 
      label: "Podcasts", 
      description: "Des émissions sur tous les sujets",
      color: "text-purple-500", 
      bg: "bg-purple-100 dark:bg-purple-900/30",
      url: "https://www.radiofrance.fr/podcasts"
    },
    { 
      icon: Newspaper, 
      label: "Journaux", 
      description: "L'actualité en ligne",
      color: "text-orange-500", 
      bg: "bg-orange-100 dark:bg-orange-900/30",
      url: "https://www.lemonde.fr/"
    },
  ];

  const suggestions = [
    { 
      title: "AudioCité", 
      description: "Livres audio gratuits lus par des bénévoles", 
      emoji: "📖",
      url: "https://www.audiocite.net/"
    },
    { 
      title: "France Culture", 
      description: "Podcasts de qualité sur tous les sujets", 
      emoji: "🎙️",
      url: "https://www.radiofrance.fr/franceculture"
    },
    { 
      title: "20 Minutes", 
      description: "L'info gratuite et accessible", 
      emoji: "📰",
      url: "https://www.20minutes.fr/"
    },
    { 
      title: "Litterature Audio", 
      description: "Des classiques à écouter gratuitement", 
      emoji: "📚",
      url: "https://www.litteratureaudio.com/"
    },
  ];

  const handleClick = (url: string) => {
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
          <h1 className="text-lg font-bold text-foreground">Bibliothèque & podcasts</h1>
          <p className="text-sm text-muted-foreground">Lecture et écoute</p>
        </div>
        <BookOpen className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Info */}
        <div className="bg-accent rounded-xl p-4">
          <p className="text-foreground font-medium mb-1">📚 Explorez les ressources gratuites</p>
          <p className="text-sm text-muted-foreground">
            Découvrez des livres audio, podcasts et journaux accessibles en ligne
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-3 gap-3">
          {resources.map((resource, index) => (
            <button
              key={index}
              onClick={() => handleClick(resource.url)}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-colors"
            >
              <div className={`w-12 h-12 rounded-full ${resource.bg} flex items-center justify-center`}>
                <resource.icon className={`w-6 h-6 ${resource.color}`} />
              </div>
              <span className="font-medium text-foreground text-sm text-center">{resource.label}</span>
            </button>
          ))}
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Suggestions pour vous
          </h2>
          {suggestions.map((item, index) => (
            <button
              key={index}
              onClick={() => handleClick(item.url)}
              className="w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
