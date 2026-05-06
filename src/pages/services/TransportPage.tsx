import { useState } from "react";
import { ArrowLeft, MapPin, ExternalLink, Bus, Car, Navigation, Train, Loader2, ChevronRight, X, MoreHorizontal } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getCurrentPosition, reverseGeocode, googleMapsDirectionsUrl } from "@/lib/geo";
import { toast } from "sonner";

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

interface ChipDef {
  key: string;
  label: string;
  emoji: string;
  query: string;
}

const QUICK_CHIPS: ChipDef[] = [
  { key: "restaurant", label: "Restaurants", emoji: "🍽️", query: "restaurants" },
  { key: "pharmacy",   label: "Pharmacie",   emoji: "💊", query: "pharmacie" },
  { key: "bakery",     label: "Boulangerie", emoji: "🥖", query: "boulangerie" },
  { key: "cafe",       label: "Café",        emoji: "☕", query: "café" },
  { key: "transport",  label: "Transport",   emoji: "🚌", query: "arrêt de bus métro" },
  { key: "park",       label: "Parcs",       emoji: "🌳", query: "parc jardin" },
  { key: "supermarket",label: "Courses",     emoji: "🛒", query: "supermarché épicerie" },
  { key: "bank",       label: "Banque",      emoji: "🏦", query: "banque distributeur" },
];

const ALL_CATEGORIES: { group: string; emoji: string; items: ChipDef[] }[] = [
  {
    group: "Alimentation",
    emoji: "🍴",
    items: [
      { key: "restaurant",  label: "Restaurants",  emoji: "🍽️", query: "restaurants" },
      { key: "bakery",      label: "Boulangeries", emoji: "🥖", query: "boulangerie" },
      { key: "cafe",        label: "Cafés",        emoji: "☕", query: "café" },
      { key: "supermarket", label: "Supermarchés", emoji: "🛒", query: "supermarché" },
    ],
  },
  {
    group: "Santé",
    emoji: "💊",
    items: [
      { key: "pharmacy", label: "Pharmacies", emoji: "💊", query: "pharmacie" },
      { key: "doctor",   label: "Médecins",   emoji: "👨‍⚕️", query: "médecin généraliste" },
      { key: "hospital", label: "Hôpitaux",   emoji: "🏥", query: "hôpital urgences" },
    ],
  },
  {
    group: "Transport",
    emoji: "🚌",
    items: [
      { key: "bus",   label: "Arrêts de bus", emoji: "🚌", query: "arrêt de bus" },
      { key: "metro", label: "Stations métro", emoji: "🚇", query: "station métro" },
      { key: "train", label: "Gares",          emoji: "🚂", query: "gare SNCF" },
    ],
  },
  {
    group: "Services",
    emoji: "🏛️",
    items: [
      { key: "bank",        label: "Banques",           emoji: "🏦", query: "banque distributeur" },
      { key: "post_office", label: "Bureaux de poste",  emoji: "🏤", query: "bureau de poste La Poste" },
      { key: "police",      label: "Commissariats",     emoji: "🚔", query: "commissariat police" },
      { key: "mairie",      label: "Mairies",           emoji: "🏛️", query: "mairie" },
    ],
  },
  {
    group: "Loisirs",
    emoji: "🌳",
    items: [
      { key: "park",     label: "Parcs",           emoji: "🌳", query: "parc jardin public" },
      { key: "library",  label: "Bibliothèques",   emoji: "📚", query: "bibliothèque médiathèque" },
      { key: "cinema",   label: "Cinémas",         emoji: "🎬", query: "cinéma" },
      { key: "gym",      label: "Salles de sport", emoji: "🏋️", query: "salle de sport fitness" },
      { key: "museum",   label: "Musées",          emoji: "🏛️", query: "musée" },
    ],
  },
];

const openGoogleMapsSearch = (query: string) => {
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, "_blank");
};

type TabKey = "trajets" | "services";

