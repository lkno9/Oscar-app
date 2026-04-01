import {
  ArrowLeft, Languages, Cloud, MapPin, Calculator,
  Wrench, Timer, Copy, Check, ArrowLeftRight,
  Play, Pause, RotateCcw, ChevronDown, ChevronUp, LocateFixed, Bell,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── STATIC DATA ────────────────────────────────────────────────────

const TRANSLATE_LANGS = [
  { code: "en", label: "Anglais" },
  { code: "es", label: "Espagnol" },
  { code: "de", label: "Allemand" },
  { code: "it", label: "Italien" },
  { code: "pt", label: "Portugais" },
  { code: "ar", label: "Arabe" },
  { code: "zh", label: "Chinois" },
  { code: "ja", label: "Japonais" },
  { code: "ko", label: "Coréen" },
  { code: "ru", label: "Russe" },
  { code: "pl", label: "Polonais" },
  { code: "nl", label: "Néerlandais" },
  { code: "sv", label: "Suédois" },
  { code: "da", label: "Danois" },
  { code: "no", label: "Norvégien" },
  { code: "fi", label: "Finnois" },
  { code: "el", label: "Grec" },
  { code: "tr", label: "Turc" },
  { code: "hi", label: "Hindi" },
  { code: "th", label: "Thaï" },
  { code: "vi", label: "Vietnamien" },
  { code: "ro", label: "Roumain" },
  { code: "cs", label: "Tchèque" },
  { code: "hu", label: "Hongrois" },
  { code: "uk", label: "Ukrainien" },
  { code: "he", label: "Hébreu" },
  { code: "id", label: "Indonésien" },
];

const TIMER_PRESETS = [
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
  { label: "1 h", seconds: 3600 },
  { label: "2 h", seconds: 7200 },
  { label: "4 h", seconds: 14400 },
];

const WEATHER_EMOJIS: Record<string, string> = {
  "Sunny": "☀️", "Clear": "🌙", "Partly cloudy": "⛅", "Cloudy": "☁️",
  "Overcast": "☁️", "Mist": "🌫️", "Fog": "🌫️", "Light rain": "🌦️",
  "Rain": "🌧️", "Heavy rain": "🌧️", "Light snow": "🌨️", "Snow": "❄️",
  "Thunderstorm": "⛈️", "Patchy rain possible": "🌦️",
  "Patchy light rain": "🌦️", "Moderate rain": "🌧️",
  "Light drizzle": "🌦️", "Patchy snow possible": "🌨️",
};

function getWeatherEmoji(desc: string): string {
  for (const [key, emoji] of Object.entries(WEATHER_EMOJIS)) {
    if (desc.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "🌤️";
}

const TOOLS = [
  {
    category: "Communication",
    items: [
      { name: "Traducteur", desc: "Traduire dans plus de 25 langues", emoji: "🌍", icon: Languages, url: null as string | null, builtin: "translator" as const },
    ],
  },
  {
    category: "Vie quotidienne",
    items: [
      { name: "Météo", desc: "Prévisions météo de votre ville", emoji: "☀️", icon: Cloud, url: null as string | null, builtin: "weather" as const },
      { name: "Calculatrice", desc: "Calculs simples", emoji: "🔢", icon: Calculator, url: null as string | null, builtin: "calculator" as const },
      { name: "Minuteur & Alarme", desc: "Compte à rebours jusqu'à 4h", emoji: "⏱️", icon: Timer, url: null as string | null, builtin: "timer" as const },
      { name: "Convertisseur", desc: "Température, poids, distance", emoji: "📐", icon: ArrowLeftRight, url: null as string | null, builtin: "converter" as const },
    ],
  },
  {
    category: "Sécurité & Localisation",
    items: [
      { name: "Ma position", desc: "Voir et partager votre position", emoji: "📍", icon: MapPin, url: null as string | null, builtin: "location" as const },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────
export function ToolsPage() {
  const goBack = useBackNavigation();
  const [openTool, setOpenTool] = useState<string | null>(null);

  // Calculator state
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Translator state
  const [transText, setTransText] = useState("");
  const [transLang, setTransLang] = useState("en");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [transCopied, setTransCopied] = useState(false);

  // Weather state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weatherData, setWeatherData] = useState<Record<string, any> | null>(null);
  const [weatherCity, setWeatherCity] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Location state
  const [locationText, setLocationText] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationCopied, setLocationCopied] = useState(false);

  // Converter state
  const [convCategory, setConvCategory] = useState<"temperature" | "weight" | "distance">("temperature");
  const [convInput, setConvInput] = useState("");
  const [convResult, setConvResult] = useState<string | null>(null);
  const [convDirection, setConvDirection] = useState(0); // index of conversion pair

  const conversionPairs = {
    temperature: [
      { label: "°C → °F", from: "°C", to: "°F", fn: (v: number) => v * 9 / 5 + 32 },
      { label: "°F → °C", from: "°F", to: "°C", fn: (v: number) => (v - 32) * 5 / 9 },
    ],
    weight: [
      { label: "kg → lbs", from: "kg", to: "lbs", fn: (v: number) => v * 2.20462 },
      { label: "lbs → kg", from: "lbs", to: "kg", fn: (v: number) => v / 2.20462 },
      { label: "g → oz", from: "g", to: "oz", fn: (v: number) => v * 0.035274 },
      { label: "oz → g", from: "oz", to: "g", fn: (v: number) => v / 0.035274 },
    ],
    distance: [
      { label: "km → miles", from: "km", to: "miles", fn: (v: number) => v * 0.621371 },
      { label: "miles → km", from: "miles", to: "km", fn: (v: number) => v / 0.621371 },
      { label: "m → pieds", from: "m", to: "pieds", fn: (v: number) => v * 3.28084 },
      { label: "pieds → m", from: "pieds", to: "m", fn: (v: number) => v / 3.28084 },
      { label: "cm → pouces", from: "cm", to: "pouces", fn: (v: number) => v * 0.393701 },
      { label: "pouces → cm", from: "pouces", to: "cm", fn: (v: number) => v / 0.393701 },
    ],
  };

  // ── Handlers ──

  const toggleTool = (name: string) => {
    setOpenTool(prev => prev === name ? null : name);
  };

  // Safe math expression evaluator (no eval/new Function)
  const safeEvaluate = (expr: string): number => {
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) throw new Error("Invalid");
    let pos = 0;
    const parseExpr = (): number => {
      let result = parseTerm();
      while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
        const op = tokens[pos++];
        const right = parseTerm();
        result = op === "+" ? result + right : result - right;
      }
      return result;
    };
    const parseTerm = (): number => {
      let result = parseFactor();
      while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
        const op = tokens[pos++];
        const right = parseFactor();
        result = op === "*" ? result * right : result / right;
      }
      return result;
    };
    const parseFactor = (): number => {
      if (tokens[pos] === "(") { pos++; const r = parseExpr(); if (tokens[pos] === ")") pos++; return r; }
      if (tokens[pos] === "-") { pos++; return -parseFactor(); }
      return parseFloat(tokens[pos++]);
    };
    const result = parseExpr();
    if (pos < tokens.length) throw new Error("Unexpected token");
    return result;
  };

  const handleCalc = () => {
    try {
      const sanitized = calcInput.replace(/[^0-9+\-*/.() ]/g, "").trim();
      if (!sanitized) return;
      const result = safeEvaluate(sanitized);
      setCalcResult(isNaN(result) || !isFinite(result) ? "Erreur de calcul" : String(result));
    } catch {
      setCalcResult("Erreur de calcul");
    }
  };

  // Translator
  const handleTranslate = async () => {
    if (!transText.trim()) { toast.error("Entrez un texte à traduire"); return; }
    setTransLoading(true);
    setTransResult("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-translate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: transText, targetLang: transLang, sourceLang: "fr" }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTransResult(data.translation);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de traduction");
    } finally {
      setTransLoading(false);
    }
  };

  const copyTranslation = () => {
    navigator.clipboard.writeText(transResult);
    setTransCopied(true);
    setTimeout(() => setTransCopied(false), 2000);
    toast.success("Traduction copiée !");
  };

  // Weather — with precise geocoding via Nominatim first
  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number, displayName: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1&lang=fr`);
      if (!res.ok) throw new Error("Météo non disponible");
      const data = await res.json();
      setWeatherData(data);
      setWeatherCity(displayName);
    } catch {
      setWeatherError("Impossible de charger la météo.");
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async (city: string) => {
    if (!city.trim()) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // Step 1: Geocode the city name to precise coordinates via Nominatim
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=fr`
      );
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        setWeatherError("Ville non trouvée. Vérifiez l'orthographe.");
        setWeatherData(null);
        setWeatherLoading(false);
        return;
      }

      const { lat, lon, display_name } = geoData[0];
      // Extract clean city name from display_name (first part before comma)
      const cleanName = display_name.split(",")[0].trim();
      setWeatherCity(cleanName);

      // Step 2: Fetch weather using precise coordinates
      await fetchWeatherByCoords(parseFloat(lat), parseFloat(lon), cleanName);
    } catch {
      setWeatherError("Impossible de charger la météo. Vérifiez le nom de la ville.");
      setWeatherData(null);
      setWeatherLoading(false);
    }
  }, [fetchWeatherByCoords]);

  const handleWeatherAutoDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non disponible");
      return;
    }
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode to get city name
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
          );
          const geoData = await geoRes.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.municipality || "Paris";
          await fetchWeatherByCoords(latitude, longitude, city);
        } catch {
          setWeatherLoading(false);
          toast.error("Impossible de détecter votre position.");
        }
      },
      () => {
        setWeatherLoading(false);
        toast.error("Position non disponible. Entrez votre ville.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Timer with notification support
  const playAlarmSound = () => {
    try {
      const ctx = new AudioContext();
      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.4;
        osc.start(ctx.currentTime + i * 0.6);
        osc.stop(ctx.currentTime + i * 0.6 + 0.4);
      }
      setTimeout(() => ctx.close(), 3000);
    } catch { /* silent fallback */ }
  };

  const sendTimerNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Oscar — Minuteur terminé !", {
        body: "Votre minuteur est arrivé à zéro.",
        icon: "/favicon.ico",
      });
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            playAlarmSound();
            sendTimerNotification();
            toast.success("⏰ Temps écoulé !", { duration: 15000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerRemaining]);

  const startCustomTimer = () => {
    const h = parseInt(customHours) || 0;
    const m = parseInt(customMinutes) || 0;
    const total = h * 3600 + m * 60;
    if (total <= 0) { toast.error("Entrez une durée valide"); return; }
    if (total > 24 * 3600) { toast.error("Maximum 24 heures"); return; }
    requestNotificationPermission();
    setTimerSeconds(total);
    setTimerRemaining(total);
    setTimerRunning(true);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Location
  const handleLocation = () => {
    if (!navigator.geolocation) {
      setLocationText("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    setLoadingLocation(true);
    setLocationText(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ lat: latitude, lon: longitude });
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
          );
          const geoData = await geoRes.json();
          const addr = geoData.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocationText(addr);
        } catch {
          setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setLoadingLocation(false);
      },
      () => {
        setLocationText("Impossible d'obtenir votre position. Vérifiez les permissions.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleShareLocation = () => {
    if (!locationCoords) return;
    window.open(`https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lon}`, "_blank");
  };

  const handleCopyLocation = () => {
    if (!locationText) return;
    navigator.clipboard.writeText(locationText);
    setLocationCopied(true);
    setTimeout(() => setLocationCopied(false), 2000);
    toast.success("Adresse copiée !");
  };

  // Converter
  const handleConvert = () => {
    const value = parseFloat(convInput);
    if (isNaN(value)) { setConvResult(null); return; }
    const pairs = conversionPairs[convCategory];
    const pair = pairs[convDirection % pairs.length];
    const result = pair.fn(value);
    setConvResult(`${value} ${pair.from} = ${result.toFixed(2)} ${pair.to}`);
  };

  const handleToolClick = (tool: typeof TOOLS[0]["items"][0]) => {
    if (tool.url) {
      window.open(tool.url, "_blank");
    } else if ("builtin" in tool) {
      if (tool.builtin === "location") {
        handleLocation();
        toggleTool("location");
      } else if (tool.builtin === "weather" && openTool !== "weather") {
        handleWeatherAutoDetect();
        toggleTool("weather");
      } else {
        toggleTool(tool.builtin);
      }
    }
  };

  // ── Render ──

  const renderBuiltin = (builtin: string) => {
    if (openTool !== builtin) return null;

    switch (builtin) {
      case "calculator":
        return (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-3">
            <input
              type="text"
              value={calcInput}
              onChange={e => setCalcInput(e.target.value)}
              placeholder="Ex: 125 + 37.50"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-lg"
              onKeyDown={e => e.key === "Enter" && handleCalc()}
            />
            <Button className="w-full" onClick={handleCalc}>Calculer</Button>
            {calcResult && (
              <p className="text-center text-xl font-bold text-primary">{calcResult}</p>
            )}
          </div>
        );

      case "translator":
        return (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-3">
            <textarea
              value={transText}
              onChange={e => setTransText(e.target.value)}
              placeholder="Entrez votre texte en français..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground text-base resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Traduire en :</span>
              <select
                value={transLang}
                onChange={e => setTransLang(e.target.value)}
                className="flex-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                {TRANSLATE_LANGS.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <Button className="w-full gap-2" onClick={handleTranslate} disabled={transLoading}>
              <Languages className="w-4 h-4" />
              {transLoading ? "Traduction en cours..." : "Traduire"}
            </Button>
            {transResult && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <p className="text-base text-foreground whitespace-pre-wrap">{transResult}</p>
                <button
                  onClick={copyTranslation}
                  className="mt-2 flex items-center gap-1.5 text-sm text-primary font-medium"
                >
                  {transCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {transCopied ? "Copié !" : "Copier la traduction"}
                </button>
              </div>
            )}
          </div>
        );

      case "weather":
        return (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={weatherCity}
                onChange={e => setWeatherCity(e.target.value)}
                placeholder="Votre ville (ex: Le Mans)..."
                className="flex-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                onKeyDown={e => e.key === "Enter" && fetchWeather(weatherCity)}
              />
              <Button size="sm" onClick={() => fetchWeather(weatherCity)} disabled={weatherLoading || !weatherCity.trim()}>
                {weatherLoading ? "..." : "OK"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleWeatherAutoDetect} disabled={weatherLoading} title="Détecter ma position">
                <LocateFixed className="w-4 h-4" />
              </Button>
            </div>

            {weatherError && <p className="text-sm text-destructive">{weatherError}</p>}

            {weatherData && (
              <div className="space-y-3">
                {/* Current */}
                <div className="flex items-center gap-4">
                  <span className="text-5xl">
                    {getWeatherEmoji(weatherData.current_condition?.[0]?.weatherDesc?.[0]?.value || "")}
                  </span>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {weatherData.current_condition?.[0]?.temp_C}°C
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {weatherData.current_condition?.[0]?.lang_fr?.[0]?.value || weatherData.current_condition?.[0]?.weatherDesc?.[0]?.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ressenti {weatherData.current_condition?.[0]?.FeelsLikeC}°C
                    </p>
                  </div>
                </div>

                {/* 3-day forecast */}
                <div className="grid grid-cols-3 gap-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {weatherData.weather?.slice(0, 3).map((day: any, i: number) => {
                    const date = new Date(day.date);
                    const dayName = i === 0 ? "Auj." : date.toLocaleDateString("fr-FR", { weekday: "short" });
                    return (
                      <div key={i} className="bg-secondary rounded-lg p-2.5 text-center">
                        <p className="text-sm font-semibold text-foreground capitalize">{dayName}</p>
                        <p className="text-lg my-1">
                          {getWeatherEmoji(day.hourly?.[4]?.weatherDesc?.[0]?.value || "")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{day.maxtempC}°</span> / {day.mintempC}°
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "timer":
        return (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-4">
            {timerSeconds === 0 ? (
              <>
                <p className="text-sm text-muted-foreground">Durées rapides :</p>
                <div className="flex flex-wrap gap-2">
                  {TIMER_PRESETS.map(p => (
                    <button
                      key={p.seconds}
                      onClick={() => {
                        requestNotificationPermission();
                        setTimerSeconds(p.seconds);
                        setTimerRemaining(p.seconds);
                        setTimerRunning(true);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground font-medium text-sm hover:border-primary transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    Durée personnalisée :
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={customHours}
                        onChange={e => setCustomHours(e.target.value)}
                        placeholder="0"
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-center text-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-1">heures</p>
                    </div>
                    <span className="text-xl font-bold text-muted-foreground">:</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customMinutes}
                        onChange={e => setCustomMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-center text-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-1">minutes</p>
                    </div>
                    <Button onClick={startCustomTimer} className="self-start">
                      <Play className="w-4 h-4 mr-1" />
                      Go
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-5xl font-bold text-foreground tracking-wider">
                  {formatTime(timerRemaining)}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    variant={timerRunning ? "outline" : "default"}
                    onClick={() => setTimerRunning(!timerRunning)}
                  >
                    {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {timerRunning ? "Pause" : timerRemaining < timerSeconds ? "Reprendre" : "Démarrer"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => { setTimerRunning(false); setTimerSeconds(0); setTimerRemaining(0); setCustomHours(""); setCustomMinutes(""); }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                {timerRemaining === 0 && timerSeconds > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">⏰ Temps écoulé !</p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "converter":
        return (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-3">
            {/* Category tabs */}
            <div className="flex gap-2">
              {(["temperature", "weight", "distance"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setConvCategory(cat); setConvDirection(0); setConvResult(null); setConvInput(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    convCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat === "temperature" ? "🌡️ Temp." : cat === "weight" ? "⚖️ Poids" : "📏 Distance"}
                </button>
              ))}
            </div>

            {/* Conversion direction */}
            <div className="flex flex-wrap gap-1.5">
              {conversionPairs[convCategory].map((pair, i) => (
                <button
                  key={i}
                  onClick={() => { setConvDirection(i); setConvResult(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    convDirection === i
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground border border-transparent"
                  }`}
                >
                  {pair.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="number"
                value={convInput}
                onChange={e => setConvInput(e.target.value)}
                placeholder={`Valeur en ${conversionPairs[convCategory][convDirection % conversionPairs[convCategory].length].from}`}
                className="flex-1 p-3 rounded-lg border border-border bg-background text-foreground text-lg"
                onKeyDown={e => e.key === "Enter" && handleConvert()}
              />
              <Button onClick={handleConvert}>Convertir</Button>
            </div>

            {convResult && (
              <p className="text-center text-lg font-bold text-primary">{convResult}</p>
            )}
          </div>
        );

      case "location":
        return locationText || loadingLocation ? (
          <div className="bg-card rounded-xl p-4 border border-border mt-2 space-y-3">
            {loadingLocation ? (
              <p className="text-sm text-muted-foreground">Recherche de votre position...</p>
            ) : (
              <>
                <p className="text-sm text-foreground leading-relaxed">{locationText}</p>
                {!locationText?.startsWith("Impossible") && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleShareLocation}>
                      <MapPin className="w-4 h-4" />
                      Google Maps
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLocation}>
                      {locationCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {locationCopied ? "Copié !" : "Copier"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Outils pratiques</h1>
          <p className="text-sm text-muted-foreground">Vos outils du quotidien</p>
        </div>
        <Wrench className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {TOOLS.map((cat, ci) => (
          <section key={ci}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {cat.category}
            </h2>
            <div className="space-y-3">
              {cat.items.map((tool, i) => (
                <div key={i}>
                  <button
                    onClick={() => handleToolClick(tool)}
                    className={`w-full bg-card rounded-xl p-4 border flex items-center gap-4 transition-all text-left ${
                      "builtin" in tool && openTool === tool.builtin
                        ? "border-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {tool.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{tool.desc}</p>
                    </div>
                    {"builtin" in tool && openTool === tool.builtin ? (
                      <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>

                  {"builtin" in tool && renderBuiltin(tool.builtin)}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Tip Oscar */}
        <div className="bg-accent rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Vous pouvez aussi demander directement à <span className="font-semibold text-foreground">Oscar</span> depuis la conversation : "Quel temps fait-il ?", "Traduis-moi ça en anglais", "Mets un minuteur de 2 heures"...
          </p>
        </div>
      </div>
    </div>
  );
}
