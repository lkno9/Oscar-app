import { ArrowLeft, GraduationCap, Play, CheckCircle, Clock, Star, ChevronRight, Video, PlayCircle, ExternalLink, BookOpen, Globe } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState } from "react";

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  emoji: string;
  steps: { title: string; content: string }[];
  isNew?: boolean;
}

const MODULES: Module[] = [
  {
    id: "chat-oscar",
    title: "Parler à Oscar",
    description: "Apprenez à poser des questions à Oscar et obtenir des réponses personnalisées.",
    duration: "2 min",
    emoji: "💬",
    isNew: true,
    steps: [
      { title: "Ouvrir le chat", content: "Appuyez sur le bouton 'Discuter avec Oscar' depuis l'accueil pour ouvrir la conversation." },
      { title: "Poser une question", content: "Tapez votre question en français simple. Par exemple : 'Comment prendre mes médicaments ?' ou 'Rappelle-moi mon rendez-vous de demain'." },
      { title: "Utiliser le micro", content: "Appuyez sur l'icône microphone pour parler directement à Oscar — il comprend la voix !" },
      { title: "Relire les réponses", content: "Oscar garde l'historique de vos échanges. Faites défiler vers le haut pour retrouver une réponse précédente." },
    ],
  },
  {
    id: "agenda",
    title: "Gérer mon agenda",
    description: "Ajoutez et retrouvez facilement vos rendez-vous médicaux et personnels.",
    duration: "2 min",
    emoji: "📅",
    steps: [
      { title: "Accéder à l'agenda", content: "Depuis 'Mes Services', appuyez sur 'Agenda & rendez-vous'." },
      { title: "Voir le calendrier", content: "Les jours avec des événements ont un petit point de couleur. Appuyez sur un jour pour voir les événements." },
      { title: "Ajouter un rendez-vous", content: "Appuyez sur le bouton vert '+' en bas. Renseignez le titre, la date, l'heure et le lieu." },
      { title: "Activer le rappel", content: "Activez 'Rappel Oscar' — il vous rappellera votre rendez-vous la veille et le jour même." },
    ],
  },
  {
    id: "famille",
    title: "Contacter ma famille",
    description: "Envoyez des messages et appelez vos proches en quelques secondes.",
    duration: "2 min",
    emoji: "👨‍👩‍👧",
    steps: [
      { title: "Ouvrir Communication", content: "Depuis 'Mes Services', appuyez sur 'Communication'." },
      { title: "Envoyer un message", content: "Dans l'onglet 'Messages', choisissez un membre de la famille et tapez votre message." },
      { title: "Passer un appel", content: "Dans l'onglet 'Appels', appuyez sur le téléphone vert à côté du nom de votre proche." },
      { title: "Réponses non lues", content: "Un badge apparaît sur la tuile Communication quand vous avez de nouveaux messages." },
    ],
  },
  {
    id: "medicaments",
    title: "Suivre mes médicaments",
    description: "Organisez votre liste de médicaments et cochez ceux que vous avez pris.",
    duration: "3 min",
    emoji: "💊",
    steps: [
      { title: "Ouvrir Santé & Bien-être", content: "Depuis 'Mes Services', appuyez sur 'Santé & bien-être', puis l'onglet 'Médicaments'." },
      { title: "Ajouter un médicament", content: "Appuyez sur '+' et renseignez le nom, le dosage et la fréquence (ex: matin et soir)." },
      { title: "Cocher 'pris'", content: "Chaque jour, appuyez sur ✓ pour marquer chaque médicament comme pris. Oscar peut vous le rappeler." },
      { title: "Ajouter une ordonnance", content: "Appuyez sur 'Ordonnances' pour photographier et conserver vos prescriptions en sécurité." },
    ],
  },
  {
    id: "photos",
    title: "Partager des photos",
    description: "Consultez vos souvenirs et les photos envoyées par votre famille.",
    duration: "2 min",
    emoji: "📷",
    steps: [
      { title: "Ouvrir Photos", content: "Depuis 'Mes Services', appuyez sur 'Photos & souvenirs'." },
      { title: "Ajouter une photo", content: "Appuyez sur le bouton '+' et sélectionnez une photo depuis votre galerie ou prenez-en une." },
      { title: "Photos de la famille", content: "L'onglet 'Reçues' affiche les photos que vos proches vous ont envoyées via l'interface famille." },
      { title: "Voir en grand", content: "Appuyez sur une photo pour l'afficher en plein écran. Vous pouvez aussi y ajouter une légende." },
    ],
  },
  {
    id: "sos",
    title: "Utiliser le bouton SOS",
    description: "En cas d'urgence, signalez rapidement votre situation à vos proches.",
    duration: "1 min",
    emoji: "🆘",
    steps: [
      { title: "Trouver le SOS", content: "Le bouton SOS est dans 'Réglages' → section rouge en haut. Ou accédez-y depuis la page Services." },
      { title: "Appuyer sur SOS", content: "Maintenez le bouton rouge SOS pour confirmer l'urgence (évite les fausses alertes)." },
      { title: "Choisir l'action", content: "Trois options : Appeler ma famille, Appeler le 15 (SAMU), ou Envoyer ma position GPS." },
      { title: "Votre famille est alertée", content: "Votre famille reçoit automatiquement une notification d'urgence avec votre localisation." },
    ],
  },
];

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  emoji: string;
  category: string;
  /** YouTube video ID — when present, embeds real YouTube player */
  youtubeId?: string;
  /** Key tips shown in the video detail view */
  tips?: string[];
}

