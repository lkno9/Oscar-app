import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Cloud,
  Image,
  Music,
  Gamepad2,
  Sparkles,
  ShieldAlert,
  FileText,
  Pill,
  MessageCircle,
} from "lucide-react";
import { ServiceTile } from "@/components/ServiceTile";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-foreground mb-4">{children}</h2>
  );
}

function SecondaryTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full bg-card rounded-xl px-4 py-4 border border-border hover:border-primary/40 hover:bg-accent/30 transition-all duration-200 text-left min-h-[56px]"
    >
      <span className="text-primary flex-shrink-0">{icon}</span>
      <span className="text-base font-semibold text-foreground leading-tight">{label}</span>
    </button>
  );
}

export function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      <header className="px-4 py-5 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre quotidien</p>
      </header>

      <div className="flex-1 p-4 pb-8 space-y-8">
        {/* PRIMARY SECTION */}
        <section>
          <SectionTitle>Mes Services</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ServiceTile
              icon={<CalendarDays className="w-8 h-8" />}
              label="Agenda & rendez-vous"
              onClick={() => navigate("/services/agenda")}
            />
            <ServiceTile
              icon={<Cloud className="w-8 h-8" />}
              label="Stockage & fichiers"
              onClick={() => navigate("/services/storage")}
            />
            <ServiceTile
              icon={<Image className="w-8 h-8" />}
              label="Photos & souvenirs"
              onClick={() => navigate("/services/photos")}
            />
            <ServiceTile
              icon={<MessageCircle className="w-8 h-8" />}
              label="Communication"
              onClick={() => navigate("/services/communication")}
            />
            <ServiceTile
              icon={<Music className="w-8 h-8" />}
              label="Musique & radio"
              onClick={() => navigate("/services/music")}
            />
            <ServiceTile
              icon={<Gamepad2 className="w-8 h-8" />}
              label="Jeux & mémoire"
              onClick={() => navigate("/services/games")}
            />
            <ServiceTile
              icon={<Sparkles className="w-8 h-8" />}
              label="Bons plans seniors"
              onClick={() => navigate("/services/partners")}
            />
            <ServiceTile
              icon={<ShieldAlert className="w-8 h-8" />}
              label="Protection Arnaques"
              onClick={() => navigate("/services/scam-protection")}
            />
          </div>
        </section>

        {/* SECONDARY SECTION */}
        <section>
          <SectionTitle>Aller plus loin</SectionTitle>
          <div className="flex flex-col gap-2">
            <SecondaryTile
              icon={<FileText className="w-6 h-6" />}
              label="Documents & démarches"
              onClick={() => navigate("/services/documents")}
            />
            <SecondaryTile
              icon={<Pill className="w-6 h-6" />}
              label="Santé & médicaments"
              onClick={() => navigate("/services/health")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

