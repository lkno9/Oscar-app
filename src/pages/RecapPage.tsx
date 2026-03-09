import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Cloud,
  MessageCircle,
  Gamepad2,
  Sparkles,
  X,
  Check,
  Heart,
  Flame,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEngagement, getNextMilestone } from "@/hooks/useEngagement";
import { useRssArticles, ACTU_CATEGORIES, timeAgo } from "@/hooks/useRssArticles";
import { OscarAvatar } from "@/components/OscarAvatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface Weather { temp: number; icon: string; label: string; }

// Conseils bien-être & citations — un par jour
const DAILY_TIPS = [
  { emoji: "🌿", text: "Prenez 5 minutes pour respirer profondément. Inspirez par le nez, expirez par la bouche. Votre corps vous remerciera." },
  { emoji: "🚶", text: "Une petite marche de 15 minutes améliore l'humeur et la circulation. Même autour du pâté de maisons, ça compte !" },
  { emoji: "💧", text: "Pensez à boire régulièrement, même sans soif. Un verre d'eau toutes les heures, c'est l'idéal." },
  { emoji: "😊", text: "Sourire, même sans raison, envoie un signal positif au cerveau. Essayez, vous verrez !" },
  { emoji: "📞", text: "Appelez un proche aujourd'hui, même juste pour dire bonjour. Ça fait du bien des deux côtés." },
  { emoji: "🧘", text: "Étirez-vous doucement en vous levant. Bras en l'air, rotation des épaules... Votre journée commencera mieux." },
  { emoji: "🌞", text: "Si le soleil est là, profitez-en quelques minutes. La lumière naturelle booste le moral et la vitamine D." },
  { emoji: "📖", text: "Lire quelques pages par jour stimule la mémoire et l'imagination. Un bon moment rien qu'à vous." },
  { emoji: "🎵", text: "Mettez votre musique préférée. La musique réduit le stress et réveille de beaux souvenirs." },
  { emoji: "🥗", text: "Un fruit ou un légume de saison à chaque repas, c'est un geste simple pour votre santé." },
  { emoji: "😴", text: "Le sommeil est précieux. Essayez de vous coucher à heure régulière, votre corps a besoin de rythme." },
  { emoji: "🤝", text: "Rendre un petit service à quelqu'un, c'est bon pour le moral. Le vôtre comme le sien." },
  { emoji: "🧩", text: "Faites travailler votre esprit : mots croisés, sudoku, ou un petit quiz. Le cerveau aime qu'on le stimule !" },
  { emoji: "🌸", text: "Prenez le temps d'observer la nature autour de vous. Un arbre, un oiseau, le ciel... Ça apaise." },
  { emoji: "✍️", text: "Écrire quelques lignes sur sa journée aide à organiser ses pensées. Un petit journal, même court, fait du bien." },
  { emoji: "👨‍👩‍👧", text: "Les liens avec vos proches sont votre plus grande richesse. N'hésitez pas à leur dire que vous pensez à eux." },
  { emoji: "🎨", text: "La créativité n'a pas d'âge. Dessiner, bricoler, cuisiner... Laissez-vous surprendre par vos talents !" },
  { emoji: "🙏", text: "Prenez un instant pour penser à 3 choses positives de votre journée. La gratitude rend plus heureux." },
  { emoji: "🍵", text: "Accordez-vous une pause thé ou café, sans écran. Juste le plaisir du moment présent." },
  { emoji: "💪", text: "Chaque petit effort physique compte. Se lever, marcher, jardiner... Vous êtes plus fort que vous ne le pensez !" },
  { emoji: "🌈", text: "Après la pluie, le beau temps. Les journées difficiles passent, les bons moments restent." },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

// Weather icon/label maps
const WEATHER_ICONS: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};
const WEATHER_LABELS: Record<number, string> = {
  0: "Ensoleillé", 1: "Peu nuageux", 2: "Partiellement nuageux", 3: "Nuageux",
  45: "Brouillard", 48: "Brouillard givrant",
  51: "Bruine légère", 53: "Bruine", 55: "Bruine forte",
  61: "Pluie légère", 63: "Pluie", 65: "Forte pluie",
  71: "Neige légère", 73: "Neige", 75: "Forte neige",
  80: "Averses", 81: "Averses", 82: "Fortes averses",
  95: "Orage", 96: "Orage grêle", 99: "Orage fort",
};


interface QuickAction {
  label: string;
  icon: React.ReactNode;
}

