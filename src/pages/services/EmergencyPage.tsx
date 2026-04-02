import { ArrowLeft, AlertTriangle, Phone, MapPin, Users, Plus, UserPlus, ChevronDown, ChevronUp, Loader2, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCurrentPosition, formatDistance, googleMapsDirectionsUrl } from "@/lib/geo";
import { searchNearbyPOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
}

const ESSENTIAL_NUMBERS = [
  {
    category: "Urgences vitales",
    emoji: "🚨",
    numbers: [
      { name: "SAMU", number: "15", desc: "Urgences médicales" },
      { name: "Pompiers", number: "18", desc: "Incendie, accident" },
      { name: "Police secours", number: "17", desc: "Police nationale" },
      { name: "Urgences Europe", number: "112", desc: "Numéro européen unique" },
      { name: "Urgence SMS", number: "114", desc: "Pour personnes sourdes ou malentendantes" },
    ],
  },
  {
    category: "Santé",
    emoji: "🏥",
    numbers: [
      { name: "Pharmacie de garde", number: "3237", desc: "Trouver une pharmacie ouverte (0.35€/min)" },
      { name: "SOS Médecins", number: "3624", desc: "Médecin à domicile, jour et nuit" },
      { name: "Centre antipoison", number: "01 40 05 48 48", desc: "En cas d'intoxication" },
      { name: "Urgences dentaires", number: "01 43 37 51 00", desc: "SOS Dentaire (appeler pour votre ville)" },
    ],
  },
  {
    category: "Aide & écoute",
    emoji: "🤝",
    numbers: [
      { name: "Solitud'écoute", number: "0 800 47 47 88", desc: "Solitude des personnes âgées (gratuit)" },
      { name: "Maltraitance personnes âgées", number: "3977", desc: "Signaler une situation de maltraitance" },
      { name: "SOS Amitié", number: "09 72 39 40 50", desc: "Écoute et soutien moral 24h/24" },
      { name: "Croix-Rouge écoute", number: "0 800 858 858", desc: "Soutien psychologique gratuit" },
    ],
  },
  {
    category: "Vie quotidienne & services",
    emoji: "📞",
    numbers: [
      { name: "Info Service Public", number: "3939", desc: "Questions administratives (0.15€/min)" },
      { name: "Assurance Maladie", number: "3646", desc: "Ameli, remboursements, droits" },
      { name: "Info retraite", number: "0 970 660 660", desc: "Questions sur votre retraite" },
      { name: "CAF", number: "3230", desc: "Caisse d'Allocations Familiales" },
      { name: "Impôts", number: "0 809 401 401", desc: "Questions fiscales (gratuit)" },
      { name: "EDF / Enedis", number: "09 69 32 15 15", desc: "Panne, facture, contrat" },
      { name: "Eau - Véolia", number: "0 969 369 900", desc: "Urgence eau / fuite" },
    ],
  },
  {
    category: "Sécurité & arnaques",
    emoji: "🛡️",
    numbers: [
      { name: "Info Escroqueries", number: "0 805 805 817", desc: "Signaler une arnaque (gratuit)" },
      { name: "Signal Spam", number: "33700", desc: "Signaler un SMS frauduleux par SMS" },
      { name: "Cybermalveillance", number: "0 800 730 340", desc: "Aide en cas de piratage" },
    ],
  },
  {
    category: "Transports",
    emoji: "🚌",
    numbers: [
      { name: "SNCF", number: "3635", desc: "Trains, réservations, information" },
      { name: "Aide en gare", number: "3117", desc: "Sûreté dans les transports" },
      { name: "RATP", number: "3424", desc: "Métro, bus, RER Île-de-France" },
    ],
  },
];