const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: "vid-decouverte",
    title: "Découvrir Oscar en 3 minutes",
    description: "Présentation générale d'Oscar et de toutes ses fonctionnalités principales.",
    duration: "3 min",
    emoji: "👋",
    category: "Premiers pas",
    tips: [
      "Oscar est votre assistant numérique personnel, disponible 24h/24.",
      "Vous pouvez lui parler par écrit ou par la voix.",
      "Il vous aide pour vos rendez-vous, vos médicaments, vos messages et bien plus.",
      "Vos proches peuvent aussi suivre votre bien-être via l'interface famille."
    ],
  },
  {
    id: "vid-parler-oscar",
    title: "Parler à Oscar au micro",
    description: "Comment utiliser la commande vocale pour poser des questions à Oscar.",
    duration: "2 min",
    emoji: "🎙️",
    category: "Premiers pas",
    tips: [
      "Appuyez sur l'icône microphone en bas de la conversation.",
      "Parlez naturellement, comme avec un ami — Oscar comprend le français.",
      "Attendez qu'Oscar réponde, puis il peut aussi vous lire sa réponse à voix haute.",
      "Astuce : commencez par 'Oscar...' suivi de votre question."
    ],
  },
  {
    id: "vid-agenda",
    title: "Gérer ses rendez-vous",
    description: "Ajouter, modifier et consulter vos rendez-vous dans l'agenda.",
    duration: "3 min",
    emoji: "📅",
    category: "Services",
    tips: [
      "Ouvrez 'Agenda & rendez-vous' depuis Mes Services.",
      "Les jours avec un point coloré ont des événements — appuyez dessus.",
      "Le bouton '+' en bas permet d'ajouter un nouveau rendez-vous.",
      "Activez le rappel Oscar pour ne jamais oublier un rendez-vous important."
    ],
  },
  {
    id: "vid-medicaments",
    title: "Suivre ses médicaments",
    description: "Ajouter vos médicaments et activer les rappels quotidiens.",
    duration: "3 min",
    emoji: "💊",
    category: "Services",
    tips: [
      "Allez dans 'Santé & bien-être' puis l'onglet 'Médicaments'.",
      "Ajoutez chaque médicament avec son nom, dosage et fréquence.",
      "Chaque jour, cochez les médicaments pris — Oscar peut vous le rappeler.",
      "Photographiez vos ordonnances pour les garder en sécurité."
    ],
  },
  {
    id: "vid-famille",
    title: "Communiquer avec sa famille",
    description: "Envoyer des messages, passer des appels et partager des photos.",
    duration: "4 min",
    emoji: "👨‍👩‍👧",
    category: "Services",
    tips: [
      "Ouvrez 'Communication' depuis Mes Services.",
      "Choisissez un proche dans la liste pour lui envoyer un message.",
      "L'onglet 'Appels' permet d'appeler directement vos proches.",
      "Un badge rouge apparaît quand vous avez des messages non lus."
    ],
  },
  {
    id: "vid-photos",
    title: "Partager des photos",
    description: "Envoyer et recevoir des photos avec vos proches en toute simplicité.",
    duration: "2 min",
    emoji: "📷",
    category: "Services",
    tips: [
      "Ouvrez 'Photos & souvenirs' depuis Mes Services.",
      "Appuyez sur '+' pour ajouter une photo depuis votre galerie.",
      "L'onglet 'Reçues' affiche les photos envoyées par votre famille.",
      "Appuyez sur une photo pour l'afficher en grand et ajouter une légende."
    ],
  },
  {
    id: "vid-sos",
    title: "Utiliser le bouton SOS",
    description: "Comment déclencher une alerte en cas d'urgence et prévenir vos proches.",
    duration: "2 min",
    emoji: "🆘",
    category: "Sécurité",
    tips: [
      "Le bouton SOS se trouve dans les Réglages, en haut.",
      "Maintenez-le appuyé pour confirmer l'alerte (évite les erreurs).",
      "Vous pouvez appeler votre famille, le 15 (SAMU) ou envoyer votre position.",
      "Votre famille reçoit automatiquement une notification d'urgence."
    ],
  },
  {
    id: "vid-arnaques",
    title: "Se protéger des arnaques",
    description: "Reconnaître les messages frauduleux et protéger ses informations.",
    duration: "4 min",
    emoji: "🛡️",
    category: "Sécurité",
    tips: [
      "Ne communiquez jamais vos codes bancaires par téléphone ou email.",
      "Méfiez-vous des messages urgents qui vous demandent de cliquer sur un lien.",
      "Vérifiez l'adresse de l'expéditeur — les arnaques imitent souvent La Poste, la banque, etc.",
      "En cas de doute, demandez à Oscar : 'Est-ce une arnaque ?' avec une capture d'écran."
    ],
  },
  {
    id: "vid-documents",
    title: "Stocker ses documents",
    description: "Scanner, organiser et retrouver vos documents importants.",
    duration: "3 min",
    emoji: "📂",
    category: "Services",
    tips: [
      "Ouvrez 'Documents' depuis Mes Services.",
      "Appuyez sur '+' pour scanner un document avec l'appareil photo.",
      "Classez vos documents par catégorie : santé, administratif, personnel.",
      "Retrouvez-les facilement grâce à la barre de recherche."
    ],
  },
  {
    id: "vid-reglages",
    title: "Personnaliser Oscar",
    description: "Mode sombre, voix, notifications : adapter Oscar à vos préférences.",
    duration: "2 min",
    emoji: "⚙️",
    category: "Réglages",
    tips: [
      "Allez dans 'Réglages' depuis le menu en bas.",
      "Activez le mode sombre pour un écran plus doux le soir.",
      "Réglez la taille du texte : petit, normal, grand ou très grand.",
      "Choisissez quelles notifications vous souhaitez recevoir."
    ],
  },
];

