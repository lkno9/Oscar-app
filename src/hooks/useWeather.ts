import { useState, useEffect } from "react";

export interface WeatherData {
  temperature: number;
  description: string;
  emoji: string;
}

// WMO Weather interpretation codes → French + emoji
function parseWeatherCode(code: number): { description: string; emoji: string } {
  if (code === 0) return { description: "Ensoleillé", emoji: "☀️" };
  if (code === 1) return { description: "Peu nuageux", emoji: "🌤️" };
  if (code === 2) return { description: "Partiellement nuageux", emoji: "⛅" };
  if (code === 3) return { description: "Nuageux", emoji: "☁️" };
  if (code === 45 || code === 48) return { description: "Brouillard", emoji: "🌫️" };
  if (code >= 51 && code <= 55) return { description: "Bruine", emoji: "🌦️" };
  if (code >= 61 && code <= 65) return { description: "Pluie", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Neige", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { description: "Averses", emoji: "🌦️" };
  if (code === 85 || code === 86) return { description: "Neige", emoji: "🌨️" };
  if (code === 95) return { description: "Orageux", emoji: "⛈️" };
  if (code === 96 || code === 99) return { description: "Grêle", emoji: "⛈️" };
  return { description: "Variable", emoji: "🌈" };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache (15 min)
    const cached = localStorage.getItem("oscar_weather");
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 15 * 60 * 1000) {
          setWeather(data);
          setLoading(false);
          return;
        }
      } catch {
        // ignore invalid cache
      }
    }

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current=temperature_2m,weather_code&timezone=auto`
          );
          if (!res.ok) throw new Error("API error");
          const json = await res.json();
          const temp = Math.round(json.current.temperature_2m);
          const code = json.current.weather_code;
          const { description, emoji } = parseWeatherCode(code);
          const data: WeatherData = { temperature: temp, description, emoji };
          setWeather(data);
          localStorage.setItem("oscar_weather", JSON.stringify({ data, timestamp: Date.now() }));
        } catch {
          // silently fail — widget won't show
        } finally {
          setLoading(false);
        }
      },
      () => {
        // Permission refusée — pas grave
        setLoading(false);
      },
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  return { weather, loading };
}
