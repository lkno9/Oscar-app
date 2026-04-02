import { ArrowLeft, Ticket, MessageCircle } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useNavigate } from "react-router-dom";

const IDEAS = [
  { emoji: "🎬", title: "Cinéma du quartier", tip: "Renseignez-vous au cinéma le plus proche de chez vous" },
  { emoji: "🖼️", title: "Exposition ou musée", tip: "Les musées nationaux sont gratuits le 1er dimanche du mois" },
  { emoji: "🎭", title: "Spectacle ou théâtre", tip: "Les mairies proposent souvent des billets à tarif réduit" },
  { emoji: "🛍️", title: "Marché local", tip: "Une belle façon de sortir et de rencontrer des gens" },
  { emoji: "🌿", title: "Promenade en nature", tip: "30 minutes dehors améliorent l'humeur et la circulation" },
  { emoji: "🤝", title: "Club ou association", tip: "Votre mairie recense tous les clubs seniors du quartier" },
];

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Idées de sorties</h1>
          <p className="text-sm text-muted-foreground">Inspirez-vous pour votre prochaine sortie</p>
        </div>
        <Ticket className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Ideas */}
        <div className="space-y-3">
          {IDEAS.map((idea, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-4 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {idea.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base">{idea.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{idea.tip}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Oscar */}
        <button
          onClick={() => navigate("/", { state: { tab: "oscar" } })}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base"
          style={{ background: "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)" }}
        >
          <MessageCircle className="w-5 h-5" />
          Trouver une sortie près de chez moi
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Oscar cherchera pour vous ce qui se passe autour de chez vous.
        </p>
      </div>
    </div>
  );
}
