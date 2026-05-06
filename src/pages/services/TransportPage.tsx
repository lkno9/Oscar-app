import { useState } from "react";
import { ArrowLeft, MapPin, ExternalLink, Bus, Car, Navigation, Train, Loader2, ChevronRight, X, MoreHorizontal, RotateCcw } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getCurrentPosition, reverseGeocode, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { searchMultiplePOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";
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
  types: POIType[];
  radius?: number;
}

const QUICK_CHIPS: ChipDef[] = [
  { key: "restaurant", label: "Restaurants", emoji: "🍽️", types: ["restaurant"], radius: 1000 },
  { key: "pharmacy",   label: "Pharmacie",   emoji: "💊", types: ["pharmacy"],   radius: 1500 },
  { key: "bakery",     label: "Boulangerie", emoji: "🥖", types: ["bakery"],     radius: 1000 },
  { key: "cafe",       label: "Café",        emoji: "☕", types: ["cafe"],       radius: 1000 },
  { key: "transport",  label: "Transport",   emoji: "🚌", types: ["bus_stop", "subway"], radius: 1000 },
  { key: "park",       label: "Parcs",       emoji: "🌳", types: ["park"],       radius: 2000 },
  { key: "supermarket",label: "Courses",     emoji: "🛒", types: ["supermarket"],radius: 1500 },
  { key: "bank",       label: "Banque",      emoji: "🏦", types: ["bank"],       radius: 1500 },
];

const ALL_CATEGORIES: { group: string; emoji: string; items: ChipDef[] }[] = [
  {
    group: "Alimentation",
    emoji: "🍴",
    items: [
      { key: "restaurant",  label: "Restaurants",   emoji: "🍽️", types: ["restaurant"],  radius: 1000 },
      { key: "bakery",      label: "Boulangeries",  emoji: "🥖", types: ["bakery"],      radius: 1000 },
      { key: "cafe",        label: "Cafés",         emoji: "☕", types: ["cafe"],        radius: 1000 },
      { key: "supermarket", label: "Supermarchés",  emoji: "🛒", types: ["supermarket"], radius: 1500 },
    ],
  },
  {
    group: "Santé",
    emoji: "💊",
    items: [
      { key: "pharmacy", label: "Pharmacies", emoji: "💊", types: ["pharmacy"], radius: 1500 },
      { key: "doctor",   label: "Médecins",   emoji: "👨‍⚕️", types: ["doctor"],   radius: 2000 },
      { key: "hospital", label: "Hôpitaux",   emoji: "🏥", types: ["hospital"], radius: 5000 },
    ],
  },
  {
    group: "Transport",
    emoji: "🚌",
    items: [
      { key: "transport", label: "Bus & Métro", emoji: "🚌", types: ["bus_stop", "subway"], radius: 1000 },
    ],
  },
  {
    group: "Services",
    emoji: "🏛️",
    items: [
      { key: "bank",        label: "Banques",           emoji: "🏦", types: ["bank"],        radius: 1500 },
      { key: "post_office", label: "Bureaux de poste",  emoji: "🏤", types: ["post_office"], radius: 2000 },
      { key: "police",      label: "Commissariats",     emoji: "🚔", types: ["police"],      radius: 5000 },
    ],
  },
  {
    group: "Loisirs",
    emoji: "🌳",
    items: [
      { key: "park",          label: "Parcs",           emoji: "🌳", types: ["park"],          radius: 2000 },
      { key: "library",       label: "Bibliothèques",   emoji: "📚", types: ["library"],       radius: 3000 },
      { key: "cinema",        label: "Cinémas",         emoji: "🎬", types: ["cinema"],        radius: 5000 },
      { key: "sports_centre", label: "Salles de sport", emoji: "🏋️", types: ["sports_centre"], radius: 3000 },
    ],
  },
];

type TabKey = "trajets" | "services";

