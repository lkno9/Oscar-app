import { useNavigate } from "react-router-dom";
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
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { ServiceTile, ServiceSection } from "@/components/ServiceTile";

export function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      <header className="px-4 py-6 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre quotidien en toute simplicité
        </p>
      </header>

      <div className="flex-1 p-4 space-y-6 pb-8">
        <ServiceSection title="Vie quotidienne" emoji="📁">
          <ServiceTile icon={<CalendarDays className="w-7 h-7" />} label="Agenda & rendez-vous" onClick={() => navigate("/services/agenda")} />
          <ServiceTile icon={<FileText className="w-7 h-7" />} label="Documents & démarches" onClick={() => navigate("/services/documents")} />
          <ServiceTile icon={<CreditCard className="w-7 h-7" />} label="Paiements & factures" onClick={() => navigate("/services/payments")} />
          <ServiceTile icon={<Cloud className="w-7 h-7" />} label="Stockage & fichiers" onClick={() => navigate("/services/storage")} />
        </ServiceSection>

        <ServiceSection title="Communication" emoji="💬">
          <ServiceTile icon={<Users className="w-7 h-7" />} label="Famille & messages" onClick={() => navigate("/services/family")} />
          <ServiceTile icon={<Phone className="w-7 h-7" />} label="Appels & visios" onClick={() => navigate("/services/calls")} />
          <ServiceTile icon={<Image className="w-7 h-7" />} label="Photos & souvenirs" onClick={() => navigate("/services/photos")} />
        </ServiceSection>

        <ServiceSection title="Santé & bien-être" emoji="🩺">
          <ServiceTile icon={<Pill className="w-7 h-7" />} label="Santé & médicaments" onClick={() => navigate("/services/health")} />
          <ServiceTile icon={<FileHeart className="w-7 h-7" />} label="Ordonnances & remboursements" onClick={() => navigate("/services/prescriptions")} />
          <ServiceTile icon={<Heart className="w-7 h-7" />} label="Bien-être" onClick={() => navigate("/services/wellness")} />
        </ServiceSection>

        <ServiceSection title="Loisirs & culture" emoji="🎵">
          <ServiceTile icon={<Music className="w-7 h-7" />} label="Musique & radio" onClick={() => navigate("/services/music")} />
          <ServiceTile icon={<BookOpen className="w-7 h-7" />} label="Bibliothèque & podcasts" onClick={() => navigate("/services/library")} />
          <ServiceTile icon={<Gamepad2 className="w-7 h-7" />} label="Jeux & mémoire" onClick={() => navigate("/services/games")} />
        </ServiceSection>

        <ServiceSection title="Bons plans" emoji="✨">
          <ServiceTile icon={<Sparkles className="w-7 h-7" />} label="Bons plans seniors" onClick={() => navigate("/services/partners")} />
        </ServiceSection>

        <ServiceSection title="Sécurité & assistance" emoji="🛡️">
          <ServiceTile icon={<Lock className="w-7 h-7" />} label="Coffre-fort numérique" onClick={() => navigate("/services/vault")} />
          <ServiceTile icon={<ShieldAlert className="w-7 h-7" />} label="Protection Arnaques" onClick={() => navigate("/services/scam-protection")} />
          <ServiceTile icon={<AlertTriangle className="w-7 h-7" />} label="Urgence / SOS" intent="danger" onClick={() => navigate("/services/emergency")} />
          <ServiceTile icon={<HelpCircle className="w-7 h-7" />} label="Aide & support" onClick={() => navigate("/services/help")} />
        </ServiceSection>
      </div>
    </div>
  );
}
