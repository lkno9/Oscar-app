import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Bell,
  Smile,
  Gamepad2,
  Heart,
  FileText,
  Lock,
  Gift,
  MessageCircle,
  Image,
  Phone,
  Shield,
  GraduationCap,
  HelpCircle,
  Settings,
  ChevronRight,
} from "lucide-react";
import { ServiceTile } from "@/components/ServiceTile";

const PRIMARY_SERVICES = [
  { icon: <CalendarDays className="w-8 h-8" />, label: "Mon calendrier", path: "/services/agenda" },
  { icon: <Bell className="w-8 h-8" />, label: "Mes rappels", path: "/services/agenda" },
  { icon: <Smile className="w-8 h-8" />, label: "Mon bien-être", path: "/services/wellness" },
  { icon: <Gamepad2 className="w-8 h-8" />, label: "Mes loisirs & jeux", path: "/services/games" },
  { icon: <Heart className="w-8 h-8" />, label: "Ma santé", path: "/services/health" },
  { icon: <FileText className="w-8 h-8" />, label: "Mes papiers", path: "/services/documents" },
  { icon: <Lock className="w-8 h-8" />, label: "Mon coffre-fort", path: "/services/vault" },
  { icon: <Gift className="w-8 h-8" />, label: "Mes avantages", path: "/services/partners" },
  { icon: <MessageCircle className="w-8 h-8" />, label: "Mes communications", path: "/services/communication" },
  { icon: <Image className="w-8 h-8" />, label: "Mon album", path: "/services/photos" },
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
    icon: <Shield className="w-6 h-6" />,
    label: "Me protéger",
    sublabel: "Arnaques et sécurité",
    path: "/services/scam-protection",
    accent: false,
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
        <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Accédez à tous vos services</p>
      </header>

      <div className="flex-1 p-4 pb-8 space-y-6">
        {/* Section divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Mon quotidien</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Primary grid */}
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_SERVICES.map((s) => (
            <ServiceTile
              key={s.label}
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
