export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  emoji: string;
  humidity?: number;
  wind?: string;
  forecast: { day: string; min: number; max: number; emoji: string }[];
}

export interface TranslationData {
  source: string;
  result: string;
  sourceLang: string;
  targetLang: string;
}

export interface MapData {
  address: string;
  embedUrl: string;
  mapsUrl: string;
}

export interface EmergencyData {
  name: string;
  number: string;
  description: string;
}

export interface WebViewData {
  url: string;
  title: string;
}

export interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  domain: string;
}

export interface DemarcheCardData {
  templateId: string;
  label: string;
  recipient: string;
  generatedText: string;
  subject: string;
  status: "brouillon" | "copie" | "ouvert_email" | "sauvegarde";
}

export interface DirectionsData {
  origin: string;
  destination: string;
  googleMapsUrl: string;
}

export interface FamilyMessageForwardData {
  messageText: string;
  contactName?: string;
}

export type RichCard =
  | { type: "weather"; data: WeatherData }
  | { type: "translation"; data: TranslationData }
  | { type: "map"; data: MapData }
  | { type: "directions"; data: DirectionsData }
  | { type: "emergency"; data: EmergencyData }
  | { type: "webview"; data: WebViewData }
  | { type: "link_preview"; data: LinkPreviewData }
  | { type: "demarche"; data: DemarcheCardData }
  | { type: "family_message_forward"; data: FamilyMessageForwardData };