export function TransportPage() {
  const goBack = useBackNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>("trajets");

  // Nearby search
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [nearbyResults, setNearbyResults] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);

  const searchNearby = async (chip: ChipDef) => {
    setActiveChip(chip.key);
    setNearbyLoading(true);
    setNearbyResults([]);
    setLocationDenied(false);
    setShowCategoriesPanel(false);
    try {
      const coords = await getCurrentPosition();
      const results = await searchMultiplePOIs(coords, chip.types, chip.radius);
      setNearbyResults(results);
      if (results.length === 0) toast("Aucun résultat trouvé dans ce rayon.");
    } catch (err: any) {
      if (err?.isDenied) {
        setLocationDenied(true);
      } else {
        toast.error(err.message || "Impossible d'obtenir votre position.");
      }
    } finally {
      setNearbyLoading(false);
    }
  };

  const activeChipDef =
    QUICK_CHIPS.find(c => c.key === activeChip) ??
    ALL_CATEGORIES.flatMap(g => g.items).find(c => c.key === activeChip);

  // Journey planner
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [locatingOrigin, setLocatingOrigin] = useState(false);

  const fillMyPosition = async () => {
    setLocatingOrigin(true);
    try {
      const coords = await getCurrentPosition();
      const geo = await reverseGeocode(coords);
      setOrigin(geo.displayName);
    } catch {
      toast.error("Impossible d'obtenir votre position.");
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

            {/* ── Chips détachées ── */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pt-4 pb-3">
              {QUICK_CHIPS.map(chip => {
                const isActive = activeChip === chip.key;
                return (
                  <button
                    key={chip.key}
                    onClick={() => searchNearby(chip)}
                    disabled={nearbyLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all"
                    style={{
                      background: isActive ? "#2DD4BF" : "hsl(var(--card))",
                      border: `1.5px solid ${isActive ? "#2DD4BF" : "hsl(var(--border))"}`,
                      color: isActive ? "white" : "hsl(var(--foreground))",
                      boxShadow: isActive ? "0 2px 8px rgba(45,212,191,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span>{chip.emoji}</span>
                    {chip.label}
                  </button>
                );
              })}
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
                    onChange={e => setOrigin(e.target.value)}
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

              {/* ── Localisation refusée ── */}
              {locationDenied && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Localisation requise</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">Autorisez l'accès à votre position pour chercher autour de vous.</p>
                  </div>
                  <button
                    onClick={() => { setLocationDenied(false); if (activeChipDef) searchNearby(activeChipDef); }}
                    className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex-shrink-0"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {/* ── Résultats ── */}
              {nearbyLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Recherche en cours…</p>
                </div>
              )}

              {!nearbyLoading && activeChip && nearbyResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-semibold text-foreground">
                      {nearbyResults.length} résultat{nearbyResults.length > 1 ? "s" : ""} autour de vous
                    </p>
                    <button
                      onClick={() => { if (activeChipDef) searchNearby(activeChipDef); }}
                      className="flex items-center gap-1 text-sm text-primary font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Actualiser
                    </button>
                  </div>
                  {nearbyResults.map(poi => (
                    <div key={poi.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {getPOIEmoji(poi.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{poi.name}</p>
                        {poi.address && <p className="text-sm text-muted-foreground truncate">{poi.address}</p>}
                        {poi.openingHours && <p className="text-xs text-muted-foreground">🕐 {poi.openingHours}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">{formatDistance(poi.distance)}</span>
                        <a
                          href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                        >
                          Y aller →
                        </a>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!nearbyLoading && activeChip && nearbyResults.length === 0 && !locationDenied && (
                <div className="text-center py-6">
                  <span className="text-3xl block mb-2">🔍</span>
                  <p className="text-foreground font-medium">Aucun résultat à proximité</p>
                  <p className="text-sm text-muted-foreground mt-1">Essayez une autre catégorie</p>
                </div>
              )}

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCategoriesPanel(false)} />

          {/* Sheet */}
          <div className="relative bg-background rounded-t-3xl overflow-hidden" style={{ maxHeight: "80vh" }}>
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Catégories</h2>
              <button
                onClick={() => setShowCategoriesPanel(false)}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 64px)" }}>
              {ALL_CATEGORIES.map(group => (
                <div key={group.group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary/40">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">
                      {group.emoji}
                    </div>
                    <span className="font-bold text-foreground">{group.group}</span>
                  </div>

                  {/* Items */}
                  {group.items.map((item, i) => (
                    <button
                      key={item.key}
                      onClick={() => searchNearby(item)}
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