const ALL_ACTIONS: QuickAction[] = [
  { label: "Mon agenda", icon: <CalendarDays className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Ma santé & bien-être", icon: <Heart className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Mes communications", icon: <MessageCircle className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Mon coffre-fort", icon: <Cloud className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Mes jeux & mémoire", icon: <Gamepad2 className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Mes avantages", icon: <Sparkles className="w-5 h-5 text-[#2DD4BF]" /> },
  { label: "Ma sécurité", icon: <ShieldAlert className="w-5 h-5 text-[#2DD4BF]" /> },
];


interface RecapPageProps {
  onGoToOscar?: () => void;
}

export function RecapPage({ onGoToOscar }: RecapPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streak, todayQuiz, streakJustIncreased, recordActivity } = useEngagement();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [weather, setWeather] = useState<Weather | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>(["Mon agenda", "Ma santé & bien-être", "Mes communications", "Mon coffre-fort"]);
  const [showPersonnaliser, setShowPersonnaliser] = useState(false);
  const [notifs, setNotifs] = useState<{id: string; icon: string; title: string; sub: string; info: string; color: string}[]>([]);
  const { filteredArticles, loading: articlesLoading, actuCat, setActuCat } = useRssArticles();

  // Rediriger vers l'onboarding si pas encore fait
  useEffect(() => {
    try {
      const onboarding = localStorage.getItem("oscar_onboarding");
      if (!onboarding || !JSON.parse(onboarding).completed) {
        navigate("/onboarding", { replace: true });
      }
    } catch {
      navigate("/onboarding", { replace: true });
    }
  }, []);

  // Enregistrer l'activité quotidienne au chargement
  useEffect(() => {
    if (user) recordActivity();
  }, [user]);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const data = await res.json();
        const code = data.current.weather_code;
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          icon: WEATHER_ICONS[code] || "🌡️",
          label: WEATHER_LABELS[code] || "Variable",
        });
      } catch {
        setWeather({ temp: 17, icon: "⛅", label: "Nuageux" });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(48.8566, 2.3522),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(48.8566, 2.3522);
    }
  }, []);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const getFirstName = () => profile.full_name ? profile.full_name.split(" ")[0] : "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const dateStr = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });


  const dismissNotif = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

  const toggleAction = (label: string) => {
    setSelectedActions(prev => {
      if (prev.includes(label)) return prev.filter(l => l !== label);
      if (prev.length >= 4) return prev;
      return [...prev, label];
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide oscar-page-bg" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* HEADER — iOS Large Title style */}
      <div
        className="flex-shrink-0 sticky top-0 z-10"
        style={{
          padding: "20px 20px 16px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: date + greeting */}
          <div className="flex flex-col flex-1 min-w-0" style={{ gap: 8 }}>
            <p className="capitalize text-muted-foreground" style={{ fontSize: 13, fontWeight: 500 }}>{dateStr}</p>
            <h1 className="text-foreground" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
              {greeting}{getFirstName() ? `, ${getFirstName()}` : ""} 👋
            </h1>
          </div>

          {/* Right: weather card (translucid teal) */}
          {weather && (
            <div
              style={{
                background: "rgba(45,212,191,0.15)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1.5px solid rgba(45,212,191,0.25)",
                borderRadius: 18,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
                boxShadow: "0 2px 12px rgba(45,212,191,0.12)",
                minWidth: 90,
              }}
            >
              {/* Emoji + temp on same row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{weather.icon}</span>
                <span style={{ fontSize: 20, fontWeight: 500, color: "#1e293b", lineHeight: 1 }}
                  className="dark:text-foreground">
                  {weather.temp}°
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 4, textAlign: "center", maxWidth: 80 }}>
                {weather.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* OSCAR WIDGET */}
      <div style={{ padding: "0 16px", marginTop: 16 }}>
        <button
          onClick={onGoToOscar}
          className="w-full text-left"
          style={{
            background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)",
            borderRadius: 22,
            padding: "18px 20px",
            boxShadow: "0 8px 28px rgba(45,212,191,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: "none",
            cursor: "pointer",
            transition: "transform 0.18s",
          }}
        >
          <OscarAvatar size="sm" className="w-9 h-9 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>Oscar</span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.18)", borderRadius: 99, padding: "2px 8px", fontWeight: 500 }}>En ligne</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Posez-moi vos questions, je suis là pour vous aider !</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>
      </div>

      {/* ENGAGEMENT — Streak + Quiz */}
      <div style={{ padding: "16px 16px 0" }}>
        {/* Streak compact + Quiz CTA côte à côte */}
        <div className="flex gap-3">
          {/* Streak Widget — compact */}
          <div
            style={{
              background: streakJustIncreased
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                : streak.current_streak > 0
                ? "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)"
                : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
              borderRadius: 18,
              padding: "14px 16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.5s ease",
              minWidth: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {streakJustIncreased && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            )}
            <Flame className="w-5 h-5 text-white" style={{ marginBottom: 4 }} />
            <p style={{ fontSize: 28, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
              {streak.current_streak}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2, textAlign: "center" }}>
              {streak.current_streak <= 1 ? "jour" : "jours"}
            </p>
          </div>

          {/* Daily Quiz CTA */}
          <button
            onClick={() => navigate("/daily-quiz")}
            className={`flex-1 text-left ${todayQuiz ? "bg-card" : ""}`}
            style={{
              background: todayQuiz
                ? undefined
                : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              border: todayQuiz ? "1.5px solid hsl(var(--border))" : "none",
              borderRadius: 18,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "transform 0.18s",
              boxShadow: todayQuiz ? "none" : "0 4px 16px rgba(124,58,237,0.2)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: todayQuiz ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {todayQuiz ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={todayQuiz ? "text-foreground" : ""} style={{ fontSize: 14, fontWeight: 500, color: todayQuiz ? undefined : "#fff" }}>
                {todayQuiz ? "Quiz fait !" : "Quiz du jour"}
              </p>
              <p className={todayQuiz ? "text-muted-foreground" : ""} style={{ fontSize: 11.5, color: todayQuiz ? undefined : "rgba(255,255,255,0.8)" }}>
                {todayQuiz
                  ? `${todayQuiz.score}/${todayQuiz.total_questions} bonnes réponses`
                  : "5 questions rapides"
                }
              </p>
            </div>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: todayQuiz ? "#94a3b8" : "rgba(255,255,255,0.7)" }}
            />
          </button>
        </div>
      </div>

      {/* CONSEIL DU JOUR */}
      {(() => {
        const tip = getDailyTip();
        return (
          <div style={{ padding: "16px 16px 0" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #fef9e7 0%, #fdf2e9 100%)",
                border: "1.5px solid #fdebd0",
                borderRadius: 18,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{tip.emoji}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#e67e22", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  Conseil du jour
                </p>
                <p className="text-foreground/80" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                  {tip.text}
                </p>
              </div>
            </div>
          </div>
        );
      })()}


      {/* À SAVOIR */}
      <div style={{ padding: "24px 16px 0" }}>
        <SectionHeader title="À savoir" />
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ marginBottom: 12 }}>
          {ACTU_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActuCat(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                background: actuCat === cat ? "#2DD4BF" : "#f1f5f9",
                color: actuCat === cat ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Articles */}
        {articlesLoading ? (
          <div className="flex items-center justify-center" style={{ padding: "28px 16px" }}>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Chargement des articles...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {filteredArticles.map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-card border border-border block no-underline"
                style={{
                  width: 230,
                  borderRadius: 16,
                  padding: "16px 16px 14px",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 500,
                      color: "#2DD4BF",
                      background: "rgba(45,212,191,0.08)",
                      borderRadius: 99,
                      padding: "2px 8px",
                    }}
                  >
                    {a.category}
                  </span>
                </div>
                <p className="text-foreground" style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
                {a.description && (
                  <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.35, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: "#b0b8c4" }}>{a.source}</span>
                  <span style={{ fontSize: 12, color: "#b0b8c4" }}>{timeAgo(a.pubDate)}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center bg-card border border-border"
            style={{
              borderRadius: 18,
              padding: "28px 16px",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>📰</span>
            <p className="text-muted-foreground" style={{ fontSize: 13.5 }}>Aucun article dans cette catégorie</p>
          </div>
        )}
        {/* Lien "Voir tout" en bas à droite */}
        <div className="flex justify-end" style={{ marginTop: 8 }}>
          <button
            onClick={() => navigate("/services/knowledge")}
            className="text-primary"
            style={{ fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
          >
            Voir tout →
          </button>
        </div>
      </div>

      {/* MES RAPPELS */}
      <div style={{ padding: "24px 16px 0" }}>
        <SectionHeader title="Mes rappels" />
        <div
          className="flex flex-col items-center justify-center bg-card border border-border"
          style={{
            borderRadius: 18,
            padding: "28px 16px",
          }}
        >
          <span style={{ fontSize: 32, marginBottom: 8 }}>✅</span>
          <p style={{ fontSize: 13.5, color: "#94a3b8" }}>Aucun rappel pour le moment</p>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div style={{ padding: "24px 16px 0" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <SectionHeader title="Actions rapides" noMargin />
          <button
            onClick={() => setShowPersonnaliser(true)}
            style={{
              fontSize: 12,
              color: "#2DD4BF",
              fontWeight: 600,
              background: "rgba(45,212,191,0.1)",
              border: "1.5px solid rgba(45,212,191,0.3)",
              borderRadius: 99,
              padding: "5px 14px",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              letterSpacing: 0.1,
            }}
          >
            Personnaliser
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {selectedActions.slice(0, 4).map(label => {
            const action = ALL_ACTIONS.find(a => a.label === label);
            if (!action) return null;
            return (
              <button
                key={label}
                onClick={() => {
                  const pathMap: Record<string, string> = {
                    "Mon agenda": "/services/agenda",
                    "Ma santé & bien-être": "/services/health",
                    "Mes communications": "/services/communication",
                    "Mon coffre-fort": "/services/storage",
                    "Mes jeux & mémoire": "/services/games",
                    "Mes avantages": "/services/partners",
                    "Ma sécurité": "/services/scam-protection",
                  };
                  navigate(pathMap[label] || "/services/agenda");
                }}
                className="flex items-center gap-3 text-left"
                style={{
                  borderRadius: 14,
                  padding: "13px 14px",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  background: "white",
                  border: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(45,212,191,0.08)",
                  }}
                >
                  {action.icon}
                </div>
                <span className="text-foreground" style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div style={{ padding: "24px 16px 32px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <SectionHeader title="Notifications" noMargin />
          <button
            onClick={() => setNotifs([])}
            style={{
              fontSize: 12,
              color: "#ef4444",
              fontWeight: 600,
              background: "rgba(239,68,68,0.08)",
              border: "1.5px solid rgba(239,68,68,0.25)",
              borderRadius: 99,
              padding: "5px 14px",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              letterSpacing: 0.1,
            }}
          >
            Tout effacer
          </button>
        </div>
        {notifs.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {notifs.map(n => (
              <div
                key={n.id}
                className="flex items-center gap-3 bg-card border border-border"
                style={{
                  borderRadius: 16,
                  padding: "12px 14px",
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `${n.color}12`,
                    fontSize: 20,
                  }}
                >
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontSize: 13.5, fontWeight: 500 }}>{n.title}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 1 }}>{n.sub}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: n.color,
                      background: `${n.color}12`,
                      borderRadius: 99,
                      padding: "2px 8px",
                    }}
                  >
                    {n.info}
                  </span>
                  <button
                    onClick={() => dismissNotif(n.id)}
                    className="flex items-center justify-center bg-secondary"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center bg-card border border-border"
            style={{
              borderRadius: 18,
              padding: "28px 16px",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>🔔</span>
            <p className="text-muted-foreground" style={{ fontSize: 13.5 }}>Aucune notification</p>
          </div>
        )}
      </div>

      {/* PERSONNALISER MODAL */}
      {showPersonnaliser && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(15,118,110,0.15)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={() => setShowPersonnaliser(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "white",
              borderRadius: "28px 28px 0 0",
              border: "1px solid rgba(45,212,191,0.15)",
              padding: "12px 20px 32px",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            {/* Handle bar — Apple sheet style */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#E2E8F0" }} />
            </div>
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 500 }}>Personnaliser</h3>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{selectedActions.length}/4</span>
            </div>
            <div className="flex flex-col gap-2">
              {ALL_ACTIONS.map(action => {
                const isSelected = selectedActions.includes(action.label);
                return (
                  <button
                    key={action.label}
                    onClick={() => toggleAction(action.label)}
                    className={`flex items-center gap-3 w-full text-left ${isSelected ? "bg-primary/5" : "bg-card"}`}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: `1.5px solid ${isSelected ? "rgba(45,212,191,0.3)" : "hsl(var(--border))"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(45,212,191,0.08)",
                      }}
                    >
                      {action.icon}
                    </div>
                    <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500 }}>{action.label}</span>
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isSelected ? "#2DD4BF" : "#e2e8f0",
                        transition: "all 0.15s",
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowPersonnaliser(false)}
              className="w-full"
              style={{
                marginTop: 20,
                padding: "14px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Section header — Apple iOS style ---
function SectionHeader({ title, noMargin, linkLabel, linkPath }: { title: string; noMargin?: boolean; linkLabel?: string; linkPath?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: noMargin ? 0 : 10, paddingLeft: 4 }}>
      <p style={{
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        color: "#94A3B8",
        margin: 0,
      }}>
        {title}
      </p>
      {linkLabel && linkPath && (
        <button
          onClick={() => navigate(linkPath)}
          style={{ fontSize: 12, fontWeight: 500, color: "#2DD4BF", background: "none", border: "none", cursor: "pointer" }}
        >
          {linkLabel} →
        </button>
      )}
    </div>
  );
}
