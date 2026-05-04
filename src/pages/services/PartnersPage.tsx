import { ArrowLeft, Gift, Clock } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export function PartnersPage() {
  const goBack = useBackNavigation();

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Mes avantages</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Bons plans et offres partenaires</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Bientôt disponible</h2>
          <p className="text-muted-foreground leading-relaxed max-w-xs">
            Nous travaillons à sélectionner des partenaires de qualité pour vous proposer des offres et avantages adaptés.
          </p>
          <p className="text-sm text-primary font-medium mt-2">À venir prochainement 🎁</p>
        </div>
      </div>
    </div>
  );
}
