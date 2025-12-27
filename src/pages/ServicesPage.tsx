import {
  CalendarDays,
  FileText,
  CreditCard,
  Cloud,
  Users,
  Phone,
  Image,
  Pill,
  FileHeart,
  Heart,
  Music,
  BookOpen,
  Gamepad2,
  Lock,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { ServiceTile, ServiceSection } from "@/components/ServiceTile";
import { toast } from "sonner";

export function ServicesPage() {
  const handleTileClick = (service: string) => {
    toast.info(`${service} sera bientôt disponible !`, {
      description: "Cette fonctionnalité arrive prochainement.",
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <header className="px-4 py-6 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre quotidien en toute simplicité
        </p>
      </header>

      {/* Services Grid */}
      <div className="flex-1 p-4 space-y-6 pb-8">
        <ServiceSection title="Vie quotidienne" emoji="📁">
          <ServiceTile
            icon={<CalendarDays className="w-7 h-7" />}
            label="Agenda & rendez-vous"
            onClick={() => handleTileClick("Agenda & rendez-vous")}
          />
          <ServiceTile
            icon={<FileText className="w-7 h-7" />}
            label="Documents & démarches"
            onClick={() => handleTileClick("Documents & démarches")}
          />
          <ServiceTile
            icon={<CreditCard className="w-7 h-7" />}
            label="Paiements & factures"
            onClick={() => handleTileClick("Paiements & factures")}
          />
          <ServiceTile
            icon={<Cloud className="w-7 h-7" />}
            label="Stockage & fichiers"
            onClick={() => handleTileClick("Stockage & fichiers")}
          />
        </ServiceSection>

        <ServiceSection title="Communication" emoji="💬">
          <ServiceTile
            icon={<Users className="w-7 h-7" />}
            label="Famille & messages"
            onClick={() => handleTileClick("Famille & messages")}
          />
          <ServiceTile
            icon={<Phone className="w-7 h-7" />}
            label="Appels & visios"
            onClick={() => handleTileClick("Appels & visios")}
          />
          <ServiceTile
            icon={<Image className="w-7 h-7" />}
            label="Photos & souvenirs"
            onClick={() => handleTileClick("Photos & souvenirs")}
          />
        </ServiceSection>

        <ServiceSection title="Santé & bien-être" emoji="🩺">
          <ServiceTile
            icon={<Pill className="w-7 h-7" />}
            label="Santé & médicaments"
            onClick={() => handleTileClick("Santé & médicaments")}
          />
          <ServiceTile
            icon={<FileHeart className="w-7 h-7" />}
            label="Ordonnances & remboursements"
            onClick={() => handleTileClick("Ordonnances & remboursements")}
          />
          <ServiceTile
            icon={<Heart className="w-7 h-7" />}
            label="Bien-être"
            onClick={() => handleTileClick("Bien-être")}
          />
        </ServiceSection>

        <ServiceSection title="Loisirs & culture" emoji="🎵">
          <ServiceTile
            icon={<Music className="w-7 h-7" />}
            label="Musique & radio"
            onClick={() => handleTileClick("Musique & radio")}
          />
          <ServiceTile
            icon={<BookOpen className="w-7 h-7" />}
            label="Bibliothèque & podcasts"
            onClick={() => handleTileClick("Bibliothèque & podcasts")}
          />
          <ServiceTile
            icon={<Gamepad2 className="w-7 h-7" />}
            label="Jeux & mémoire"
            onClick={() => handleTileClick("Jeux & mémoire")}
          />
        </ServiceSection>

        <ServiceSection title="Sécurité & assistance" emoji="🛡️">
          <ServiceTile
            icon={<Lock className="w-7 h-7" />}
            label="Coffre-fort numérique"
            onClick={() => handleTileClick("Coffre-fort numérique")}
          />
          <ServiceTile
            icon={<AlertTriangle className="w-7 h-7" />}
            label="Urgence / SOS"
            intent="danger"
            onClick={() => handleTileClick("Urgence / SOS")}
          />
          <ServiceTile
            icon={<HelpCircle className="w-7 h-7" />}
            label="Aide & support"
            onClick={() => handleTileClick("Aide & support")}
          />
        </ServiceSection>
      </div>
    </div>
  );
}
