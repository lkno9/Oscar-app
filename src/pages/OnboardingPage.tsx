import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OscarAvatar } from "@/components/OscarAvatar";
import { ChevronRight, Check } from "lucide-react";

// --- Options ---
const INTEREST_OPTIONS = [
  { id: "actualites", label: "Actualités", emoji: "📰" },
  { id: "cuisine", label: "Cuisine & Recettes", emoji: "👨‍🍳" },
  { id: "radio", label: "Radio & Musique", emoji: "🎵" },
  { id: "jeux", label: "Jeux & Mémoire", emoji: "🧩" },
  { id: "sante", label: "Santé & Bien-être", emoji: "💚" },
  { id: "photos", label: "Photos & Souvenirs", emoji: "📸" },
  { id: "sorties", label: "Sorties & Culture", emoji: "🎭" },
  { id: "securite", label: "Sécurité", emoji: "🛡️" },
];

const TECH_LEVELS = [
  { id: "beginner", label: "Je débute", desc: "Oscar vous guidera pas à pas", emoji: "🌱" },
  { id: "intermediate", label: "Je me débrouille", desc: "Vous connaissez les bases", emoji: "👍" },
  { id: "comfortable", label: "À l'aise", desc: "Vous êtes autonome", emoji: "💪" },
];

const CONTACT_TIMES = [
  { id: "morning", label: "Le matin", emoji: "🌅" },
  { id: "afternoon", label: "L'après-midi", emoji: "☀️" },
  { id: "evening", label: "Le soir", emoji: "🌙" },
  { id: "important", label: "Quand c'est important", emoji: "🔔" },
];

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [techLevel, setTechLevel] = useState("");
  const [contactTime, setContactTime] = useState("");

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return interests.length > 0;
    if (step === 2) return techLevel !== "";
    if (step === 3) return contactTime !== "";
    return false;
  };

  const finish = () => {
    localStorage.setItem(
      "oscar_onboarding",
      JSON.stringify({
        completed: true,
        interests,
        techLevel,
        contactTime,
        completedAt: new Date().toISOString(),
      })
    );
    navigate("/");
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  return (
    <div className="flex flex-col h-full bg-background" style={{ minHeight: "100dvh" }}>
      {/* Progress bar */}
      <div className="flex gap-2 px-6 pt-6 flex-shrink-0">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              height: 5,
              background: i <= step ? "#48A29E" : "#e2e8f0",
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-3 flex-shrink-0">
        <button
          onClick={() => {
            localStorage.setItem(
              "oscar_onboarding",
              JSON.stringify({ completed: true, skipped: true, completedAt: new Date().toISOString() })
            );
            navigate("/");
          }}
          style={{ fontSize: 13, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
        >
          Passer →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center">
            <OscarAvatar size="lg" className="w-24 h-24 mb-6" />
            <h1 className="text-foreground" style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              Bienvenue !
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 340 }}>
              Je suis <strong style={{ color: "#48A29E" }}>Oscar</strong>, votre compagnon du quotidien.
              En quelques questions, je vais apprendre à vous connaître pour mieux vous accompagner.
            </p>
          </div>
        )}

        {/* Step 1 — Interests */}
        {step === 1 && (
          <div className="w-full max-w-sm">
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🎯</span>
            <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Qu'est-ce qui vous intéresse ?
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 24 }}>
              Sélectionnez tout ce qui vous plaît
            </p>
            <div className="grid grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map(opt => {
                const selected = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleInterest(opt.id)}
                    className="bg-card text-left"
                    style={{
                      background: selected ? "rgba(72,162,158,0.1)" : undefined,
                      border: `2px solid ${selected ? "#48A29E" : "hsl(var(--border))"}`,
                      borderRadius: 16,
                      padding: "14px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                    <span className="text-foreground flex-1" style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Tech level */}
        {step === 2 && (
          <div className="w-full max-w-sm">
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📱</span>
            <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Et la technologie ?
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 24 }}>
              Oscar s'adapte à votre niveau
            </p>
            <div className="flex flex-col gap-3">
              {TECH_LEVELS.map(opt => {
                const selected = techLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTechLevel(opt.id)}
                    className="bg-card text-left"
                    style={{
                      background: selected ? "rgba(72,162,158,0.1)" : undefined,
                      border: `2px solid ${selected ? "#48A29E" : "hsl(var(--border))"}`,
                      borderRadius: 16,
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{opt.emoji}</span>
                    <div className="flex-1">
                      <p className="text-foreground" style={{ fontSize: 16, fontWeight: 700 }}>{opt.label}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 13 }}>{opt.desc}</p>
                    </div>
                    {selected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Contact time */}
        {step === 3 && (
          <div className="w-full max-w-sm">
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>⏰</span>
            <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              Quand vous contacter ?
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 24 }}>
              Oscar vous enverra un petit message au moment idéal
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CONTACT_TIMES.map(opt => {
                const selected = contactTime === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setContactTime(opt.id)}
                    className="bg-card"
                    style={{
                      background: selected ? "rgba(72,162,158,0.1)" : undefined,
                      border: `2px solid ${selected ? "#48A29E" : "hsl(var(--border))"}`,
                      borderRadius: 16,
                      padding: "18px 14px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{opt.emoji}</span>
                    <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                    {selected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <button
          onClick={next}
          disabled={!canProceed()}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            background: canProceed()
              ? "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)"
              : "#e2e8f0",
            color: canProceed() ? "#fff" : "#94a3b8",
            fontSize: 17,
            fontWeight: 700,
            border: "none",
            cursor: canProceed() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
            boxShadow: canProceed() ? "0 4px 16px rgba(72,162,158,0.3)" : "none",
          }}
        >
          {step < TOTAL_STEPS - 1 ? "Continuer" : "C'est parti !"}
          <ChevronRight className="w-5 h-5" />
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full text-center text-muted-foreground"
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            ← Retour
          </button>
        )}
      </div>
    </div>
  );
}
