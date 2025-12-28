import { ArrowLeft, BookOpen, Headphones, Newspaper, BookMarked, ExternalLink, Mic, Radio, Globe, FileText, GraduationCap, Library, Rss, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LibraryPage() {
  const navigate = useNavigate();

  const categories = [
    { 
      icon: BookMarked, 
      label: "Livres audio", 
      color: "text-blue-500", 
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    { 
      icon: Headphones, 
      label: "Podcasts", 
      color: "text-purple-500", 
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    { 
      icon: Newspaper, 
      label: "Journaux", 
      color: "text-orange-500", 
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    { 
      icon: Video, 
      label: "Documentaires", 
      color: "text-red-500", 
      bg: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  const audiobooks = [
    { title: "AudioCité", description: "Livres audio gratuits lus par des bénévoles", emoji: "📖", url: "https://www.audiocite.net/" },
    { title: "Littérature Audio", description: "Des classiques à écouter gratuitement", emoji: "📚", url: "https://www.litteratureaudio.com/" },
    { title: "Librivox FR", description: "Livres du domaine public en français", emoji: "🎧", url: "https://librivox.org/search?primary_key=0&search_category=language&search_page=1&search_form=get_results&search_order=catalog_date&language=French" },
    { title: "Sélection YouTube", description: "Livres audio complets sur YouTube", emoji: "▶️", url: "https://www.youtube.com/results?search_query=livre+audio+complet+francais" },
    { title: "Archive.org Audio", description: "Archives de livres audio libres", emoji: "🏛️", url: "https://archive.org/details/audio_bookspoetry?and%5B%5D=language%3A%22French%22" },
  ];

  const podcasts = [
    { title: "France Culture", description: "Podcasts de qualité sur tous les sujets", emoji: "🎙️", url: "https://www.radiofrance.fr/franceculture/podcasts" },
    { title: "France Inter", description: "Les meilleures émissions en replay", emoji: "📻", url: "https://www.radiofrance.fr/franceinter/podcasts" },
    { title: "RTL Podcasts", description: "Infos, culture et divertissement", emoji: "🎤", url: "https://www.rtl.fr/podcasts" },
    { title: "Europe 1 Podcasts", description: "Actualités et émissions cultes", emoji: "🌍", url: "https://www.europe1.fr/emissions" },
    { title: "RFI Podcasts", description: "L'actualité internationale", emoji: "🌐", url: "https://www.rfi.fr/fr/podcasts/" },
    { title: "Affaires Sensibles", description: "Les grandes affaires racontées", emoji: "🔍", url: "https://www.radiofrance.fr/franceinter/podcasts/affaires-sensibles" },
    { title: "Les Pieds sur Terre", description: "Témoignages et récits de vie", emoji: "👣", url: "https://www.radiofrance.fr/franceculture/podcasts/les-pieds-sur-terre" },
    { title: "Transfert", description: "Histoires vraies bouleversantes", emoji: "💫", url: "https://www.slate.fr/transfert" },
  ];

  const newspapers = [
    { title: "Le Monde", description: "L'actualité française et internationale", emoji: "📰", url: "https://www.lemonde.fr/" },
    { title: "Le Figaro", description: "Politique, économie, culture", emoji: "📄", url: "https://www.lefigaro.fr/" },
    { title: "20 Minutes", description: "L'info gratuite et accessible", emoji: "⏱️", url: "https://www.20minutes.fr/" },
    { title: "Ouest-France", description: "Premier quotidien français", emoji: "🗞️", url: "https://www.ouest-france.fr/" },
    { title: "Le Parisien", description: "Actualité de Paris et d'Île-de-France", emoji: "🗼", url: "https://www.leparisien.fr/" },
    { title: "Libération", description: "L'actualité en temps réel", emoji: "📢", url: "https://www.liberation.fr/" },
    { title: "L'Express", description: "Hebdomadaire d'actualité", emoji: "📊", url: "https://www.lexpress.fr/" },
    { title: "Le Point", description: "Politique et société", emoji: "📍", url: "https://www.lepoint.fr/" },
  ];

  const magazines = [
    { title: "Paris Match", description: "Actualité et people", emoji: "📸", url: "https://www.parismatch.com/" },
    { title: "GEO", description: "Voyage et découverte", emoji: "🌍", url: "https://www.geo.fr/" },
    { title: "Science & Vie", description: "Sciences et découvertes", emoji: "🔬", url: "https://www.science-et-vie.com/" },
    { title: "Notre Temps", description: "Le magazine des seniors", emoji: "⏰", url: "https://www.notretemps.com/" },
    { title: "Femme Actuelle", description: "Lifestyle et bien-être", emoji: "💐", url: "https://www.femmeactuelle.fr/" },
    { title: "Télérama", description: "Culture et télévision", emoji: "📺", url: "https://www.telerama.fr/" },
  ];

  const documentaries = [
    { title: "Arte Replay", description: "Documentaires gratuits en replay", emoji: "🎬", url: "https://www.arte.tv/fr/videos/documentaires/" },
    { title: "France TV Docs", description: "Documentaires de France Télévisions", emoji: "🇫🇷", url: "https://www.france.tv/documentaires/" },
    { title: "YouTube Docs FR", description: "Documentaires gratuits sur YouTube", emoji: "▶️", url: "https://www.youtube.com/results?search_query=documentaire+complet+francais" },
    { title: "C'est pas sorcier", description: "Sciences expliquées simplement", emoji: "🧪", url: "https://www.youtube.com/results?search_query=c%27est+pas+sorcier+complet" },
    { title: "Secrets d'Histoire", description: "L'Histoire racontée par Stéphane Bern", emoji: "👑", url: "https://www.france.tv/france-3/secrets-d-histoire/" },
  ];

  const learning = [
    { title: "France Culture Éducation", description: "Cours et conférences audio", emoji: "🎓", url: "https://www.radiofrance.fr/franceculture/podcasts/theme/education" },
    { title: "Fun MOOC", description: "Cours gratuits en ligne", emoji: "📚", url: "https://www.fun-mooc.fr/" },
    { title: "Apprendre TV5Monde", description: "Apprendre le français", emoji: "🌐", url: "https://apprendre.tv5monde.com/" },
    { title: "INA Jalons", description: "Archives vidéo historiques", emoji: "🎥", url: "https://www.ina.fr/" },
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {/* Info */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-foreground font-medium mb-1">📚 Une bibliothèque infinie</p>
          <p className="text-sm text-muted-foreground">
            Livres audio, podcasts, journaux, documentaires... tout gratuit !
          </p>
        </div>

        {/* Quick Categories */}
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-col items-center gap-2"
            >
              <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center`}>
                <cat.icon className={`w-5 h-5 ${cat.color}`} />
              </div>
              <span className="font-medium text-foreground text-[10px] text-center">{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Audiobooks */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            Livres audio gratuits
          </h2>
          <div className="space-y-2">
            {audiobooks.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="w-full bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl">
                  {item.emoji}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Podcasts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Podcasts à écouter
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {podcasts.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-colors"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-medium text-foreground text-xs text-center">{item.title}</span>
                <span className="text-[10px] text-muted-foreground text-center line-clamp-1">{item.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Newspapers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Journaux & actualités
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {newspapers.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="bg-card rounded-xl p-2 shadow-sm border border-border flex flex-col items-center gap-1 hover:border-primary transition-colors"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="font-medium text-foreground text-[10px] text-center leading-tight">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Magazines */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Magazines
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {magazines.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-col items-center gap-1 hover:border-primary transition-colors"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-medium text-foreground text-[10px] text-center">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Documentaries */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Video className="w-4 h-4" />
            Documentaires
          </h2>
          <div className="space-y-2">
            {documentaries.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="w-full bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-xl">
                  {item.emoji}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Learning */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Apprendre
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {learning.map((item, index) => (
              <button
                key={index}
                onClick={() => handleClick(item.url)}
                className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-2 hover:border-primary transition-colors"
              >
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1 text-left">
                  <span className="font-medium text-foreground text-xs block">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-foreground font-medium mb-2 flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            Astuce Oscar
          </p>
          <p className="text-sm text-muted-foreground">
            Demandez-moi des recommandations ! "Oscar, trouve-moi un bon podcast sur l'histoire" ou "Lis-moi les nouvelles du jour".
          </p>
        </div>
      </div>
    </div>
  );
}