export function TransportPage() {
  const goBack = useBackNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>("trajets");
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);

  // Journey planner
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [locatingOrigin, setLocatingOrigin] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const fillMyPosition = async () => {
    setLocatingOrigin(true);
    setLocationDenied(false);
    try {
      const coords = await getCurrentPosition();
      const geo = await reverseGeocode(coords);
      setOrigin(geo.displayName);
    } catch (err: any) {
      if (err?.isDenied) {
        setLocationDenied(true);
      } else {
        toast.error("Impossible d'obtenir votre position.");
      }
    } finally {
      setLocatingOrigin(false);
    }
  };

  const launchDirections = () => {
    if (!destination.trim()) { toast.error("Entrez une destination."); return; }
    window.open(googleMapsDirectionsUrl(destination.trim(), origin.trim() || undefined, "transit"), "_blank");
  };

  const TABS = [
    { key: "trajets" as TabKey, label: "Mes trajets", icon: Navigation },
    { key: "services" as TabKey, label: "Services", icon: ExternalLink },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Déplacements & transport</h1>
          <p className="text-sm text-muted-foreground">Trouvez, planifiez, déplacez-vous</p>
        </div>
        <Navigation className="w-6 h-6 text-primary" />
      </header>

      <div className="flex border-b border-border bg-card flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ========== ONGLET : MES TRAJETS ========== */}
        {activeTab === "trajets" && (
          <div className="pb-8">

            {/* ── Chips → ouvre Google Maps directement ── */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pt-4 pb-3">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => openGoogleMapsSearch(chip.query)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1.5px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <span>{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
              <button
                onClick={() => setShowCategoriesPanel(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0"
                style={{
                  background: "hsl(var(--card))",
                  border: "1.5px solid hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
                Plus
              </button>
            </div>

            <div className="px-4 space-y-3">

              {/* ── Itinéraire ── */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                  <input
                    type="text"
                    value={origin}
                    onChange={e => { setOrigin(e.target.value); setLocationDenied(false); }}
                    placeholder="Départ (adresse ou lieu)"
                    className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={fillMyPosition}
                    disabled={locatingOrigin}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium flex-shrink-0"
                  >
                    {locatingOrigin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    Ma position
                  </button>
                </div>

                {locationDenied && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-300">Localisation non autorisée</p>
                    <button onClick={fillMyPosition} className="text-sm font-semibold text-orange-600 dark:text-orange-400 ml-3 flex-shrink-0">
                      Réessayer
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="w-4 h-4 text-destructive flex-shrink-0" />
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") launchDirections(); }}
                    placeholder="Destination (adresse, lieu…)"
                    className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <button
                onClick={launchDirections}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)", border: "none", fontSize: 15 }}
              >
                <Navigation className="w-5 h-5" /> Ouvrir dans Google Maps
              </button>

            </div>
          </div>
        )}

        {/* ========== ONGLET : SERVICES ========== */}
        {activeTab === "services" && (
          <div className="p-4 space-y-4">
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
        )}
      </div>

      {/* ========== PANNEAU TOUTES LES CATÉGORIES ========== */}
      {showCategoriesPanel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCategoriesPanel(false)} />
          <div className="relative bg-background rounded-t-3xl overflow-hidden" style={{ maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Catégories</h2>
              <button onClick={() => setShowCategoriesPanel(false)} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 64px)" }}>
              {ALL_CATEGORIES.map(group => (
                <div key={group.group}>
                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary/40">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">
                      {group.emoji}
                    </div>
                    <span className="font-bold text-foreground">{group.group}</span>
                  </div>
                  {group.items.map((item, i) => (
                    <button
                      key={item.key}
                      onClick={() => { setShowCategoriesPanel(false); openGoogleMapsSearch(item.query); }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors ${
                        i < group.items.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{item.emoji}</span>
                      <span className="flex-1 text-base text-foreground">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
