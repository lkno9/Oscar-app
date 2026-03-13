import { ArrowLeft, HelpCircle, MessageCircle, BookOpen, ChevronRight, Search, Mail, Phone as PhoneIcon, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState } from "react";

interface FaqCategory {
  name: string;
  emoji: string;
  items: { q: string; a: string }[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    name: "Oscar & conversation",
    emoji: "💬",
    items: [
      { q: "Comment parler à Oscar ?", a: "Appuyez sur le micro en bas de la page d'accueil et parlez naturellement. Oscar comprend le français et répond immédiatement. Vous pouvez aussi taper votre message au clavier." },
      { q: "Oscar comprend-il tout ce que je dis ?", a: "Oscar comprend le français courant. Parlez simplement et clairement. Si Oscar ne comprend pas, reformulez votre question autrement." },
      { q: "Puis-je appeler Oscar en vocal ?", a: "Oui ! Appuyez sur l'icône téléphone en haut à droite de la page Oscar pour lancer un appel vocal. Oscar vous parlera et vous écoutera comme au téléphone." },
      { q: "Oscar se souvient-il de nos conversations ?", a: "Oscar garde l'historique de vos échanges dans la session en cours. Faites défiler vers le haut pour retrouver une réponse précédente." },
      { q: "Oscar peut-il m'aider à remplir des formulaires ?", a: "Oui, demandez-lui directement. Par exemple : « Oscar, aide-moi à rédiger une lettre » ou « Comment remplir ma déclaration ? ». Il vous guidera pas à pas." },
    ],
  },
  {
    name: "Famille & contacts",
    emoji: "👨‍👩‍👧",
    items: [
      { q: "Comment inviter ma famille ?", a: "Allez dans Réglages > Accès Famille. Choisissez le lien familial et générez un code d'invitation à partager avec vos proches. Ils pourront se connecter depuis leur propre appareil." },
      { q: "Comment envoyer un message à ma famille ?", a: "Allez dans Services > Communication. Sélectionnez le contact dans la liste, tapez votre message et appuyez sur Envoyer." },
      { q: "Comment passer un appel à un proche ?", a: "Dans Services > Communication, onglet Appels, appuyez sur le bouton téléphone vert à côté du nom de votre proche." },
      { q: "Ma famille peut-elle voir mes informations ?", a: "Seuls les membres que vous avez invités via Accès Famille peuvent consulter certaines informations (rendez-vous, médicaments). Vous gardez le contrôle total." },
      { q: "Comment ajouter un contact d'urgence ?", a: "Allez dans Services > Famille, ajoutez un contact et cochez la case « Contact d'urgence ». Il apparaîtra sur la page SOS." },
    ],
  },
  {
    name: "Santé & médicaments",
    emoji: "💊",
    items: [
      { q: "Comment ajouter un médicament ?", a: "Rendez-vous dans Services > Santé & bien-être, onglet Médicaments. Appuyez sur le bouton '+' pour ajouter un nouveau médicament avec son nom, dosage et fréquence." },
      { q: "Comment fonctionne le rappel de médicaments ?", a: "Oscar vous envoie un rappel aux heures de prise habituelles (matin, midi, soir). Le rappel apparaît en notification sur votre écran d'accueil." },
      { q: "Puis-je désactiver les rappels de médicaments ?", a: "Oui, dans Réglages > Préférences, désactivez les Notifications. Vous pouvez aussi gérer chaque rappel individuellement depuis la page Santé." },
      { q: "Comment ajouter une ordonnance ?", a: "Dans Services > Santé > Ordonnances, appuyez sur '+' pour photographier votre ordonnance. Elle sera conservée en sécurité dans votre espace personnel." },
      { q: "Comment suivre mon bien-être ?", a: "Sur la page d'accueil, utilisez le curseur d'humeur pour indiquer comment vous vous sentez chaque jour. Vos proches pourront voir votre tendance générale." },
    ],
  },
  {
    name: "Documents & agenda",
    emoji: "📅",
    items: [
      { q: "Comment ajouter un rendez-vous ?", a: "Dans Services > Agenda, appuyez sur le bouton '+' en bas. Renseignez le titre, la date, l'heure et le lieu. Activez le rappel Oscar pour ne rien oublier." },
      { q: "Comment scanner un document ?", a: "Dans Services > Stockage & fichiers, appuyez sur '+' et choisissez de prendre une photo. Le document sera enregistré dans votre espace sécurisé." },
      { q: "Comment mettre un document en favori ?", a: "Dans Services > Documents, ouvrez le document et appuyez sur l'étoile pour l'ajouter aux favoris. Retrouvez-le ensuite dans l'onglet Favoris." },
      { q: "Comment savoir si un document expire bientôt ?", a: "Sur la page d'accueil, la section « Documents urgents » vous alerte 30 jours avant l'expiration de vos documents importants." },
    ],
  },
  {
    name: "Sécurité & confidentialité",
    emoji: "🔒",
    items: [
      { q: "Mes données sont-elles sécurisées ?", a: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Seuls vous et les membres de famille que vous avez invités y ont accès." },
      { q: "Comment activer la double authentification ?", a: "Dans Réglages > Sécurité, appuyez sur « Activer ». Vous devrez scanner un QR code avec une application d'authentification (comme Google Authenticator)." },
      { q: "Comment signaler une arnaque ?", a: "Allez dans Services > Protection Arnaques. Vous pouvez vérifier un message suspect, consulter les alertes récentes, ou faire le quiz sécurité. Oscar vous guide pour porter plainte si nécessaire." },
      { q: "Que fait le bouton SOS ?", a: "Le bouton SOS vous permet d'appeler les secours (15, 18, 17, 112), d'appeler votre famille ou d'envoyer votre position GPS en cas d'urgence." },
    ],
  },
  {
    name: "Application & réglages",
    emoji: "⚙️",
    items: [
      { q: "Comment fonctionne le mode sombre ?", a: "Dans Réglages > Préférences, activez le Mode sombre. L'écran passe en tons foncés pour réduire la fatigue oculaire, surtout le soir." },
      { q: "Comment activer/désactiver la voix d'Oscar ?", a: "Dans Réglages > Préférences, utilisez l'interrupteur « Mode vocal ». Quand il est activé, Oscar lit ses réponses à haute voix." },
      { q: "Puis-je changer la langue de l'application ?", a: "Pour l'instant, Oscar est disponible uniquement en français. D'autres langues sont prévues dans les prochaines mises à jour." },
      { q: "Comment recevoir les alertes par SMS ?", a: "Dans Réglages > Préférences, activez « Notifications SMS ». Vous devez d'abord avoir un numéro de téléphone renseigné dans votre profil." },
      { q: "Comment me déconnecter ?", a: "En bas de la page Réglages, appuyez sur le bouton rouge « Se déconnecter ». Vous pourrez vous reconnecter avec votre e-mail et mot de passe." },
    ],
  },
  {
    name: "Jeux & divertissements",
    emoji: "🎮",
    items: [
      { q: "Comment jouer aux jeux Oscar ?", a: "Dans Services > Jeux & mémoire, choisissez un jeu Oscar (Memory, Sudoku, Quiz, 2048). Vos scores et progressions sont enregistrés automatiquement." },
      { q: "Comment écouter de la musique ?", a: "Allez dans Services > Musique & radio. Vous pouvez écouter des stations de radio ou de la musique directement dans l'application." },
      { q: "Comment consulter les photos de ma famille ?", a: "Dans Services > Photos & souvenirs, l'onglet « Reçues » affiche les photos que vos proches vous ont envoyées." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left gap-3"
      >
        <span className="text-base font-medium text-foreground">{q}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <p className="pb-3 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export function HelpPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = search.trim()
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQ_CATEGORIES;

  const totalQuestions = FAQ_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Retour"
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Aide & FAQ</h1>
          <p className="text-sm text-muted-foreground">{totalQuestions} réponses à vos questions</p>
        </div>
        <HelpCircle className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">
        {/* Quick help banner */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-2">Besoin d'aide ?</h2>
          <p className="text-sm opacity-90 mb-4">
            Oscar est là pour vous accompagner 24h/24. Posez-lui vos questions directement !
          </p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/")}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Parler à Oscar
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans la FAQ..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Questions fréquentes
          </h2>

          {filteredCategories.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun résultat pour « {search} »</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez avec d'autres mots ou demandez à Oscar</p>
            </div>
          ) : (
            filteredCategories.map(cat => {
              const isExpanded = search.trim() || expandedCategory === cat.name;
              return (
                <div key={cat.name} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">{cat.items.length} question{cat.items.length > 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-2 divide-y divide-border">
                      {cat.items.map((item, i) => (
                        <FaqItem key={i} q={item.q} a={item.a} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contacter le support */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <PhoneIcon className="w-4 h-4" />
            Contacter le support
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-sm text-foreground font-medium mb-1">
                Vous ne trouvez pas la réponse ?
              </p>
              <p className="text-sm text-muted-foreground">
                Notre équipe est disponible du lundi au vendredi, de 9h à 18h.
              </p>
            </div>
            <a
              href="mailto:support@oscar-app.fr"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors border-b border-border"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Envoyer un e-mail</p>
                <p className="text-sm text-muted-foreground">support@oscar-app.fr</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </a>
            <a
              href="tel:+33180000000"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Appeler le support</p>
                <p className="text-sm text-muted-foreground">01 80 00 00 00 (appel non surtaxé)</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
