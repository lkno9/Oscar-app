import { Phone, Copy, ExternalLink, Check, MapPin, Globe, X, Maximize2, Loader2, Send, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { RichCard, WeatherData, TranslationData, MapData, DirectionsData, EmergencyData, WebViewData, LinkPreviewData, DemarcheCardData, FamilyMessageForwardData } from "@/types/chat";
import { DemarcheCard } from "@/components/chat/DemarcheCard";

export function RichCardRenderer({ card }: { card: RichCard }) {
  switch (card.type) {
    case "weather":
      return <WeatherCard data={card.data} />;
    case "translation":
      return <TranslationCard data={card.data} />;
    case "map":
      return <MapCard data={card.data} />;
    case "directions":
      return <DirectionsCard data={card.data} />;
    case "emergency":
      return <EmergencyCard data={card.data} />;
    case "webview":
      return <WebViewCard data={card.data} />;
    case "link_preview":
      return <LinkPreviewCard data={card.data} />;
    case "demarche":
      return <DemarcheCard data={card.data} />;
    case "family_message_forward":
      return <FamilyMessageForwardCard data={card.data} />;
    default:
      return null;
  }
}

// ─── Family Message Forward Card ────────────────────────────

function FamilyMessageForwardCard({ data }: { data: FamilyMessageForwardData }) {
  const navigate = useNavigate();

  const handleSend = () => {
    navigate('/services/communication', {
      state: { prefill: data.messageText, contactName: data.contactName }
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Message pour {data.contactName || 'votre proche'}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-foreground bg-white/60 rounded-lg p-3 border border-primary/10 leading-relaxed">
          {data.messageText}
        </p>
      </div>
      <div className="px-4 pb-3">
        <button
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          Envoyer à {data.contactName || 'un proche'}
        </button>
      </div>
    </div>
  );
}

// ─── Weather Card ───────────────────────────────────────────

function WeatherCard({ data }: { data: WeatherData }) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/30">
      {/* Current weather */}
      <div className="px-4 py-3 flex items-center gap-4">
        <span className="text-4xl">{data.emoji}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">{data.temp}°C</span>
            <span className="text-sm text-blue-600 dark:text-blue-400">{data.condition}</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {data.city}
          </p>
        </div>
      </div>

      {/* Forecast */}
      {data.forecast.length > 0 && (
        <div className="border-t border-blue-200 dark:border-blue-800 px-4 py-2.5 flex gap-1">
          {data.forecast.map((day, i) => (
            <div key={i} className="flex-1 text-center py-1.5">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{day.day}</p>
              <p className="text-lg my-0.5">{day.emoji}</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">{day.max}°</span>
                <span className="text-blue-500 dark:text-blue-400 mx-0.5">/</span>
                <span>{day.min}°</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Translation Card ───────────────────────────────────────

function TranslationCard({ data }: { data: TranslationData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-primary/10 flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        <span>{data.sourceLang}</span>
        <span className="text-primary">→</span>
        <span className="font-medium text-foreground">{data.targetLang}</span>
      </div>

      {/* Source text */}
      <div className="px-4 py-2.5 border-b border-primary/10">
        <p className="text-sm text-muted-foreground italic">{data.source}</p>
      </div>

      {/* Translation result */}
      <div className="px-4 py-3 flex items-start gap-3">
        <p className="flex-1 text-base font-medium text-foreground leading-relaxed">{data.result}</p>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-primary/10 transition-colors"
          aria-label="Copier"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Map Card ───────────────────────────────────────────────

function MapCard({ data }: { data: MapData }) {
  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden bg-card">
      {/* Map iframe */}
      <div className="w-full h-[250px] bg-muted">
        <iframe
          src={data.embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Carte: ${data.address}`}
        />
      </div>

      {/* Address + action */}
      <div className="px-4 py-3 flex items-center gap-3">
        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="flex-1 text-sm text-foreground font-medium">{data.address}</p>
        <button
          onClick={() => window.open(data.mapsUrl, "_blank")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ouvrir
        </button>
      </div>
    </div>
  );
}

// ─── Directions Card (Google Maps) ──────────────────────────

function DirectionsCard({ data }: { data: DirectionsData }) {
  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden bg-card">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-green-500/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {data.origin} → {data.destination}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">Itinéraire via Google Maps</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <a
          href={data.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all active:scale-[0.98] no-underline"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir l'itinéraire dans Google Maps
        </a>
      </div>
    </div>
  );
}

// ─── Emergency Card ─────────────────────────────────────────

function EmergencyCard({ data }: { data: EmergencyData }) {
  return (
    <div className="mt-3 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-red-800 dark:text-red-200 text-base">{data.name}</p>
        <p className="text-sm text-red-600 dark:text-red-400">{data.description}</p>
      </div>
      <a
        href={`tel:${data.number.replace(/\s/g, "")}`}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg transition-colors flex-shrink-0"
      >
        <Phone className="w-5 h-5" />
        {data.number}
      </a>
    </div>
  );
}

// ─── Sites known to block iframes (X-Frame-Options / CSP) ───
const IFRAME_BLOCKED_DOMAINS = [
  // Government / health
  "ameli.fr", "impots.gouv.fr", "caf.fr", "doctolib.fr",
  "monespacedesante.fr", "mesdroitssociaux.gouv.fr",
  "pour-les-personnes-agees.gouv.fr", "france-services.gouv.fr",
  "service-public.fr",
  // Search / video / major platforms (block or render blank in iframes)
  "google.com", "google.fr", "youtube.com", "youtu.be",
  "dailymotion.com", "vimeo.com",
  // Social media
  "facebook.com", "instagram.com", "twitter.com", "x.com",
  "linkedin.com", "tiktok.com", "snapchat.com", "pinterest.com",
  // Transport / lifestyle (commonly block iframes)
  "sncf-connect.com", "ratp.fr", "allocine.fr",
  "meteofrance.com", "leboncoin.fr", "amazon.fr", "amazon.com",
  // Banking / sensitive
  "labanquepostale.fr", "credit-agricole.fr", "bnpparibas.fr",
  "societegenerale.fr", "lcl.fr", "boursorama.com",
];

function isDomainBlocked(domain: string): boolean {
  return IFRAME_BLOCKED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
}

// ─── WebView Card (Atlas-like) ──────────────────────────────

function WebViewCard({ data }: { data: WebViewData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeStatus, setIframeStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const domain = (() => {
    try { return new URL(data.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  })();

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  // Check if domain is known to block iframes
  const knownBlocked = isDomainBlocked(domain);

  const handleIframeLoad = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeStatus("loaded");
  }, []);

  // Timer-based detection: if iframe hasn't fired onload after 5s, likely blocked
  useEffect(() => {
    if (knownBlocked) {
      setIframeStatus("blocked");
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setIframeStatus((prev) => (prev === "loading" ? "blocked" : prev));
    }, 5000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [knownBlocked]);

  // ─── Blocked/Fallback card ───
  if (iframeStatus === "blocked") {
    return (
      <div className="mt-3 rounded-xl border border-border overflow-hidden bg-card">
        {/* Rich fallback with favicon, title, domain, description */}
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
            <img
              src={faviconUrl}
              alt=""
              className="w-7 h-7"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{data.title}</p>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{domain}</p>
          </div>
          <button
            onClick={() => window.open(data.url, "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Ouvrir le site
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 rounded-xl border border-border overflow-hidden bg-card">
        {/* Title bar */}
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-muted/50">
          <img
            src={faviconUrl}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="flex-1 text-sm font-medium text-foreground truncate">{data.title}</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">{domain}</span>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 rounded hover:bg-secondary transition-colors"
            aria-label="Agrandir"
          >
            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => window.open(data.url, "_blank")}
            className="p-1 rounded hover:bg-secondary transition-colors"
            aria-label="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Iframe + loading overlay */}
        <div className="w-full h-[350px] bg-muted/30 relative">
          {iframeStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Chargement de {domain}...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={data.url}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            sandbox="allow-scripts allow-popups"
            loading="lazy"
            title={data.title}
            onLoad={handleIframeLoad}
            onError={() => setIframeStatus("blocked")}
          />
        </div>
      </div>

      {/* Fullscreen modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5 rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="flex-1 font-semibold text-foreground truncate">{data.title}</span>
            <span className="text-sm text-muted-foreground mr-2">{domain}</span>
            <button
              onClick={() => window.open(data.url, "_blank")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1">
            <iframe
              src={data.url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              sandbox="allow-scripts allow-popups allow-forms"
              title={data.title}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Link Preview Card (auto-detected URLs) ─────────────────

function LinkPreviewCard({ data }: { data: LinkPreviewData }) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all px-3.5 py-3 group no-underline"
    >
      {/* Favicon */}
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
        {data.favicon ? (
          <img
            src={data.favicon}
            alt=""
            className="w-6 h-6"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Globe className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {data.title}
        </p>
        {data.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{data.description}</p>
        )}
        <p className="text-sm text-muted-foreground/70 truncate mt-0.5">{data.domain}</p>
      </div>

      {/* Arrow */}
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </a>
  );
}
