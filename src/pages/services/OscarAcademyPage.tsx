import { ArrowLeft, GraduationCap, Play, CheckCircle, Clock, ChevronRight, ExternalLink, Globe } from "lucide-react";
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
    title: "Utiliser le SOS",
    description: "En cas d'urgence, accédez rapidement aux numéros de secours et à votre famille.",
    duration: "1 min",
    emoji: "🆘",
    steps: [
      { title: "Accéder à SOS", content: "Depuis le menu Services, faites défiler vers 'Aide & Support' et appuyez sur 'SOS / Urgence'." },
      { title: "Appeler les secours", content: "La page SOS affiche directement les numéros d'urgence : SAMU (15), Pompiers (18), Police (17). Appuyez sur le numéro pour appeler immédiatement." },
      { title: "Appeler votre famille", content: "En bas de la page SOS, vos contacts d'urgence sont affichés. Appuyez sur leur nom pour les appeler en un clic." },
      { title: "Trouver les secours proches", content: "Le bouton 'Autour de moi' localise les hôpitaux, pharmacies et commissariats les plus proches de votre position actuelle." },
    ],
  },
];

interface ExternalResource {
  title: string;
  description: string;
  url: string;
  emoji: string;
}

const EXTERNAL_RESOURCES: ExternalResource[] = [
  { title: "Premiers Clics", description: "Cours d'informatique gratuits pour seniors et débutants, étape par étape.", url: "https://www.premiers-clics.fr/", emoji: "🖱️" },
  { title: "Xyoos", description: "Cours gratuits sur l'ordinateur, la tablette et le smartphone pour débutants.", url: "https://cours-informatique-gratuit.fr/", emoji: "💻" },
  { title: "Cybermalveillance.gouv.fr", description: "Conseils officiels pour se protéger des arnaques et de la cybercriminalité.", url: "https://www.cybermalveillance.gouv.fr/", emoji: "🔒" },
  { title: "Pour les personnes âgées", description: "Portail officiel d'information pour les personnes âgées et les aidants.", url: "https://www.pour-les-personnes-agees.gouv.fr/", emoji: "🏛️" },
  { title: "Les Bases du numérique", description: "Fiches pratiques de l'ANCT : WhatsApp, email, démarches en ligne...", url: "https://lesbases.anct.gouv.fr/", emoji: "📚" },
];

export function OscarAcademyPage() {
  const goBack = useBackNavigation();
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("academy_completed") || "[]"); }
    catch { return []; }
  });

  const markComplete = (id: string) => {
    const updated = [...new Set([...completed, id])];
    setCompleted(updated);
    localStorage.setItem("academy_completed", JSON.stringify(updated));
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

  // Module step view
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

        <div className="h-1.5 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex gap-2 justify-center">
            {activeModule.steps.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentStep ? 'bg-primary w-6' : i < currentStep ? 'bg-primary/40' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 flex-1 flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{activeModule.emoji}</div>
              <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{step.content}</p>
            </div>
          </div>

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

        {/* External resources */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ressources recommandées</h2>
          {EXTERNAL_RESOURCES.map((res, i) => (
            <a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-primary/40 transition-all no-underline"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl flex-shrink-0">
                {res.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base flex items-center gap-1.5">
                  {res.title}
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                </p>
                <p className="text-sm text-muted-foreground leading-tight">{res.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
