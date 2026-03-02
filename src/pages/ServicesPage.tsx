import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Cloud,
  Image,
  Music,
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
} from "lucide-react";
import { ServiceTile } from "@/components/ServiceTile";

const PRIMARY_SERVICES = [
  { icon: <CalendarDays className="w-8 h-8" />, label: "Agenda & rendez-vous", path: "/services/agenda" },
  { icon: <Cloud className="w-8 h-8" />, label: "Stockage & fichiers", path: "/services/storage" },
  { icon: <Image className="w-8 h-8" />, label: "Photos & souvenirs", path: "/services/photos" },
  { icon: <MessageCircle className="w-8 h-8" />, label: "Communication", path: "/services/communication" },
  { icon: <Heart className="w-8 h-8" />, label: "Santé & bien-être", path: "/services/health" },
  { icon: <Music className="w-8 h-8" />, label: "Musique & radio", path: "/services/music" },
  { icon: <Gamepad2 className="w-8 h-8" />, label: "Jeux & mémoire", path: "/services/games" },
  { icon: <Sparkles className="w-8 h-8" />, label: "Bons plans seniors", path: "/services/partners" },
  { icon: <ShieldAlert className="w-8 h-8" />, label: "Protection arnaques", path: "/services/scam-protection" },
];

const SUPPORT_ITEMS = [
  {
    icon: <Phone className="w-6 h-6" />,
    label: "SOS / Urgence",
    sublabel: "Appeler les secours ou ma famille",
    path: "/services/emergency",
    accent: true,
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    label: "Oscar Academy",
    sublabel: "Apprendre à utiliser Oscar",
    path: "/services/oscar-academy",
    accent: false,
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    label: "Aide & FAQ",
    sublabel: "Questions fréquentes, contacter le support",
    path: "/services/help",
    accent: false,
  },
  {
    icon: <Settings className="w-6 h-6" />,
    label: "Réglages",
    sublabel: "Compte, préférences, notifications",
    path: "/settings",
    accent: false,
  },
];

export function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      <header className="px-4 py-5 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground">Mes Services</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre quotidien</p>
      </header>

      <div className="flex-1 p-4 pb-8 space-y-6">
        {/* Primary grid */}
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_SERVICES.map((s) => (
            <ServiceTile
              key={s.path}
              icon={s.icon}
              label={s.label}
              onClick={() => navigate(s.path)}
            />
          ))}
        </div>

        {/* Help & Support section */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Aide & Support</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="bg-muted/40 rounded-2xl border border-border overflow-hidden">
            {SUPPORT_ITEMS.map((item, i) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-secondary/60 transition-colors ${
                  i < SUPPORT_ITEMS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.accent
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base ${item.accent ? "text-destructive" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{item.sublabel}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
