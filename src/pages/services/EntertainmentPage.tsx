import { ArrowLeft, Ticket, CalendarHeart, Heart, MessageCircle, Search } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --- Préférences de loisirs ---
interface LeisurePreference {
  key: string;
  label: string;
  emoji: string;
}

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPrefs));
  }, [selectedPrefs]);

  const togglePref = (key: string) => {
    setSelectedPrefs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
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
          <div className="flex flex-col items-center text-center py-8 px-2 space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Oscar cherche pour vous</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                En fonction de vos envies et de l'endroit où vous êtes
              </p>
            </div>

            {/* Préférences sélectionnées */}
            {selectedPrefs.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {selectedPrefs.map(key => {
                  const pref = LEISURE_PREFERENCES.find(p => p.key === key);
                  return pref ? (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary font-medium px-3 py-1 rounded-full"
                    >
                      {pref.emoji} {pref.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Bouton principal */}
            <button
              onClick={handleOscarSearch}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base"
              style={{ background: "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)" }}
            >
              <MessageCircle className="w-5 h-5" />
              {selectedPrefs.length > 0
                ? "Chercher des sorties selon mes envies"
                : "Chercher des sorties près de chez moi"}
            </button>

            <p className="text-sm text-muted-foreground">
              Oscar va chercher ce qui se passe vraiment près de chez vous cette semaine
            </p>

            {/* Lien vers Mes envies si aucune préférence */}
            {selectedPrefs.length === 0 && (
              <button
                onClick={() => setActiveTab("envies")}
                className="text-sm font-semibold text-primary underline underline-offset-2"
              >
                Définir mes envies →
              </button>
            )}
          </div>
        )}

        {/* ========== MES ENVIES ========== */}
        {activeTab === "envies" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sélectionnez vos centres d'intérêt pour qu'Oscar vous propose des sorties qui vous ressemblent.
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

            {/* Résumé + CTA */}
            {selectedPrefs.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-primary">{selectedPrefs.length}</span>{" "}
                  centre{selectedPrefs.length > 1 ? "s" : ""} d'intérêt sélectionné{selectedPrefs.length > 1 ? "s" : ""}.
                </p>
                <button
                  onClick={() => setActiveTab("semaine")}
                  className="mt-2 text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Chercher des sorties →
                </button>
              </div>
            )}

            {/* Bouton Oscar */}
            <button
              onClick={handleOscarSearch}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)" }}
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