/** External learning resources for seniors */
interface ExternalResource {
  title: string;
  description: string;
  url: string;
  emoji: string;
}

const EXTERNAL_RESOURCES: ExternalResource[] = [
  {
    title: "Premiers Clics",
    description: "Cours d'informatique gratuits pour seniors et débutants, étape par étape.",
    url: "https://www.premiers-clics.fr/",
    emoji: "🖱️",
  },
  {
    title: "Xyoos",
    description: "Cours gratuits sur l'ordinateur, la tablette et le smartphone pour débutants.",
    url: "https://cours-informatique-gratuit.fr/",
    emoji: "💻",
  },
  {
    title: "Cybermalveillance.gouv.fr",
    description: "Conseils officiels pour se protéger des arnaques et de la cybercriminalité.",
    url: "https://www.cybermalveillance.gouv.fr/",
    emoji: "🔒",
  },
  {
    title: "Pour les personnes âgées",
    description: "Portail officiel d'information pour les personnes âgées et les aidants.",
    url: "https://www.pour-les-personnes-agees.gouv.fr/",
    emoji: "🏛️",
  },
  {
    title: "Les Bases du numérique",
    description: "Fiches pratiques de l'ANCT : WhatsApp, email, démarches en ligne...",
    url: "https://lesbases.anct.gouv.fr/",
    emoji: "📚",
  },
];

