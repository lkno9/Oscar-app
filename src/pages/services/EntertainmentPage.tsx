import { ArrowLeft, Ticket, CalendarHeart, Heart, Bell, Send, MessageCircle } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface EventSuggestion {
  id: string;
  emoji: string;
  category: string;
  title: string;
  lieu: string;
  date: string;
  conseilPratique: string;
}

interface LeisurePreference {
  key: string;
  label: string;
  emoji: string;
}

// --- Données mockées : événements Île-de-France ---
const MOCK_EVENTS: EventSuggestion[] = [
  {
    id: "1",
    emoji: "🎬",
    category: "Cinéma",
    title: "Le Comte de Monte-Cristo",
    lieu: "Cinéma Le Champo, Paris 5e",
    date: "Mercredi 2 avril — 14h30",
    conseilPratique: "Séance accessible en fauteuil roulant · Tarif senior 7,50 €",
  },
  {
    id: "2",
    emoji: "🎵",
    category: "Concert",
    title: "Orchestre de Paris — Mozart & Beethoven",
    lieu: "Philharmonie de Paris, 19e",
    date: "Samedi 5 avril — 20h00",
    conseilPratique: "Métro ligne 5 arrêt Porte de Pantin · Places à tarif réduit le jour-même",
  },
  {
    id: "3",
    emoji: "🖼️",
    category: "Exposition",
    title: "Les Impressionnistes et la mer",
    lieu: "Musée d'Orsay, Paris 7e",
    date: "Jusqu'au 15 avril — Entrée gratuite le 1er dimanche",
    conseilPratique: "Entrée gratuite ce dimanche · Accès direct par le RER C Musée d'Orsay",
  },
  {
    id: "4",
    emoji: "🌿",
    category: "Nature",
    title: "Balade guidée au Jardin des Plantes",
    lieu: "Jardin des Plantes, Paris 5e",
    date: "Dimanche 6 avril — 10h00",
    conseilPratique: "Gratuit · Parcours adapté aux personnes à mobilité réduite · Bus ligne 89 s'arrête devant",
  },
];

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

const STORAGE_KEY = "oscar_leisure_preferences";

type TabKey = "semaine" | "envies";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("semaine");

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

  const handleShare = (event: EventSuggestion) => {
    toast.success(`Message envoyé à votre famille`, {
      description: `Suggestion : ${event.title}`,
    });
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
            {MOCK_EVENTS.length > 0 ? (
              <div className="space-y-3">
                {MOCK_EVENTS.map(event => (
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

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReminder(event)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border-2 border-primary/20 text-primary hover:bg-primary/5"
                      >
                        <Bell className="w-4 h-4" />
                        Me rappeler
                      </button>
                      <button
                        onClick={() => handleShare(event)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border-2 border-primary/20 text-primary hover:bg-primary/5"
                      >
                        <Send className="w-4 h-4" />
                        Partager
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* État vide */
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4">
                  🔍
                </div>
                <p className="text-foreground font-medium text-base mb-2">
                  Je n'ai pas encore trouvé d'événements près de chez vous.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dites-moi ce qui vous plaît et je cherche pour vous.
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== MES ENVIES ========== */}
        {activeTab === "envies" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sélectionnez vos centres d'intérêt pour que je puisse vous proposer des sorties qui vous ressemblent.
            </p>

            {/* Grille de préférences */}
            <div className="grid grid-cols-2 gap-3">
              {LEISURE_PREFERENCES.map(pref => {
                const isSelected = selectedPrefs.includes(pref.key);
                return (
                  <button
                    key={pref.key}
                    onClick={() => togglePref(pref.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{pref.emoji}</span>
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {pref.label}
                    </span>
                  </button>
                );
              })}
            </div>

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

            {selectedPrefs.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {selectedPrefs.length} centre{selectedPrefs.length > 1 ? "s" : ""} d'intérêt sélectionné{selectedPrefs.length > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
