import { type Coordinates, haversineDistance } from "./geo";

// --- Types ---
export interface OverpassPOI {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  type: POIType;
  address?: string;
  phone?: string;
  openingHours?: string;
}

export type POIType = "pharmacy" | "bus_stop" | "subway" | "doctor" | "hospital" | "restaurant";

// --- Configuration requêtes Overpass par type ---
const POI_CONFIGS: Record<POIType, { filter: string; defaultRadius: number; emoji: string; label: string }> = {
  pharmacy:   { filter: '["amenity"="pharmacy"]',   defaultRadius: 1500, emoji: "💊", label: "Pharmacie" },
  bus_stop:   { filter: '["highway"="bus_stop"]',    defaultRadius: 1000, emoji: "🚌", label: "Arrêt de bus" },
  subway:     { filter: '["station"="subway"]',      defaultRadius: 2000, emoji: "🚇", label: "Métro" },
  doctor:     { filter: '["amenity"="doctors"]',     defaultRadius: 2000, emoji: "👨‍⚕️", label: "Médecin" },
  hospital:   { filter: '["amenity"="hospital"]',    defaultRadius: 5000, emoji: "🏥", label: "Hôpital" },
  restaurant: { filter: '["amenity"="restaurant"]',  defaultRadius: 1000, emoji: "🍽️", label: "Restaurant" },
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const MAX_RESULTS = 15;

/**
 * Recherche des points d'intérêt proches via l'API Overpass (OpenStreetMap).
 */
export async function searchNearbyPOIs(
  coords: Coordinates,
  type: POIType,
  radiusMeters?: number
): Promise<OverpassPOI[]> {
  const config = POI_CONFIGS[type];
  const radius = radiusMeters || config.defaultRadius;

  const query = `
    [out:json][timeout:10];
    (
      node${config.filter}(around:${radius},${coords.lat},${coords.lon});
      way${config.filter}(around:${radius},${coords.lat},${coords.lon});
    );
    out center body;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error("Impossible de chercher les lieux proches.");

  const data = await res.json();
  const elements: any[] = data.elements || [];

  const pois: OverpassPOI[] = elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) return null;

      const tags = el.tags || {};
      const name = tags.name || config.label;

      // Construire l'adresse
      const addrParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:postcode"], tags["addr:city"]].filter(Boolean);
      const address = addrParts.length > 0 ? addrParts.join(" ") : undefined;

      return {
        id: el.id,
        name,
        lat,
        lon,
        distance: haversineDistance(coords, { lat, lon }),
        type,
        address,
        phone: tags.phone || tags["contact:phone"],
        openingHours: tags.opening_hours,
      } as OverpassPOI;
    })
    .filter((p): p is OverpassPOI => p !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RESULTS);

  return pois;
}

/**
 * Recherche multi-types (ex: bus + métro ensemble).
 */
export async function searchMultiplePOIs(
  coords: Coordinates,
  types: POIType[],
  radiusMeters?: number
): Promise<OverpassPOI[]> {
  const results = await Promise.all(
    types.map((t) => searchNearbyPOIs(coords, t, radiusMeters).catch(() => [] as OverpassPOI[]))
  );
  return results
    .flat()
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RESULTS);
}

/**
 * Retourne l'emoji associé à un type de POI.
 */
export function getPOIEmoji(type: POIType): string {
  return POI_CONFIGS[type]?.emoji || "📍";
}

/**
 * Retourne le label français associé à un type de POI.
 */
export function getPOILabel(type: POIType): string {
  return POI_CONFIGS[type]?.label || "Lieu";
}
