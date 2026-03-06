import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Pill,
  ChevronRight,
  FileText,
  Bell,
  X,
  Check,
  Heart,
  Lock,
  Settings as SettingsIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OscarAvatar } from "@/components/OscarAvatar";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface MoodEntry { mood_level: number; }
interface UnreadMessage { id: string; content: string; created_at: string; sender_id: string; }
interface SenderProfile { id: string; full_name: string | null; }
interface CalendarEvent { id: string; title: string; event_date: string; event_time: string | null; event_type: string | null; }
interface Medication { id: string; name: string; dosage: string | null; }
interface UrgentDocument { id: string; name: string; expiration_date: string; }
interface Reminder { id: string; label: string; date: string; type: "medication" | "document"; }
interface AppNotification { id: string; title: string; message: string | null; type: string; created_at: string; is_read: boolean | null; }

interface Weather { temp: number; icon: string; label: string; }

// Weather icon/label maps
const WEATHER_ICONS: Record<number, string> = {
  0: "\u2600\ufe0f", 1: "\ud83c\udf24\ufe0f", 2: "\u26c5", 3: "\u2601\ufe0f",
  45: "\ud83c\udf2b\ufe0f", 48: "\ud83c\udf2b\ufe0f",
  51: "\ud83c\udf26\ufe0f", 53: "\ud83c\udf26\ufe0f", 55: "\ud83c\udf27\ufe0f",
  61: "\ud83c\udf27\ufe0f", 63: "\ud83c\udf27\ufe0f", 65: "\ud83c\udf27\ufe0f",
  71: "\ud83c\udf28\ufe0f", 73: "\ud83c\udf28\ufe0f", 75: "\ud83c\udf28\ufe0f",
  80: "\ud83c\udf26\ufe0f", 81: "\ud83c\udf27\ufe0f", 82: "\ud83c\udf27\ufe0f",
  95: "\u26c8\ufe0f", 96: "\u26c8\ufe0f", 99: "\u26c8\ufe0f",
};
const WEATHER_LABELS: Record<number, string> = {
  0: "Ensoleill\u00e9", 1: "Peu nuageux", 2: "Partiellement nuageux", 3: "Nuageux",
  45: "Brouillard", 48: "Brouillard givrant",
  51: "Bruine l\u00e9g\u00e8re", 53: "Bruine", 55: "Bruine forte",
  61: "Pluie l\u00e9g\u00e8re", 63: "Pluie", 65: "Forte pluie",
  71: "Neige l\u00e9g\u00e8re", 73: "Neige", 75: "Forte neige",
  80: "Averses", 81: "Averses", 82: "Fortes averses",
  95: "Orage", 96: "Orage gr\u00eale", 99: "Orage fort",
};

const ACTU_CATEGORIES = ["Tout", "Droits", "Senior", "S\u00e9curit\u00e9", "Activit\u00e9"];

const ARTICLES = [
  { emoji: "\ud83d\udcb0", cat: "Droits", title: "Revalorisation des petites retraites en 2025", src: "Service-Public.fr", date: "Il y a 2h" },
  { emoji: "\ud83c\udfe5", cat: "Senior", title: "T\u00e9l\u00e9consultation : comment \u00e7a marche pour les seniors", src: "Ameli.fr", date: "Il y a 5h" },
  { emoji: "\ud83d\udee1\ufe0f", cat: "S\u00e9curit\u00e9", title: "Attention aux faux conseillers bancaires", src: "Signal-Arnaques", date: "Hier" },
  { emoji: "\ud83c\udfad", cat: "Activit\u00e9", title: "Ateliers gratuits dans votre ville", src: "Mairie", date: "Hier" },
  { emoji: "\ud83d\udcdd", cat: "Droits", title: "Nouveau ch\u00e8que \u00e9nergie : \u00eates-vous \u00e9ligible ?", src: "Gouv.fr", date: "Il y a 3j" },
  { emoji: "\ud83e\uddd1\u200d\u2695\ufe0f", cat: "Senior", title: "Les bienfaits de la marche apr\u00e8s 60 ans", src: "Sant\u00e9 Magazine", date: "Il y a 3j" },
];

const RAPPEL_STATUSES = ["Tout", "\u00c0 faire", "En cours", "En attente"];

