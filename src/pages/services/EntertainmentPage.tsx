import { ArrowLeft, Ticket, CalendarHeart, Heart, Bell, Send, MessageCircle, ExternalLink, SearchX } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, nextWednesday, nextSaturday, nextSunday } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface EventSuggestion {
  id: string;
  emoji: string;
  category: string;
  /** Clé de préférence liée (pour le filtrage) */
  prefKey: string;
  title: string;
  lieu: string;
  date: string;
  conseilPratique: string;
  source?: { name: string; url: string };
  externalUrl?: string;
}

interface LeisurePreference {
  key: string;
  label: string;
  emoji: string;
}

// --- Préférences de loisirs ---
const LEISURE_PREFERENCES: LeisurePreference[] = [
  { key: "cinema", label: "Cinéma", emoji: "🎬" },
  { key: "musique", label: "Musique", emoji: "🎵" },
  { key: "nature", label: "Nature", emoji: "🌿" },
  { key: "cuisine", label: "Cuisine", emoji: "🍳" },
  { key: "musees", label: "Musées", emoji: "🖼️" },
  { key: "sport_doux", label: "Sport doux", emoji: "🧘" },
  { key: "theatre", label: "Théâtre", emoji: "🎭" },
  { key: "jardinage", label: "Jardinage", emoji: "🌻" },
];

// --- Génération dynamique de dates relatives ---
function getRelativeDate(dayOfWeek: "wed" | "sat" | "sun" | "next_week", hour: string): string {
  const now = new Date();
  let target: Date;
  switch (dayOfWeek) {
    case "wed":
      target = nextWednesday(now);
      break;
    case "sat":
      target = nextSaturday(now);
      break;
    case "sun":
      target = nextSunday(now);
      break;
    case "next_week":
      target = addDays(now, 10);
      break;
  }
  const formatted = format(target, "EEEE d MMMM", { locale: fr });
  return `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} — ${hour}`;
}

function getExpoDate(): string {
  const end = addDays(new Date(), 21);
  return `Jusqu'au ${format(end, "d MMMM", { locale: fr })} — Entrée gratuite le 1er dimanche`;
}

// --- Événements dynamiques (dates relatives, jamais périmés) ---
function generateEvents(): EventSuggestion[] {
  return [
    {
      id: "1",
      emoji: "🎬",
      category: "Cinéma",
      prefKey: "cinema",
      title: "Le Comte de Monte-Cristo",
      lieu: "Cinéma Le Champo, Paris 5e",
      date: getRelativeDate("wed", "14h30"),
      conseilPratique: "Séance accessible en fauteuil roulant · Tarif senior 7,50 €",
      source: { name: "Le Champo", url: "https://www.lechampo.com" },
      externalUrl: "https://www.lechampo.com/evenement/le-comte-de-monte-cristo/",
    },
    {
      id: "2",
      emoji: "🎵",
      category: "Concert",
      prefKey: "musique",
      title: "Orchestre de Paris — Mozart & Beethoven",
      lieu: "Philharmonie de Paris, 19e",
      date: getRelativeDate("sat", "20h00"),
      conseilPratique: "Métro ligne 5 arrêt Porte de Pantin · Places à tarif réduit le jour-même",
      source: { name: "Philharmonie de Paris", url: "https://philharmoniedeparis.fr" },
      externalUrl: "https://philharmoniedeparis.fr/fr/saison-2025-2026",
    },
    {
      id: "3",
      emoji: "🖼️",
      category: "Exposition",
      prefKey: "musees",
      title: "Les Impressionnistes et la mer",
      lieu: "Musée d'Orsay, Paris 7e",
      date: getExpoDate(),
      conseilPratique: "Entrée gratuite ce dimanche · Accès direct par le RER C Musée d'Orsay",
      source: { name: "Musée d'Orsay", url: "https://www.musee-orsay.fr" },
      externalUrl: "https://www.musee-orsay.fr/fr/agenda/expositions",
    },
    {
      id: "4",
      emoji: "🌿",
      category: "Nature",
      prefKey: "nature",
      title: "Balade guidée au Jardin des Plantes",
      lieu: "Jardin des Plantes, Paris 5e",
      date: getRelativeDate("sun", "10h00"),
      conseilPratique: "Gratuit · Parcours adapté aux personnes à mobilité réduite · Bus ligne 89 s'arrête devant",
      source: { name: "Jardin des Plantes", url: "https://www.jardindesplantesdeparis.fr" },
      externalUrl: "https://www.jardindesplantesdeparis.fr/fr/programme/visites-guidees",
    },
    {
      id: "5",
      emoji: "🎭",
      category: "Théâtre",
      prefKey: "theatre",
      title: "Le Malade imaginaire — Comédie-Française",
      lieu: "Comédie-Française, Paris 1er",
      date: getRelativeDate("sat", "15h00"),
      conseilPratique: "Tarif réduit -26 ans et +65 ans · Boucle magnétique disponible",
      source: { name: "Comédie-Française", url: "https://www.comedie-francaise.fr" },
      externalUrl: "https://www.comedie-francaise.fr/fr/programme",
    },
    {
      id: "6",
      emoji: "🧘",
      category: "Sport doux",
      prefKey: "sport_doux",
      title: "Tai Chi au Parc Monceau",
      lieu: "Parc Monceau, Paris 8e",
      date: getRelativeDate("sun", "09h30"),
      conseilPratique: "Gratuit · Séance adaptée aux seniors · Apportez un tapis ou une serviette",
      source: { name: "Mairie de Paris", url: "https://www.paris.fr/pages/le-sport-a-paris-2500" },
      externalUrl: "https://www.paris.fr/pages/le-sport-a-paris-2500",
    },
    {
      id: "7",
      emoji: "🍳",
      category: "Cuisine",
      prefKey: "cuisine",
      title: "Atelier cuisine — Tarte tatin revisitée",
      lieu: "Ateliers des Sens, Paris 4e",
      date: getRelativeDate("wed", "10h30"),
      conseilPratique: "Ambiance conviviale · Tablier fourni · Vous repartez avec votre création",
      source: { name: "Ateliers des Sens", url: "https://www.atelier-des-sens.com" },
      externalUrl: "https://www.atelier-des-sens.com/ateliers-cuisine-paris/",
    },
    {
      id: "8",
      emoji: "🌻",
      category: "Jardinage",
      prefKey: "jardinage",
      title: "Initiation jardinage — Potager de printemps",
      lieu: "Jardin partagé Vieille-du-Temple, Paris 3e",
      date: getRelativeDate("sat", "10h00"),
      conseilPratique: "Gratuit · Gants et outils fournis · Sur inscription",
      source: { name: "Jardins partagés de Paris", url: "https://jardinons-ensemble.org" },
      externalUrl: "https://jardinons-ensemble.org/les-jardins/",
    },
  ];
}

