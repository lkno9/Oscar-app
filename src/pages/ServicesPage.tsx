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
} from "lucide-react";
import { ServiceTile } from "@/components/ServiceTile";

export function ServicesPage() {
  const navigate = useNavigate();

  const services = [
    {
      icon: <CalendarDays className="w-8 h-8" />,
      label: "Agenda & rendez-vous",
      path: "/services/agenda",
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      label: "Stockage & fichiers",
      path: "/services/storage",
    },
    {
      icon: <Image className="w-8 h-8" />,
      label: "Photos & souvenirs",
      path: "/services/photos",
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      label: "Communication",
      path: "/services/communication",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      label: "Santé & bien-être",
      path: "/services/health",
    },
    {
      icon: <Music className="w-8 h-8" />,
      label: "Musique & radio",
      path: "/services/music",
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      label: "Jeux & mémoire",
      path: "/services/games",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      label: "Bons plans seniors",
      path: "/services/partners",
    },
    {
      icon: <ShieldAlert className="w-8 h-8" />,
      label: "Protection Arnaques",
      path: "/services/scam-protection",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      <header className="px-4 py-5 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground">Mes Services</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre quotidien</p>
      </header>

      <div className="flex-1 p-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {services.map((s) => (
            <ServiceTile
              key={s.path}
              icon={s.icon}
              label={s.label}
              onClick={() => navigate(s.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
