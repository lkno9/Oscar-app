import { ArrowLeft, Music, Radio, Play, ListMusic, ExternalLink, Globe, Headphones, Disc, Mic2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MusicPage() {
  const navigate = useNavigate();

  const radiosFrance = [
    { id: 1, name: "France Inter", genre: "Généraliste", emoji: "📻", url: "https://www.radiofrance.fr/franceinter" },
    { id: 2, name: "RTL", genre: "Généraliste", emoji: "🎙️", url: "https://www.rtl.fr/" },
    { id: 3, name: "Nostalgie", genre: "Oldies", emoji: "🎵", url: "https://www.nostalgie.fr/" },
    { id: 4, name: "France Musique", genre: "Classique", emoji: "🎼", url: "https://www.radiofrance.fr/francemusique" },
    { id: 5, name: "RFM", genre: "Variétés", emoji: "🎶", url: "https://www.rfm.fr/" },
    { id: 6, name: "Radio Classique", genre: "Classique", emoji: "🎻", url: "https://www.radioclassique.fr/" },
    { id: 7, name: "France Culture", genre: "Culture", emoji: "📖", url: "https://www.radiofrance.fr/franceculture" },
    { id: 8, name: "Europe 1", genre: "Généraliste", emoji: "🌍", url: "https://www.europe1.fr/" },
    { id: 9, name: "France Bleu", genre: "Régionale", emoji: "💙", url: "https://www.radiofrance.fr/francebleu" },
    { id: 10, name: "FIP", genre: "Éclectique", emoji: "🎧", url: "https://www.radiofrance.fr/fip" },
    { id: 11, name: "Chérie FM", genre: "Variétés", emoji: "💕", url: "https://www.cheriefm.fr/" },
    { id: 12, name: "Virgin Radio", genre: "Pop/Rock", emoji: "🤘", url: "https://www.virginradio.fr/" },
  ];

  const radiosInternational = [
    { id: 1, name: "BBC Radio 2", genre: "Généraliste UK", emoji: "🇬🇧", url: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_two" },
    { id: 2, name: "NPR Music", genre: "Variétés US", emoji: "🇺🇸", url: "https://www.npr.org/music" },
    { id: 3, name: "RAI Radio 1", genre: "Généraliste IT", emoji: "🇮🇹", url: "https://www.raiplayradio.it/radio1" },
    { id: 4, name: "Swiss Classic", genre: "Classique CH", emoji: "🇨🇭", url: "https://www.swissclassic.ch/" },
  ];

  const streamingServices = [
    { id: 1, name: "YouTube Music", description: "Des millions de titres gratuits", emoji: "🎬", url: "https://music.youtube.com/", color: "bg-red-500/10 text-red-500" },
    { id: 2, name: "Spotify Free", description: "Playlists et découvertes", emoji: "💚", url: "https://open.spotify.com/", color: "bg-green-500/10 text-green-500" },
    { id: 3, name: "Deezer", description: "Musique française et internationale", emoji: "🎵", url: "https://www.deezer.com/", color: "bg-purple-500/10 text-purple-500" },
    { id: 4, name: "SoundCloud", description: "Découvrez de nouveaux artistes", emoji: "☁️", url: "https://soundcloud.com/", color: "bg-orange-500/10 text-orange-500" },
  ];

  const genreStations = [
    { id: 1, name: "Jazz Radio", genre: "Jazz", emoji: "🎷", url: "https://www.jazzradio.fr/" },
    { id: 2, name: "TSF Jazz", genre: "Jazz", emoji: "🎺", url: "https://www.tsfjazz.com/" },
    { id: 3, name: "Radio Meuh", genre: "Éclectique", emoji: "🐮", url: "https://www.radiomeuh.com/" },
    { id: 4, name: "OÜI FM", genre: "Rock", emoji: "🎸", url: "https://www.ouifm.fr/" },
    { id: 5, name: "Mouv'", genre: "Urbain", emoji: "🔥", url: "https://www.radiofrance.fr/mouv" },
    { id: 6, name: "Skyrock", genre: "Hip-Hop", emoji: "💎", url: "https://www.skyrock.com/" },
    { id: 7, name: "Fun Radio", genre: "Dance", emoji: "💃", url: "https://www.funradio.fr/" },
    { id: 8, name: "Radio Nova", genre: "World", emoji: "🌎", url: "https://www.nova.fr/" },
  ];

  const curated = [
    { title: "Relaxation & Bien-être", description: "Musique douce pour se détendre", emoji: "🧘", url: "https://www.youtube.com/results?search_query=musique+relaxation+1+heure" },
    { title: "Classiques français", description: "Les plus belles chansons françaises", emoji: "🇫🇷", url: "https://www.youtube.com/results?search_query=chanson+francaise+classique+playlist" },
    { title: "Musique des années 60-70", description: "Nostalgie et souvenirs", emoji: "📀", url: "https://www.youtube.com/results?search_query=musique+annees+60+70+francaise" },
    { title: "Opéra & airs célèbres", description: "Les plus beaux airs d'opéra", emoji: "🎭", url: "https://www.youtube.com/results?search_query=opera+airs+celebres" },
    { title: "Musique de films", description: "Bandes originales inoubliables", emoji: "🎬", url: "https://www.youtube.com/results?search_query=musique+de+film+celebre+playlist" },
    { title: "Piano détente", description: "Mélodies au piano pour se relaxer", emoji: "🎹", url: "https://www.youtube.com/results?search_query=piano+relaxation+musique+douce" },
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
          <h1 className="text-lg font-bold text-foreground">Musique & radio</h1>
          <p className="text-sm text-muted-foreground">Écoutez vos favoris</p>
        </div>
        <Music className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {/* Info */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-foreground font-medium mb-1">🎧 Des milliers d'heures de musique</p>
          <p className="text-sm text-muted-foreground">
            Radios, streaming, playlists... tout est à portée de clic !
          </p>
        </div>

        {/* Streaming Services */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Plateformes de streaming
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {streamingServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleClick(service.url)}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-all hover:shadow-md"
              >
                <span className="text-3xl">{service.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{service.name}</span>
                <span className="text-xs text-muted-foreground text-center">{service.description}</span>
                <ExternalLink className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        </div>

        {/* French Radios */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Radios françaises
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {radiosFrance.map((radio) => (
              <button
                key={radio.id}
                onClick={() => handleClick(radio.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-col items-center gap-1 hover:border-primary transition-colors active:bg-secondary"
              >
                <span className="text-2xl">{radio.emoji}</span>
                <span className="font-medium text-foreground text-xs text-center leading-tight">{radio.name}</span>
                <span className="text-[10px] text-muted-foreground">{radio.genre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Genre Stations */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Disc className="w-4 h-4" />
            Par genre musical
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {genreStations.map((radio) => (
              <button
                key={radio.id}
                onClick={() => handleClick(radio.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-col items-center gap-1 hover:border-primary transition-colors"
              >
                <span className="text-xl">{radio.emoji}</span>
                <span className="font-medium text-foreground text-[10px] text-center leading-tight">{radio.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* International Radios */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Radios internationales
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {radiosInternational.map((radio) => (
              <button
                key={radio.id}
                onClick={() => handleClick(radio.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3 hover:border-primary transition-colors"
              >
                <span className="text-2xl">{radio.emoji}</span>
                <div className="text-left flex-1">
                  <span className="font-medium text-foreground text-sm block">{radio.name}</span>
                  <span className="text-xs text-muted-foreground">{radio.genre}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Curated Playlists */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Sélections pour vous
          </h2>
          <div className="space-y-2">
            {curated.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-all hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {item.emoji}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Play className="w-5 h-5 text-primary" />
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-foreground font-medium mb-2 flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-primary" />
            Astuce Oscar
          </p>
          <p className="text-sm text-muted-foreground">
            Demandez-moi de lancer votre radio préférée ! Dites simplement "Lance Nostalgie" ou "Mets de la musique classique".
          </p>
        </div>
      </div>
    </div>
  );
}