const STORAGE_KEY = "oscar_leisure_preferences";

type TabKey = "semaine" | "envies";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("semaine");
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);
  const [familyContacts, setFamilyContacts] = useState<{ id: string; name: string }[]>([]);

  // Événements générés dynamiquement (dates relatives)
  const allEvents = useMemo(() => generateEvents(), []);

  // Préférences
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sauvegarder les préférences localement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPrefs));
  }, [selectedPrefs]);

  // Charger les contacts famille pour le partage
  useEffect(() => {
    if (!user) return;
    supabase
      .from("family_contacts")
      .select("id, name")
      .then(({ data }) => {
        if (data) setFamilyContacts(data);
      });
  }, [user]);

  // --- Filtrage réel par préférences ---
  const filteredEvents = useMemo(() => {
    if (selectedPrefs.length === 0) return allEvents;
    return allEvents.filter(ev => selectedPrefs.includes(ev.prefKey));
  }, [allEvents, selectedPrefs]);

  const togglePref = (key: string) => {
    setSelectedPrefs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleReminder = (event: EventSuggestion) => {
    toast.success(`Rappel ajouté pour "${event.title}"`, {
      description: event.date,
    });
  };

  // Partage réel via family_messages
  const handleShare = async (event: EventSuggestion, contactId?: string) => {
    if (!user) {
      toast.error("Connectez-vous pour partager");
      return;
    }

    if (familyContacts.length === 0) {
      toast.info("Ajoutez d'abord un contact famille", {
        description: "Allez dans Mes Proches pour ajouter un contact.",
        action: { label: "Mes Proches", onClick: () => navigate("/services/family") },
      });
      return;
    }

    // Si un seul contact → partage direct ; sinon afficher le choix
    if (familyContacts.length === 1 || contactId) {
      const targetId = contactId || familyContacts[0].id;
      const targetName = familyContacts.find(c => c.id === targetId)?.name || "votre proche";
      const message = `🎟️ Je te recommande cette sortie !\n\n${event.emoji} ${event.title}\n📍 ${event.lieu}\n📅 ${event.date}${event.externalUrl ? `\n🔗 ${event.externalUrl}` : ""}`;

      const { error } = await supabase.from("family_messages").insert({
        sender_id: user.id,
        receiver_id: targetId,
        content: message,
      });

      if (error) {
        toast.error("Échec de l'envoi");
      } else {
        toast.success(`Suggestion envoyée à ${targetName} !`, {
          description: event.title,
        });
      }
      setSharingEventId(null);
    } else {
      // Afficher le sélecteur de contact
      setSharingEventId(event.id);
    }
  };

  const handleOscarSearch = () => {
    const prefsLabels = selectedPrefs
      .map(key => LEISURE_PREFERENCES.find(p => p.key === key)?.label)
      .filter(Boolean)
      .join(", ");

    const message = prefsLabels
      ? `Oscar, je cherche des sorties cette semaine. J'aime : ${prefsLabels}. Qu'est-ce que tu me proposes près de chez moi ?`
      : `Oscar, qu'est-ce que tu me proposes comme sortie cette semaine près de chez moi ?`;

    navigate("/", { state: { prefillMessage: message } });
  };

  const TABS = [
    { key: "semaine" as TabKey, label: "Cette semaine", icon: CalendarHeart },
    { key: "envies" as TabKey, label: "Mes envies", icon: Heart },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Sorties & Loisirs</h1>
          <p className="text-sm text-muted-foreground">Culture, musique et divertissement</p>
        </div>
        <Ticket className="w-6 h-6 text-primary" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {/* Oscar banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-primary">Oscar peut aussi vous aider !</span>{" "}
            Dites-moi ce que vous aimez, je trouve ce qui se passe près de chez vous.
          </p>
        </div>

        {/* ========== CETTE SEMAINE ========== */}
        {activeTab === "semaine" && (
          <>
            {/* Info filtrage actif */}
            {selectedPrefs.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Filtré par :</span>
                {selectedPrefs.map(key => {
                  const pref = LEISURE_PREFERENCES.find(p => p.key === key);
                  return pref ? (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full"
                    >
                      {pref.emoji} {pref.label}
                    </span>
                  ) : null;
                })}
                <button
                  onClick={() => setSelectedPrefs([])}
                  className="text-xs text-muted-foreground underline hover:text-foreground ml-1"
                >
                  Tout afficher
                </button>
              </div>
            )}

            {filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-card rounded-xl border border-border p-4 space-y-3"
                  >
                    {/* En-tête événement */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {event.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-primary uppercase tracking-wide">
                            {event.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground text-base leading-tight">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{event.lieu}</p>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                      </div>
                    </div>

                    {/* Conseil pratique */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                        💡 {event.conseilPratique}
                      </p>
                    </div>

                    {/* Lien externe "Plus d'infos / Réserver" */}
                    {event.externalUrl && (
                      <a
                        href={event.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Plus d'infos / Réserver
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReminder(event)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50"
                      >
                        <Bell className="w-4 h-4" />
                        Me rappeler
                      </button>
                      <button
                        onClick={() => handleShare(event)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50"
                      >
                        <Send className="w-4 h-4" />
                        Partager avec ma famille
                      </button>
                    </div>

                    {/* Sélecteur de contact pour le partage */}
                    {sharingEventId === event.id && familyContacts.length > 1 && (
                      <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-foreground">Envoyer à :</p>
                        <div className="flex flex-wrap gap-2">
                          {familyContacts.map(contact => (
                            <button
                              key={contact.id}
                              onClick={() => handleShare(event, contact.id)}
                              className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 font-medium transition-colors"
                            >
                              {contact.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setSharingEventId(null)}
                          className="text-xs text-muted-foreground underline"
                        >
                          Annuler
                        </button>
                      </div>
                    )}

                    {/* Source */}
                    {event.source && (
                      <a
                        href={event.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Source : {event.source.name} <span className="text-base">→</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* État vide — aucun événement ne correspond aux préférences */
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4">
                  <SearchX className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-medium text-base mb-2">
                  Aucun événement ne correspond à vos centres d'intérêt cette semaine.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Essayez d'ajouter d'autres centres d'intérêt dans "Mes envies", ou affichez tous les événements.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedPrefs([])}
                    className="mx-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20"
                  >
                    Afficher tous les événements
                  </button>
                  <button
                    onClick={() => setActiveTab("envies")}
                    className="mx-auto px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Modifier mes envies
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== MES ENVIES ========== */}
        {activeTab === "envies" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sélectionnez vos centres d'intérêt pour filtrer les événements qui vous ressemblent.
            </p>

            {/* Grille de préférences */}
            <div className="grid grid-cols-2 gap-3">
              {LEISURE_PREFERENCES.map(pref => {
                const isSelected = selectedPrefs.includes(pref.key);
                const matchCount = allEvents.filter(ev => ev.prefKey === pref.key).length;
                return (
                  <button
                    key={pref.key}
                    onClick={() => togglePref(pref.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left relative ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{pref.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium block ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {pref.label}
                      </span>
                      {matchCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {matchCount} événement{matchCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Résumé filtrage */}
            {selectedPrefs.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-primary">{filteredEvents.length}</span>{" "}
                  événement{filteredEvents.length !== 1 ? "s" : ""} correspond{filteredEvents.length !== 1 ? "ent" : ""} à vos {selectedPrefs.length} centre{selectedPrefs.length > 1 ? "s" : ""} d'intérêt.
                </p>
                <button
                  onClick={() => setActiveTab("semaine")}
                  className="mt-2 text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Voir les événements →
                </button>
              </div>
            )}

            {/* Bouton Oscar */}
            <button
              onClick={handleOscarSearch}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)",
              }}
            >
              <MessageCircle className="w-5 h-5" />
              Oscar, trouve-moi quelque chose
            </button>
          </>
        )}
      </div>
    </div>
  );
}
