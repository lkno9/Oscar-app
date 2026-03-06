import { ArrowLeft, MapPin, ExternalLink, Bus, Car, Navigation, Train } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";

const TRANSPORT_SERVICES = [
  {
    category: "Transports en commun",
    items: [
      { name: "RATP", desc: "Métro, bus, RER en Île-de-France", url: "https://www.ratp.fr", emoji: "🚇" },
      { name: "SNCF Connect", desc: "Trains, TGV, billets et horaires", url: "https://www.sncf-connect.com", emoji: "🚄" },
      { name: "Itinéraires Mappy", desc: "Calculer un trajet en transport ou voiture", url: "https://www.mappy.com", emoji: "🗺️" },
    ],
  },
  {
    category: "Taxi & VTC",
    items: [
      { name: "G7 Taxi", desc: "Réserver un taxi G7 par téléphone ou en ligne", url: "https://www.g7.fr", emoji: "🚕" },
      { name: "Uber", desc: "Commander un VTC depuis votre téléphone", url: "https://www.uber.com/fr", emoji: "🚗" },
    ],
  },
  {
    category: "Aides & réductions",
    items: [
      { name: "Carte Avantage Senior", desc: "Réductions SNCF pour les plus de 60 ans", url: "https://www.sncf-connect.com/app/catalogue/description/carte-avantage-senior", emoji: "💳" },
      { name: "Navigo Senior", desc: "Tarifs réduits Île-de-France (selon revenus)", url: "https://www.iledefrance-mobilites.fr/titres-et-tarifs", emoji: "🎫" },
      { name: "Transport adapté (PAM)", desc: "Transport porte-à-porte pour personnes à mobilité réduite", url: "https://www.iledefrance-mobilites.fr/le-transport-adapte", emoji: "♿" },
    ],
  },
];

const QUICK_TIPS = [
  "Demandez à Oscar : « Quel bus pour aller à la pharmacie ? »",
  "La Carte Avantage Senior offre -30% sur les billets SNCF.",
  "En cas de difficulté, appelez le 3117 (numéro d'aide en gare).",
];

export function TransportPage() {
  const goBack = useBackNavigation();

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Déplacements & transport</h1>
          <p className="text-sm text-muted-foreground">Vos trajets simplifiés</p>
        </div>
        <Navigation className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {/* Oscar banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-primary">Oscar peut aussi vous aider !</span>{" "}
            Dites-lui par exemple : « Oscar, quel bus pour aller à la pharmacie ? »
          </p>
        </div>

        {/* Tips */}
        <div className="bg-accent rounded-2xl p-4 border border-border">
          <p className="font-bold text-accent-foreground mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Astuces transport
          </p>
          <ul className="space-y-1.5">
            {QUICK_TIPS.map((tip, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Service categories */}
        {TRANSPORT_SERVICES.map((cat, ci) => (
          <section key={ci}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              {ci === 0 && <Bus className="w-4 h-4" />}
              {ci === 1 && <Car className="w-4 h-4" />}
              {ci === 2 && <Train className="w-4 h-4" />}
              {cat.category}
            </h2>
            <div className="space-y-3">
              {cat.items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => window.open(item.url, "_blank")}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
