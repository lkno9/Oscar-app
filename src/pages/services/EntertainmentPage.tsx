import { ArrowLeft, Ticket, Heart, MapPin, Loader2, Navigation as NavIcon, Phone, Search } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect } from "react";
import { getCurrentPosition, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { searchMultiplePOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";
import { toast } from "sonner";

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

export function EntertainmentPage() {
  const goBack = useBackNavigation();

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<OverpassPOI[]>([]);

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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">

        {/* Filtres / Mes envies */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-primary" />
            Mes envies
          </p>
          <div className="flex flex-wrap gap-2">
            {LEISURE_PREFERENCES.map(pref => {
              const isSelected = selectedPrefs.includes(pref.key);
              return (
                <button
                  key={pref.key}
                  onClick={() => togglePref(pref.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span>{pref.emoji}</span>
                  {pref.label}
                </button>
              );
            })}
            {selectedPrefs.length > 0 && (
              <button
                onClick={() => setSelectedPrefs([])}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-muted-foreground border border-dashed border-border hover:border-destructive/40 hover:text-destructive transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>
        </div>

        {/* Bouton recherche */}
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
          <p className="text-center text-sm text-muted-foreground">
            Cinémas, parcs, bibliothèques, restaurants et lieux de loisirs proches de vous.
          </p>
        )}

        {/* Résultats */}
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
      </div>
    </div>
  );
}
