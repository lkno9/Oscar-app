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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OscarAvatar } from "@/components/OscarAvatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface Weather { temp: number; icon: string; label: string; }

interface RssArticle {
  title: string;
  link: string;
  pubDate: string;
  category: string;
  source: string;
  emoji: string;
}

const ACTU_CATEGORIES = ["Tout", "Droits", "Santé", "Loisirs", "Sécurité", "Actualité"];

const RSS_SOURCES = [
  { url: "https://www.service-public.fr/rss/actualites", category: "Droits", source: "Service-Public.fr", emoji: "📋" },
  { url: "https://www.notretemps.com/rss", category: "Santé", source: "Notre Temps", emoji: "🏥" },
  { url: "https://www.silvereco.fr/feed", category: "Loisirs", source: "Silver Économie", emoji: "🎭" },
  { url: "https://www.francetvinfo.fr/titres.rss", category: "Actualité", source: "France Info", emoji: "📰" },
  { url: "https://www.60millions-mag.com/rss", category: "Sécurité", source: "60 Millions", emoji: "🛡️" },
];

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
  { label: "Mon agenda", icon: <CalendarDays className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Ma santé & bien-être", icon: <Heart className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes communications", icon: <MessageCircle className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mon coffre-fort", icon: <Cloud className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes jeux & mémoire", icon: <Gamepad2 className="w-5 h-5 text-[#48A29E]" /> },
  { label: "Mes avantages", icon: <Sparkles className="w-5 h-5 text-[#48A29E]" /> },
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
  const [selectedActions, setSelectedActions] = useState<string[]>(["Mon agenda", "Ma santé & bien-être", "Mes communications", "Mon coffre-fort"]);
  const [showPersonnaliser, setShowPersonnaliser] = useState(false);
  const [notifs, setNotifs] = useState<{id: string; icon: string; title: string; sub: string; info: string; color: string}[]>([]);
  const [actuCat, setActuCat] = useState("Tout");
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Fetch RSS articles
  useEffect(() => {
    const fetchRss = async () => {
      setArticlesLoading(true);
      const allArticles: RssArticle[] = [];
      for (const src of RSS_SOURCES) {
        try {
          const res = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}&count=5`
          );
          if (!res.ok) continue;
          const data = await res.json();
          if (data.status !== "ok" || !data.items) continue;
          for (const item of data.items.slice(0, 3)) {
            allArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              category: src.category,
              source: src.source,
              emoji: src.emoji,
            });
          }
        } catch {
          // skip failed feeds silently
        }
      }
      setArticles(allArticles);
      setArticlesLoading(false);
    };
    fetchRss();
  }, []);

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

  const filteredArticles = actuCat === "Tout" ? articles : articles.filter(a => a.category === actuCat);

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `Il y a ${mins}min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `Il y a ${hrs}h`;
      const days = Math.floor(hrs / 24);
      if (days === 1) return "Hier";
      return `Il y a ${days}j`;
    } catch { return ""; }
  };

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
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{weather.temp}°C</span>
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
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>Posez-moi vos questions, je suis là pour vous aider !</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>
      </div>


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
                className="flex-shrink-0"
                style={{
                  minWidth: 220,
                  background: "#fff",
                  border: "1.5px solid #eef2f7",
                  borderRadius: 18,
                  padding: "16px 14px 14px",
                  textDecoration: "none",
                  display: "block",
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
                    {a.category}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1e293b", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{a.source}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(a.pubDate)}</span>
                </div>
              </a>
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
            <span style={{ fontSize: 32, marginBottom: 8 }}>📰</span>
            <p style={{ fontSize: 13.5, color: "#94a3b8" }}>Aucun article dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* MES RAPPELS */}
      <div style={{ padding: "24px 16px 0" }}>
        <SectionHeader title="Mes rappels" />
        <div
          className="flex flex-col items-center justify-center"
          style={{
            background: "#fff",
            border: "1.5px solid #eef2f7",
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
                    "Mon agenda": "/services/agenda",
                    "Ma santé & bien-être": "/services/health",
                    "Mes communications": "/services/communication",
                    "Mon coffre-fort": "/services/storage",
                    "Mes jeux & mémoire": "/services/games",
                    "Mes avantages": "/services/partners",
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
            <span style={{ fontSize: 32, marginBottom: 8 }}>🔔</span>
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