export function EmergencyPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<string[]>(["Urgences vitales"]);

  // Recherche à proximité
  const [nearbyPOIs, setNearbyPOIs] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySearched, setNearbySearched] = useState(false);
  const [nearbyType, setNearbyType] = useState<POIType>("hospital");

  const searchNearbyEmergency = async (type?: POIType) => {
    const searchType = type || nearbyType;
    setNearbyLoading(true);
    setNearbyPOIs([]);
    try {
      const coords = await getCurrentPosition();
      const radius = searchType === "hospital" ? 10000 : searchType === "police" ? 5000 : 3000;
      const results = await searchNearbyPOIs(coords, searchType, radius);
      setNearbyPOIs(results);
      setNearbySearched(true);
      if (results.length === 0) toast("Aucun résultat trouvé à proximité.");
    } catch (err: any) {
      toast.error(err.message || "Impossible d'obtenir votre position.");
    } finally {
      setNearbyLoading(false);
    }
  };

  const nationalEmergencies = [
    { id: 1, name: "SAMU", number: "15", description: "Urgences médicales" },
    { id: 2, name: "Pompiers", number: "18", description: "Incendie, accident" },
    { id: 3, name: "Police", number: "17", description: "Police secours" },
    { id: 4, name: "Urgences Europe", number: "112", description: "Numéro européen" },
  ];

  useEffect(() => {
    if (user) fetchEmergencyContacts();
  }, [user]);

  const fetchEmergencyContacts = async () => {
    const { data } = await supabase
      .from('family_contacts')
      .select('*')
      .eq('is_emergency_contact', true)
      .order('name');

    if (data) setEmergencyContacts(data);
    setLoading(false);
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, "")}`;
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-destructive/10 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Urgence / SOS</h1>
          <p className="text-sm text-destructive">Accès rapide aux secours</p>
        </div>
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {/* SOS Button */}
        <Button
          className="w-full h-24 text-xl font-bold gap-3 bg-destructive hover:bg-destructive/90"
          size="lg"
          onClick={() => handleCall('15')}
        >
          <AlertTriangle className="w-8 h-8" />
          APPELER LES SECOURS (15)
        </Button>

        {/* Location sharing */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-center gap-3 border border-orange-200 dark:border-orange-800">
          <MapPin className="w-6 h-6 text-orange-600" />
          <div className="flex-1">
            <p className="font-semibold text-orange-700 dark:text-orange-400">Partager ma position</p>
            <p className="text-sm text-orange-600 dark:text-orange-500">Envoyer ma localisation aux proches</p>
          </div>
          <Button size="sm" variant="outline" className="border-orange-300" onClick={() => toast.info("Le partage de position sera bientôt disponible")}>
            Partager
          </Button>
        </div>

        {/* Trouver un lieu d'urgence à proximité */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Trouver à proximité
          </h2>
          <div className="flex gap-2">
            {([
              { type: "hospital" as POIType, label: "Hôpitaux", emoji: "🏥" },
              { type: "pharmacy" as POIType, label: "Pharmacies", emoji: "💊" },
              { type: "police" as POIType, label: "Police", emoji: "🚔" },
            ]).map(f => (
              <button
                key={f.type}
                onClick={() => { setNearbyType(f.type); if (nearbySearched) searchNearbyEmergency(f.type); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: nearbyType === f.type ? "rgba(239,68,68,0.08)" : undefined,
                  border: `1.5px solid ${nearbyType === f.type ? "#ef4444" : "hsl(var(--border))"}`,
                  color: nearbyType === f.type ? "#ef4444" : undefined,
                }}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => searchNearbyEmergency()}
            disabled={nearbyLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
            style={{
              background: nearbyLoading ? "#94a3b8" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              border: "none",
              cursor: nearbyLoading ? "wait" : "pointer",
              fontSize: 15,
            }}
          >
            {nearbyLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Recherche en cours...</>
            ) : (
              <><MapPin className="w-5 h-5" /> Trouver le plus proche</>
            )}
          </button>

          {nearbySearched && !nearbyLoading && (
            <div className="space-y-2">
              {nearbyPOIs.length > 0 ? nearbyPOIs.slice(0, 5).map(poi => (
                <div key={poi.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-lg flex-shrink-0">
                    {getPOIEmoji(poi.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{poi.name}</p>
                    {poi.address && <p className="text-sm text-muted-foreground">{poi.address}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-destructive">{formatDistance(poi.distance)}</span>
                    <a
                      href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-500/10"
                    >
                      <Navigation className="w-4 h-4 text-blue-600" />
                    </a>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Aucun résultat à proximité</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emergency numbers grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Numéros d'urgence
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {nationalEmergencies.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleCall(contact.number)}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-destructive transition-colors active:bg-destructive/10"
              >
                <span className="text-3xl font-bold text-destructive">{contact.number}</span>
                <span className="font-semibold text-foreground">{contact.name}</span>
                <span className="text-sm text-muted-foreground text-center">{contact.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Essential numbers - collapsible categories */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2">Numéros essentiels</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {ESSENTIAL_NUMBERS.map((cat) => {
            const isOpen = openCategories.includes(cat.category);
            return (
              <div key={cat.category} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/60 transition-colors"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="flex-1 font-semibold text-foreground">{cat.category}</span>
                  <span className="text-sm text-muted-foreground mr-1">{cat.numbers.length}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-border">
                    {cat.numbers.map((num, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          i < cat.numbers.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{num.name}</p>
                          <p className="text-sm text-muted-foreground">{num.desc}</p>
                        </div>
                        <button
                          onClick={() => handleCall(num.number)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors flex-shrink-0"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700 dark:text-green-400 text-sm">{num.number}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Personal contacts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mes contacts d'urgence
          </h2>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : emergencyContacts.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Aucun contact d'urgence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez des proches à contacter en cas d'urgence
              </p>
              <Button onClick={() => navigate('/services/family')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Gérer mes contacts
              </Button>
            </div>
          ) : (
            emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.relationship || 'Contact d\'urgence'}</p>
                </div>
                {contact.phone && (
                  <Button
                    size="icon"
                    className="rounded-full bg-green-500 hover:bg-green-600"
                    onClick={() => handleCall(contact.phone!)}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
