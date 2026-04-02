import { ArrowLeft, Ticket, CalendarHeart, Heart, MapPin, Loader2, Navigation as NavIcon, Phone, Search } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { getCurrentPosition, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { searchMultiplePOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";
import { toast } from "sonner";

// --- Préférences de loisirs ---
interface LeisurePreference {
  key: string;
  label: string;
  emoji: string;
  poiTypes: POIType[];
}

const LEISURE_PREFERENCES: LeisurePreference[] = [
  { key: "cinema", label: "Cinéma", emoji: "🎬", poiTypes: ["cinema"] },
  { key: "musique", label: "Musique", emoji: "🎵", poiTypes: ["cafe"] },
  { key: "nature", label: "Nature", emoji: "🌿", poiTypes: ["park"] },
  { key: "cuisine", label: "Cuisine", emoji: "🍳", poiTypes: ["restaurant", "bakery"] },
  { key: "musees", label: "Musées", emoji: "🖼️", poiTypes: ["library"] },
  { key: "sport_doux", label: "Sport doux", emoji: "🧘", poiTypes: ["sports_centre", "park"] },
  { key: "theatre", label: "Théâtre", emoji: "🎭", poiTypes: ["cinema"] },
  { key: "jardinage", label: "Jardinage", emoji: "🌻", poiTypes: ["park"] },
];

const ALL_LEISURE_POI_TYPES: POIType[] = ["cinema", "park", "library", "restaurant", "cafe", "sports_centre"];

const STORAGE_KEY = "oscar_leisure_preferences";

type TabKey = "semaine" | "envies";

export function EntertainmentPage() {
  const goBack = useBackNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>("semaine");

  // Recherche
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<OverpassPOI[]>([]);

  // Préférences
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPrefs));
  }, [selectedPrefs]);

  const togglePref = (key: string) => {
    setSelectedPrefs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const coords = await getCurrentPosition();

      let poiTypes: POIType[];
      if (selectedPrefs.length > 0) {
        const typesSet = new Set<POIType>();
        selectedPrefs.forEach(key => {
          const pref = LEISURE_PREFERENCES.find(p => p.key === key);
          pref?.poiTypes.forEach(t => typesSet.add(t));
        });
        poiTypes = Array.from(typesSet);
      } else {
        poiTypes = ALL_LEISURE_POI_TYPES;
      }

      const pois = await searchMultiplePOIs(coords, poiTypes, 5000);
      setResults(pois);
      setSearched(true);

      if (pois.length === 0) {
        toast("Aucun lieu trouvé dans un rayon de 5 km.");
      }
    } catch (err: any) {
      toast.error(err.message || "Impossible d'obtenir votre position.");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: "semaine" as TabKey, label: "Autour de moi", icon: CalendarHeart },
    { key: "envies" as TabKey, label: "Mes envies", icon: Heart },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Sorties & Loisirs</h1>
          <p className="text-sm text-muted-foreground">Trouvez des idées près de chez vous</p>
        </div>
        <Ticket className="w-6 h-6 text-primary" />
      </header>

      <div className="flex border-b border-border bg-card flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">

        {/* ========== AUTOUR DE MOI ========== */}
        {activeTab === "semaine" && (
          <>
            {selectedPrefs.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Filtré par :</span>
                {selectedPrefs.map(key => {
                  const pref = LEISURE_PREFERENCES.find(p => p.key === key);
                  return pref ? (
                    <span key={key} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                      {pref.emoji} {pref.label}
                    </span>
                  ) : null;
                })}
                <button onClick={() => setSelectedPrefs([])} className="text-xs text-muted-foreground underline ml-1">Tout voir</button>
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base"
              style={{
                background: loading ? "#94a3b8" : "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Recherche en cours...</>
              ) : (
                <><MapPin className="w-5 h-5" /> {searched ? "Relancer la recherche" : "Chercher autour de moi"}</>
              )}
            </button>

            {!searched && !loading && (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Cinémas, parcs, bibliothèques, restaurants et lieux de loisirs proches de vous.
                </p>
                {selectedPrefs.length === 0 && (
                  <button
                    onClick={() => setActiveTab("envies")}
                    className="mx-auto block text-sm font-semibold text-primary underline underline-offset-2"
                  >
                    Définir mes envies pour affiner →
                  </button>
                )}
              </>
            )}

            {searched && !loading && (
              <div className="space-y-3">
                {results.length > 0 ? results.map(poi => (
                  <div key={poi.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {getPOIEmoji(poi.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-base">{poi.name}</h3>
                          <span className="text-sm font-medium text-primary flex-shrink-0">{formatDistance(poi.distance)}</span>
                        </div>
                        {poi.address && <p className="text-sm text-muted-foreground mt-0.5">{poi.address}</p>}
                        {poi.openingHours && <p className="text-sm text-muted-foreground mt-1">🕐 {poi.openingHours}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          {poi.phone && (
                            <a href={`tel:${poi.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                              <Phone className="w-3.5 h-3.5" /> Appeler
                            </a>
                          )}
                          <a
                            href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-medium"
                          >
                            <NavIcon className="w-3.5 h-3.5" /> Y aller
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">Aucun lieu trouvé à proximité</p>
                    <p className="text-sm text-muted-foreground">Essayez d'élargir vos envies ou relancez la recherche.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========== MES ENVIES ========== */}
        {activeTab === "envies" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sélectionnez vos centres d'intérêt pour affiner la recherche autour de vous.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {LEISURE_PREFERENCES.map(pref => {
                const isSelected = selectedPrefs.includes(pref.key);
                return (
                  <button
                    key={pref.key}
                    onClick={() => togglePref(pref.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{pref.emoji}</span>
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {pref.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedPrefs.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-primary">{selectedPrefs.length}</span>{" "}
                  centre{selectedPrefs.length > 1 ? "s" : ""} d'intérêt sélectionné{selectedPrefs.length > 1 ? "s" : ""}.
                </p>
              </div>
            )}

            <button
              onClick={() => { setActiveTab("semaine"); handleSearch(); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #1D9E75 0%, #179e6b 100%)" }}
            >
              <MapPin className="w-5 h-5" />
              Chercher autour de moi
            </button>
          </>
        )}
      </div>
    </div>
  );
}