export function OscarAcademyPage() {
  const goBack = useBackNavigation();
  const [activeSection, setActiveSection] = useState<"modules" | "videos">("modules");
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("academy_watched_videos") || "[]"); }
    catch { return []; }
  });
  const [playingVideo, setPlayingVideo] = useState<VideoTutorial | null>(null);
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("academy_completed") || "[]"); }
    catch { return []; }
  });

  const markComplete = (id: string) => {
    const updated = [...new Set([...completed, id])];
    setCompleted(updated);
    localStorage.setItem("academy_completed", JSON.stringify(updated));
  };

  const markVideoWatched = (id: string) => {
    const updated = [...new Set([...watchedVideos, id])];
    setWatchedVideos(updated);
    localStorage.setItem("academy_watched_videos", JSON.stringify(updated));
  };

  const startModule = (mod: Module) => {
    setActiveModule(mod);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (!activeModule) return;
    if (currentStep < activeModule.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      markComplete(activeModule.id);
      setActiveModule(null);
    }
  };

  // Video / tutorial detail view
  if (playingVideo) {
    const hasYouTube = !!playingVideo.youtubeId;
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => setPlayingVideo(null)} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{playingVideo.title}</h1>
            <p className="text-sm text-muted-foreground">{playingVideo.category} • {playingVideo.duration}</p>
          </div>
          <span className="text-2xl">{playingVideo.emoji}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* YouTube embed OR visual card */}
          {hasYouTube ? (
            <div className="rounded-2xl overflow-hidden border border-border aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playingVideo.youtubeId}?rel=0&modestbranding=1`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl aspect-video flex flex-col items-center justify-center border border-primary/20">
              <div className="text-5xl mb-3">{playingVideo.emoji}</div>
              <p className="text-base font-semibold text-foreground mb-1">{playingVideo.title}</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary mt-2">
                <Clock className="w-3 h-3" />
                Vidéo en préparation
              </span>
            </div>
          )}

          {/* Description */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-lg font-bold text-foreground mb-2">A propos de ce tutoriel</h2>
            <p className="text-base text-muted-foreground leading-relaxed">{playingVideo.description}</p>
          </div>

          {/* Tips — always shown as practical guide */}
          {playingVideo.tips && playingVideo.tips.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Les points essentiels
              </h2>
              <div className="space-y-3">
                {playingVideo.tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed flex-1">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark as watched */}
          <button
            onClick={() => { markVideoWatched(playingVideo.id); setPlayingVideo(null); }}
            className="w-full min-h-[56px] bg-primary text-primary-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            {watchedVideos.includes(playingVideo.id) ? "Déjà consulté !" : "J'ai compris, marquer comme vu"}
          </button>
        </div>
      </div>
    );
  }

  if (activeModule) {
    const step = activeModule.steps[currentStep];
    const progress = ((currentStep + 1) / activeModule.steps.length) * 100;
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => setActiveModule(null)} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{activeModule.title}</h1>
            <p className="text-sm text-muted-foreground">Étape {currentStep + 1} sur {activeModule.steps.length}</p>
          </div>
          <span className="text-2xl">{activeModule.emoji}</span>
        </header>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Step dots */}
          <div className="flex gap-2 justify-center">
            {activeModule.steps.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentStep ? 'bg-primary w-6' : i < currentStep ? 'bg-primary/40' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Step content */}
          <div className="bg-card rounded-2xl border border-border p-6 flex-1 flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{activeModule.emoji}</div>
              <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{step.content}</p>
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={nextStep}
            className="w-full min-h-[56px] bg-primary text-primary-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors"
          >
            {currentStep < activeModule.steps.length - 1 ? (
              <>Suivant <ChevronRight className="w-5 h-5" /></>
            ) : (
              <>Terminer <CheckCircle className="w-5 h-5" /></>
            )}
          </button>
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(s => s - 1)} className="text-center text-sm text-muted-foreground py-2">
              ← Étape précédente
            </button>
          )}
        </div>
      </div>
    );
  }

  const completedCount = completed.length;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Académie Oscar</h1>
          <p className="text-sm text-muted-foreground">Apprenez à utiliser Oscar</p>
        </div>
        <GraduationCap className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">
        {/* Progress banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{completedCount}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">
              {completedCount === 0 ? "Commencez votre apprentissage !" :
               completedCount === MODULES.length ? "Bravo, vous maîtrisez Oscar ! 🎉" :
               `${completedCount} module${completedCount > 1 ? 's' : ''} terminé${completedCount > 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / MODULES.length) * 100}%` }} />
              </div>
              <span className="text-sm text-muted-foreground">{completedCount}/{MODULES.length}</span>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("modules")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeSection === "modules"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground hover:bg-secondary"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Modules interactifs
          </button>
          <button
            onClick={() => setActiveSection("videos")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeSection === "videos"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground hover:bg-secondary"
            }`}
          >
            <Video className="w-4 h-4" />
            Tutoriels vidéo
          </button>
        </div>

        {activeSection === "modules" ? (
          <>
            {/* Modules */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Modules disponibles</h2>
              {MODULES.map((mod) => {
                const isDone = completed.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => startModule(mod)}
                    className="w-full bg-card rounded-2xl border border-border p-4 text-left flex items-center gap-4 hover:border-primary/40 transition-all active:scale-[0.98]"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${isDone ? 'bg-accent' : 'bg-primary/10'}`}>
                      {isDone ? '✅' : mod.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-foreground text-base">{mod.title}</p>
                        {mod.isNew && !isDone && (
                          <span className="text-sm bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">Nouveau</span>
                        )}
                        {isDone && (
                          <span className="text-sm bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">Terminé</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-tight">{mod.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />{mod.duration}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Play className="w-3 h-3" />{mod.steps.length} étapes
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Video tutorials */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Guides Oscar</h2>
                <span className="text-sm text-muted-foreground">{watchedVideos.length}/{VIDEO_TUTORIALS.length} consultés</span>
              </div>

              {(() => {
                const videoCategories = [...new Set(VIDEO_TUTORIALS.map(v => v.category))];
                return videoCategories.map(cat => (
                  <div key={cat} className="space-y-2">
                    <p className="text-sm font-semibold text-primary uppercase tracking-wide">{cat}</p>
                    {VIDEO_TUTORIALS.filter(v => v.category === cat).map(vid => {
                      const isWatched = watchedVideos.includes(vid.id);
                      const hasVideo = !!vid.youtubeId;
                      return (
                        <button
                          key={vid.id}
                          onClick={() => setPlayingVideo(vid)}
                          className="w-full bg-card rounded-2xl border border-border p-4 text-left flex items-center gap-4 hover:border-primary/40 transition-all active:scale-[0.98]"
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative ${isWatched ? 'bg-accent' : 'bg-primary/10'}`}>
                            {isWatched ? (
                              <span className="text-2xl">✅</span>
                            ) : (
                              <>
                                <span className="text-2xl">{vid.emoji}</span>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  {hasVideo ? (
                                    <PlayCircle className="w-3.5 h-3.5 text-primary-foreground" />
                                  ) : (
                                    <BookOpen className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-foreground text-base">{vid.title}</p>
                              {isWatched && (
                                <span className="text-sm bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">Vu</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-tight">{vid.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />{vid.duration}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                {hasVideo ? <Video className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                {hasVideo ? "Vidéo" : "Guide"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>

            {/* External resources */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Ressources recommandées
              </h2>
              <p className="text-sm text-muted-foreground -mt-1">
                Sites gratuits pour apprendre le numérique en toute confiance.
              </p>
              {EXTERNAL_RESOURCES.map((res) => (
                <a
                  key={res.url}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-card rounded-2xl border border-border p-4 text-left flex items-center gap-4 hover:border-primary/40 transition-all active:scale-[0.98] block"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 text-xl">
                    {res.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{res.title}</p>
                    <p className="text-sm text-muted-foreground leading-tight mt-0.5">{res.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          </>
        )}

        {/* Oscar tip */}
        <div className="bg-accent rounded-2xl border border-border p-4 flex items-start gap-3">
          <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <strong>Conseil :</strong> Vous pouvez aussi demander à Oscar directement sur l'accueil — dites simplement "Comment faire ?" et il vous guidera pas à pas.
          </p>
        </div>
      </div>
    </div>
  );
}
