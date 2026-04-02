import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Cloud,
  Image,
  Ticket,
  Gamepad2,
  Sparkles,
  ShieldAlert,
  MessageCircle,
  Heart,
  Phone,
  GraduationCap,
  HelpCircle,
  Settings,
  ChevronRight,
  Navigation,
  Wrench,
  Newspaper,
} from "lucide-react";
import { ServiceTile } from "@/components/ServiceTile";

const PRIMARY_SERVICES = [
  { icon: <CalendarDays className="w-6 h-6" />, label: "Mon agenda", sublabel: "Rendez-vous, rappels", path: "/services/agenda" },
  { icon: <Heart className="w-6 h-6" />, label: "Ma santé", sublabel: "Médicaments, médecin", path: "/services/health" },
  { icon: <Image className="w-6 h-6" />, label: "Photos & souvenirs", sublabel: "Souvenirs, famille", path: "/services/photos" },
  { icon: <MessageCircle className="w-6 h-6" />, label: "Appeler ou écrire", sublabel: "Messages, appels", path: "/services/communication" },
  { icon: <Navigation className="w-6 h-6" />, label: "Me déplacer", sublabel: "Bus, train, itinéraire", path: "/services/transport" },
  { icon: <Ticket className="w-6 h-6" />, label: "Sorties & loisirs", sublabel: "Idées de sorties", path: "/services/entertainment" },
  { icon: <Wrench className="w-6 h-6" />, label: "Outils pratiques", sublabel: "Météo, minuteur, calcul", path: "/services/tools" },
  { icon: <Cloud className="w-6 h-6" />, label: "Mes documents", sublabel: "Courriers, ordonnances", path: "/services/storage" },
  { icon: <Gamepad2 className="w-6 h-6" />, label: "Jeux & mémoire", sublabel: "Mémoire, quiz, sudoku", path: "/services/games" },
  { icon: <ShieldAlert className="w-6 h-6" />, label: "Ma sécurité", sublabel: "Arnaques, alertes", path: "/services/scam-protection" },
  { icon: <Newspaper className="w-6 h-6" />, label: "Actualités & infos", sublabel: "L'info du jour", path: "/services/knowledge" },
];

const SUPPORT_ITEMS = [
  { icon: <Phone className="w-5 h-5" />, label: "SOS / Urgence", sublabel: "Appeler les secours ou ma famille", path: "/services/emergency", accent: true },
  { icon: <GraduationCap className="w-5 h-5" />, label: "Oscar Academy", sublabel: "Apprendre à utiliser Oscar", path: "/services/oscar-academy", accent: false },
  { icon: <HelpCircle className="w-5 h-5" />, label: "Aide & FAQ", sublabel: "Questions fréquentes, contacter le support", path: "/services/help", accent: false },
  { icon: <Settings className="w-5 h-5" />, label: "Réglages", sublabel: "Compte, préférences, notifications", path: "/settings", accent: false },
];

export function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide oscar-page-bg">
      {/* Header — iOS Large Title */}
      <div
        className="flex-shrink-0 sticky top-0 z-10"
        style={{
          padding: "20px 20px 14px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: 500, color: "#1A1A2E", letterSpacing: "-0.7px" }}>
          Menu
        </h1>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2, fontWeight: 500 }}>
          Accédez à tous vos services
        </p>
      </div>

      <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Section divider */}
        <div className="flex items-center gap-3">
          <div style={{ flex: 1, height: 1, background: "rgba(45,212,191,0.2)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Mon quotidien
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(45,212,191,0.2)" }} />
        </div>

        {/* Primary grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {PRIMARY_SERVICES.map((s) => (
            <ServiceTile
              key={s.label}
              icon={s.icon}
              label={s.label}
              sublabel={s.sublabel}
              onClick={() => navigate(s.path)}
            />
          ))}
        </div>

        {/* Aide & Support */}
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(45,212,191,0.2)" }} />
            <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              Aide & Support
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(45,212,191,0.2)" }} />
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid rgba(45,212,191,0.12)",
              boxShadow: "0 4px 20px rgba(45,212,191,0.08)",
              overflow: "hidden",
            }}
          >
            {SUPPORT_ITEMS.map((item, i) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center text-left"
                style={{
                  gap: 14,
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: i < SUPPORT_ITEMS.length - 1 ? "1px solid rgba(45,212,191,0.1)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,212,191,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: item.accent ? "rgba(239,68,68,0.1)" : "rgba(45,212,191,0.1)",
                    color: item.accent ? "#ef4444" : "#2DD4BF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 500, color: item.accent ? "#ef4444" : "#1A1A2E" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 13, color: "#64748B", marginTop: 1, fontWeight: 500 }}>
                    {item.sublabel}
                  </p>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: "#94A3B8", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