const RAPPELS_DATA = [
  { icon: "\ud83d\udcbc", label: "Renouveler la carte vitale", sub: "Expire le 15 avril", status: "\u00c0 faire", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  { icon: "\ud83d\udce6", label: "Colis en attente", sub: "Point relais Carrefour", status: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { icon: "\ud83d\udcde", label: "Rappeler le Dr. Martin", sub: "Prise de rendez-vous", status: "En cours", color: "#48A29E", bg: "rgba(72,162,158,0.08)" },
  { icon: "\ud83d\udcc4", label: "Formulaire APL \u00e0 remplir", sub: "Date limite : 20 mars", status: "\u00c0 faire", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
];

interface QuickAction {
  label: string;
  icon: React.ReactNode;
}

const ALL_ACTIONS: QuickAction[] = [
  { label: "Mon calendrier", icon: <CalendarDays className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes papiers", icon: <FileText className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Ma sant\u00e9", icon: <Heart className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes rappels", icon: <Bell className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mon coffre-fort", icon: <Lock className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes m\u00e9dicaments", icon: <Pill className="w-5 h-5 text-[#48A29E]" /> },
];

const DEFAULT_NOTIFS = [
  { id: "n1", icon: "\ud83d\udcde", title: "Appel manqu\u00e9", sub: "Dr. Martin a essay\u00e9 de vous joindre", info: "Il y a 2h", color: "#48A29E" },
  { id: "n2", icon: "\ud83d\udcb3", title: "Carte vitale", sub: "Votre carte expire bient\u00f4t", info: "Renouveler", color: "#ef4444" },
  { id: "n3", icon: "\ud83d\udcac", title: "Message non lu", sub: "Sophie vous a envoy\u00e9 un message", info: "Famille", color: "#6366f1" },
  { id: "n4", icon: "\ud83d\udc8a", title: "M\u00e9dicaments", sub: "N'oubliez pas votre traitement du soir", info: "Sant\u00e9", color: "#f59e0b" },
];

interface RecapPageProps {
  onGoToOscar?: () => void;
}

export function RecapPage({ onGoToOscar }: RecapPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [weather, setWeather] = useState<Weather | null>(null);
  const [actuCat, setActuCat] = useState("Tout");
  const [rappelCat, setRappelCat] = useState("Tout");
  const [selectedActions, setSelectedActions] = useState<string[]>(["Mon calendrier", "Mes papiers", "Ma sant\u00e9", "Mes rappels"]);
  const [showPersonnaliser, setShowPersonnaliser] = useState(false);
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const data = await res.json();
        const code = data.current.weather_code;
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          icon: WEATHER_ICONS[code] || "\ud83c\udf21\ufe0f",
          label: WEATHER_LABELS[code] || "Variable",
        });
      } catch {
        setWeather({ temp: 17, icon: "\u26c5", label: "Nuageux" });
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

  const getFirstName = () => profile.full_name ? profile.full_name.split(" ")[0] : "Jean";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apr\u00e8s-midi" : "Bonsoir";
  const dateStr = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const filteredArticles = actuCat === "Tout" ? ARTICLES : ARTICLES.filter(a => a.cat === actuCat);
  const filteredRappels = rappelCat === "Tout" ? RAPPELS_DATA : RAPPELS_DATA.filter(r => r.status === rappelCat);

  const dismissNotif = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

  const toggleAction = (label: string) => {
    setSelectedActions(prev => {
      if (prev.includes(label)) return prev.filter(l => l !== label);
      if (prev.length >= 4) return prev;
      return [...prev, label];
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide" style={{ background: "#f8fafc", fontFamily: "'Inter', 'Nunito', sans-serif" }}>

      {/* HEADER */}
      <div className="flex-shrink-0 bg-white dark:bg-card" style={{ padding: "22px 20px 18px" }}>
        <p className="capitalize" style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>{dateStr}</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.5px", marginBottom: 16 }}>
          {greeting}, {getFirstName()}
        </h1>

        {/* Weather widget */}
        {weather && (
          <div
            className="flex items-center gap-3"
            style={{
              background: "rgba(72,162,158,0.12)",
              borderRadius: 18,
              padding: "12px 16px",
            }}
          >
            <span style={{ fontSize: 28 }}>{weather.icon}</span>
            <div>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{weather.temp}\u00b0C</span>
              <span style={{ fontSize: 13.5, color: "#64748b", marginLeft: 8 }}>{weather.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* OSCAR WIDGET */}
      <div style={{ padding: "0 16px", marginTop: 16 }}>
        <button
          onClick={onGoToOscar}
          className="w-full text-left"
          style={{
            background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
            borderRadius: 22,
            padding: "18px 20px",
            boxShadow: "0 8px 28px rgba(72,162,158,0.25)",
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
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Oscar</span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.18)", borderRadius: 99, padding: "2px 8px", fontWeight: 500 }}>En ligne</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Posez-moi vos questions, je suis l\u00e0 pour vous aider !</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>
      </div>

      {/* \u00c0 SAVOIR - Articles */}
      <div style={{ padding: "24px 16px 0" }}>
        <SectionHeader title="\u00c0 savoir" />
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ marginBottom: 12 }}>
          {ACTU_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActuCat(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                background: actuCat === cat ? "#48A29E" : "#f1f5f9",
                color: actuCat === cat ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Horizontal scroll articles */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filteredArticles.map((a, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{
                minWidth: 220,
                background: "#fff",
                border: "1.5px solid #eef2f7",
                borderRadius: 18,
                padding: "16px 14px 14px",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#48A29E",
                    background: "rgba(72,162,158,0.08)",
                    borderRadius: 99,
                    padding: "2px 8px",
                  }}
                >
                  {a.cat}
                </span>
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1e293b", lineHeight: 1.4, marginBottom: 8 }}>{a.title}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{a.src}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{a.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MES RAPPELS */}
      <div style={{ padding: "24px 16px 0" }}>
        <SectionHeader title="Mes rappels" />
        {/* Status pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ marginBottom: 12 }}>
          {RAPPEL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setRappelCat(s)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                background: rappelCat === s ? "#48A29E" : "#f1f5f9",
                color: rappelCat === s ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {/* Rappels list */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #eef2f7",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {filteredRappels.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{
                padding: "14px 16px",
                borderBottom: i < filteredRappels.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: r.bg,
                  fontSize: 20,
                }}
              >
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1e293b" }}>{r.label}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{r.sub}</p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: r.color,
                  background: r.bg,
                  borderRadius: 99,
                  padding: "3px 10px",
                  flexShrink: 0,
                }}
              >
                {r.status}
              </span>
            </div>
          ))}
          {filteredRappels.length === 0 && (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucun rappel dans cette cat\u00e9gorie</p>
            </div>
          )}
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
              color: "#48A29E",
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
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
                    "Mon calendrier": "/services/agenda",
                    "Mes papiers": "/services/documents",
                    "Ma sant\u00e9": "/services/health",
                    "Mes rappels": "/services/agenda",
                    "Mon coffre-fort": "/services/vault",
                    "Mes m\u00e9dicaments": "/services/health",
                  };
                  navigate(pathMap[label] || "/services/agenda");
                }}
                className="flex items-center gap-3 text-left"
                style={{
                  background: "#fff",
                  border: "1.5px solid #eef2f7",
                  borderRadius: 16,
                  padding: "14px 14px",
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(72,162,158,0.08)",
                  }}
                >
                  {action.icon}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "#334155" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div style={{ padding: "24px 16px 32px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <SectionHeader title="Notifications" noMargin />
          {notifs.length > 0 && (
            <button
              onClick={() => setNotifs([])}
              style={{
                fontSize: 12,
                color: "#ef4444",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Tout effacer
            </button>
          )}
        </div>
        {notifs.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {notifs.map(n => (
              <div
                key={n.id}
                className="flex items-center gap-3"
                style={{
                  background: "#fff",
                  border: "1.5px solid #eef2f7",
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
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1e293b" }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{n.sub}</p>
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
                    className="flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#f1f5f9",
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
            className="flex flex-col items-center justify-center"
            style={{
              background: "#fff",
              border: "1.5px solid #eef2f7",
              borderRadius: 18,
              padding: "28px 16px",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>{"\ud83d\udd14"}</span>
            <p style={{ fontSize: 13.5, color: "#94a3b8" }}>Aucune notification</p>
          </div>
        )}
      </div>

      {/* PERSONNALISER MODAL */}
      {showPersonnaliser && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowPersonnaliser(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 32px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Personnaliser</h3>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{selectedActions.length}/4</span>
            </div>
            <div className="flex flex-col gap-2">
              {ALL_ACTIONS.map(action => {
                const isSelected = selectedActions.includes(action.label);
                return (
                  <button
                    key={action.label}
                    onClick={() => toggleAction(action.label)}
                    className="flex items-center gap-3 w-full text-left"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: `1.5px solid ${isSelected ? "rgba(72,162,158,0.3)" : "#eef2f7"}`,
                      background: isSelected ? "rgba(72,162,158,0.04)" : "#fff",
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
                        background: "rgba(72,162,158,0.08)",
                      }}
                    >
                      {action.icon}
                    </div>
                    <span className="flex-1" style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{action.label}</span>
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isSelected ? "#48A29E" : "#e2e8f0",
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
                background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
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

// --- Section header ---
function SectionHeader({ title, noMargin }: { title: string; noMargin?: boolean }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: noMargin ? 0 : 14 }}>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}
