// --- Types ---
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeoAddress {
  coords: Coordinates;
  displayName: string;
  city: string;
  postcode?: string;
}

// --- Géolocalisation navigateur ---

/**
 * Récupère la position actuelle via le Geolocation API du navigateur.
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur votre appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) {
          const e = Object.assign(new Error("Vous avez refusé l'accès à votre position."), { isDenied: true });
          reject(e);
        }
        else if (err.code === 2) reject(new Error("Position indisponible."));
        else reject(new Error("Délai dépassé pour obtenir votre position."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// --- Géocodage Nominatim (OpenStreetMap) ---

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const NOMINATIM_HEADERS = { "User-Agent": "Oscar-SeniorApp/1.0", Accept: "application/json" };

/**
 * Convertit des coordonnées en adresse lisible (reverse geocoding).
 */
export async function reverseGeocode(coords: Coordinates): Promise<GeoAddress> {
  const res = await fetch(
    `${NOMINATIM_BASE}/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json&accept-language=fr`,
    { headers: NOMINATIM_HEADERS }
  );
  if (!res.ok) throw new Error("Impossible de déterminer votre adresse.");
  const data = await res.json();
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
  return {
    coords,
    displayName: data.display_name || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
    city,
    postcode: addr.postcode,
  };
}

/**
 * Convertit une adresse/ville en coordonnées (forward geocoding).
 */
export async function forwardGeocode(query: string): Promise<Coordinates | null> {
  const res = await fetch(
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=fr&accept-language=fr`,
    { headers: NOMINATIM_HEADERS }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// --- Calcul de distance ---

/**
 * Calcule la distance en mètres entre deux points (formule de Haversine).
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // rayon Terre en mètres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Formate une distance pour l'affichage : "350 m" ou "1,2 km".
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}

/**
 * Construit une URL Google Maps Directions.
 */
export function googleMapsDirectionsUrl(
  destination: Coordinates | string,
  origin?: Coordinates | string,
  mode: "walking" | "transit" | "driving" = "walking"
): string {
  const destStr = typeof destination === "string" ? destination : `${destination.lat},${destination.lon}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destStr)}&travelmode=${mode}`;
  if (origin) {
    const originStr = typeof origin === "string" ? origin : `${origin.lat},${origin.lon}`;
    url += `&origin=${encodeURIComponent(originStr)}`;
  }
  return url;
}
