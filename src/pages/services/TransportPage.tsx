import { useState } from "react";
import { ArrowLeft, MapPin, ExternalLink, Bus, Car, Navigation, Train, Loader2, ChevronRight } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getCurrentPosition, reverseGeocode, formatDistance, googleMapsDirectionsUrl, type Coordinates } from "@/lib/geo";
import { searchMultiplePOIs, getPOIEmoji, type OverpassPOI } from "@/lib/overpass";
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

type TabKey = "trajets" | "services";

export function TransportPage() {
  const goBack = useBackNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>("trajets");

  // Nearby stops
  const [nearbyStops, setNearbyStops] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySearched, setNearbySearched] = useState(false);
  const [stopFilter, setStopFilter] = useState<"all" | "bus" | "metro">("all");
  const [locationDenied, setLocationDenied] = useState(false);

  const searchNearby = async () => {
    setNearbyLoading(true);
    setNearbyStops([]);
    setLocationDenied(false);
    try {
      const coords = await getCurrentPosition();
      const types = stopFilter === "bus" ? ["bus_stop" as const]
                  : stopFilter === "metro" ? ["subway" as const]
                  : ["bus_stop" as const, "subway" as const];
      const results = await searchMultiplePOIs(coords, types, stopFilter === "metro" ? 2000 : 1000);
      setNearbyStops(results);
      setNearbySearched(true);
      if (results.length === 0) toast("Aucun arrêt trouvé à proximité. Essayez un rayon plus large.");
    } catch (err: any) {
      if ((err as any).isDenied) {
        setLocationDenied(true);
      } else {
        toast.error(err.message || "Impossible d'obtenir votre position.");
      }
    } finally {
      setNearbyLoading(false);
    }
  };

  // Journey planner
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelMode, setTravelMode] = useState<"transit" | "driving" | "walking">("transit");
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
    const url = googleMapsDirectionsUrl(
      destination.trim(),
      origin.trim() || undefined,
      travelMode
    );
    window.open(url, "_blank");
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
          <p className="text-sm text-muted-foreground">Vos trajets simplifiés</p>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">

        {/* ========== ONGLET : MES TRAJETS ========== */}
        {activeTab === "trajets" && (
          <>
            {/* Section Autour de moi */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Arrêts proches
              </p>

              <div className="flex gap-2 mb-3">
                {([
                  { key: "all" as const, label: "Tous", emoji: "📍" },
                  { key: "bus" as const, label: "Bus", emoji: "🚌" },
                  { key: "metro" as const, label: "Métro", emoji: "🚇" },
                ]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStopFilter(f.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: stopFilter === f.key ? "rgba(72,162,158,0.12)" : undefined,
                      border: `1.5px solid ${stopFilter === f.key ? "#48A29E" : "hsl(var(--border))"}`,
                      color: stopFilter === f.key ? "#48A29E" : undefined,
                    }}
                  >
                    <span>{f.emoji}</span> {f.label}
                  </button>
                ))}
              </div>

              {locationDenied && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-3 mb-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                    Vous avez initialement refusé l'accès à votre localisation. Souhaitez-vous l'activer maintenant pour trouver les arrêts proches ?
                  </p>
                  <button
                    onClick={() => { setLocationDenied(false); searchNearby(); }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              <button
                onClick={searchNearby}
                disabled={nearbyLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all mb-3"
                style={{
                  background: nearbyLoading ? "#94a3b8" : "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
                  border: "none",
                  cursor: nearbyLoading ? "wait" : "pointer",
                  fontSize: 15,
                }}
              >
                {nearbyLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Recherche en cours...</>
                ) : (
                  <><MapPin className="w-5 h-5" /> Trouver les arrêts proches</>
                )}
              </button>

              {nearbySearched && !nearbyLoading && (
                <div className="space-y-3 mb-2">
                  {nearbyStops.length > 0 ? nearbyStops.map(poi => (
                    <div key={poi.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {getPOIEmoji(poi.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{poi.name}</p>
                        {poi.address && <p className="text-sm text-muted-foreground">{poi.address}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm font-medium text-primary">{formatDistance(poi.distance)}</span>
                        <a
                          href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 font-medium"
                        >
                          Y aller →
                        </a>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <span className="text-3xl block mb-2">🔍</span>
                      <p className="text-muted-foreground">Aucun arrêt trouvé à proximité</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Itinéraire</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Section Itinéraire */}
            <div className="bg-card rounded-xl p-4 border border-border space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Départ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="Votre adresse de départ"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-base"
                  />
                  <button
                    onClick={fillMyPosition}
                    disabled={locatingOrigin}
                    className="px-3 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center gap-1 flex-shrink-0"
                  >
                    {locatingOrigin ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Ma position
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Où souhaitez-vous aller ?"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-base"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Comment ?</label>
                <div className="flex gap-2">
                  {([
                    { key: "transit" as const, label: "Transport", emoji: "🚌" },
                    { key: "driving" as const, label: "Voiture", emoji: "🚗" },
                    { key: "walking" as const, label: "À pied", emoji: "🚶" },
                  ]).map(m => (
                    <button
                      key={m.key}
                      onClick={() => setTravelMode(m.key)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: travelMode === m.key ? "rgba(72,162,158,0.12)" : undefined,
                        border: `1.5px solid ${travelMode === m.key ? "#48A29E" : "hsl(var(--border))"}`,
                        color: travelMode === m.key ? "#48A29E" : undefined,
                      }}
                    >
                      <span>{m.emoji}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={launchDirections}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
              style={{
                background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              <Navigation className="w-5 h-5" /> Voir l'itinéraire
              <ChevronRight className="w-4 h-4" />
            </button>

            <p className="text-sm text-muted-foreground text-center">
              L'itinéraire s'ouvrira dans Google Maps
            </p>
          </>
        )}

        {/* ========== ONGLET : SERVICES ========== */}
        {activeTab === "services" && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
