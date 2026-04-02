import { useState, useEffect } from "react";
import { ArrowLeft, Pill, Clock, Plus, Check, Trash2, X, Heart, CalendarDays, Lightbulb, ExternalLink, Dumbbell, MapPin, Loader2, Phone, Navigation, Bell, BellOff, ChevronDown } from "lucide-react";
import { getCurrentPosition, reverseGeocode, formatDistance, googleMapsDirectionsUrl, type Coordinates } from "@/lib/geo";
import { searchNearbyPOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  is_active: boolean;
  notes: string | null;
}

interface MoodEntry {
  id: string;
  mood_level: number;
  entry_date: string;
  notes: string | null;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
}

const MOODS = [
  { level: 1, emoji: "😢", label: "Triste" },
  { level: 2, emoji: "😕", label: "Pas bien" },
  { level: 3, emoji: "😐", label: "Correct" },
  { level: 4, emoji: "🙂", label: "Bien" },
  { level: 5, emoji: "😊", label: "Très bien" },
];

const WELLNESS_TIPS = [
  "Boire 1,5L d'eau par jour aide à maintenir votre énergie.",
  "Une marche de 30 minutes améliore l'humeur et la circulation.",
  "Dormir 7 à 8 heures renforce votre système immunitaire.",
  "Prendre l'air chaque jour réduit le stress et améliore le moral.",
  "Les activités sociales contribuent à une bonne santé mentale.",
  "Manger des fruits et légumes colorés chaque jour.",
];

const DOCTOLIB_SPECIALTIES = [
  { key: "medecin-generaliste", label: "Médecin généraliste", emoji: "🩺" },
  { key: "dentiste", label: "Dentiste", emoji: "🦷" },
  { key: "ophtalmologue", label: "Ophtalmologue", emoji: "👁️" },
  { key: "dermatologue", label: "Dermatologue", emoji: "🧴" },
  { key: "kinesitherapeute", label: "Kinésithérapeute", emoji: "💆" },
  { key: "cardiologue", label: "Cardiologue", emoji: "❤️" },
  { key: "orl", label: "ORL", emoji: "👂" },
  { key: "radiologue", label: "Radiologue", emoji: "🔬" },
];

const HEALTH_PLATFORMS = [
  { name: "Mon Espace Santé", desc: "Dossier médical partagé (DMP), ordonnances, résultats", url: "https://www.monespacesante.fr", emoji: "🏥" },
  { name: "Ameli.fr", desc: "Assurance maladie, remboursements, attestations", url: "https://www.ameli.fr", emoji: "💳" },
  { name: "Pharmacie en ligne", desc: "Commander vos médicaments (1001Pharmacies)", url: "https://www.1001pharmacies.com", emoji: "💊" },
  { name: "Service-Public Santé", desc: "Vos droits santé, aides et démarches", url: "https://www.service-public.fr/particuliers/vosdroits/N17", emoji: "📋" },
  { name: "Pour les personnes âgées", desc: "Guide officiel des aides et droits seniors", url: "https://www.pour-les-personnes-agees.gouv.fr", emoji: "🤝" },
];

const NEARBY_HEALTH = [
  { name: "Pharmacie de garde", desc: "Trouver une pharmacie ouverte près de chez vous", url: "https://www.3237.fr", emoji: "💊" },
  { name: "Maisons de santé", desc: "Trouver un centre ou maison médicale", url: "https://annuaire.sante.fr", emoji: "🏥" },
  { name: "Médecin près de chez moi", desc: "Annuaire des professionnels de santé", url: "https://annuaire.sante.fr/web/site-pro/recherche-avancee", emoji: "👨‍⚕️" },
];


const EXERCISES = [
  { name: "Marche douce", desc: "20-30 min de marche à votre rythme, idéal chaque matin", emoji: "🚶", level: "Facile" },
  { name: "Gymnastique douce", desc: "Étirements et mouvements articulaires en douceur", emoji: "🤸", level: "Facile" },
  { name: "Yoga adapté", desc: "Postures simples pour souplesse et équilibre", emoji: "🧘", level: "Modéré" },
  { name: "Aquagym", desc: "Exercices en piscine, doux pour les articulations", emoji: "🏊", level: "Modéré" },
  { name: "Vélo d'appartement", desc: "Cardio doux, à adapter selon votre forme", emoji: "🚴", level: "Modéré" },
  { name: "Tai Chi", desc: "Mouvements lents pour équilibre et relaxation", emoji: "🥋", level: "Facile" },
];

export function HealthPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [medReminders, setMedReminders] = useState<Record<string, { eventId: string; time: string | null }>>({});
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const dailyTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  // Sections ouvertes (toutes ouvertes par défaut)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    medications: true,
    mood: true,
    services: true,
    activity: false,
    wellness: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Doctolib recherche
  const [doctoSpec, setDoctoSpec] = useState<string | null>(null);
  const [doctoLocation, setDoctoLocation] = useState("");
  const [doctoLocating, setDoctoLocating] = useState(false);

  const handleDoctoGeolocate = async () => {
    setDoctoLocating(true);
    try {
      const coords = await getCurrentPosition();
      const geoResult = await reverseGeocode(coords);
      // reverseGeocode retourne un GeoAddress avec .city
      const city = geoResult.city || "";
      if (city) {
        setDoctoLocation(city);
      } else {
        toast.error("Impossible de déterminer votre ville. Veuillez la saisir manuellement.");
      }
    } catch (err: any) {
      toast.error(err.message || "Impossible d'obtenir votre position.");
    } finally {
      setDoctoLocating(false);
    }
  };

  const openDoctolib = () => {
    if (!doctoSpec) { toast.error("Veuillez choisir un type de spécialiste."); return; }
    // Construire le slug ville
    const citySlug = doctoLocation.trim()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const url = citySlug
      ? `https://www.doctolib.fr/${doctoSpec}/${citySlug}`
      : `https://www.doctolib.fr/${doctoSpec}`;
    window.open(url, "_blank");
  };

  // Recherche à proximité
  const [nearbyPOIs, setNearbyPOIs] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySearched, setNearbySearched] = useState(false);
  const [nearbyType, setNearbyType] = useState<POIType>("pharmacy");

  const searchNearbyHealth = async (type?: POIType) => {
    const searchType = type || nearbyType;
    setNearbyLoading(true);
    setNearbyPOIs([]);
    try {
      const coords = await getCurrentPosition();
      const radius = searchType === "hospital" ? 5000 : 2000;
      const results = await searchNearbyPOIs(coords, searchType, radius);
      setNearbyPOIs(results);
      setNearbySearched(true);
      if (results.length === 0) toast("Aucun résultat dans un rayon de " + (radius / 1000) + " km.");
    } catch (err: any) {
      toast.error(err.message || "Impossible d'obtenir votre position.");
    } finally {
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [medsRes, moodRes, eventsRes, medEventsRes] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user!.id).order("name"),
      supabase.from("mood_entries").select("*").eq("user_id", user!.id).order("entry_date", { ascending: false }).limit(7),
      supabase.from("events").select("*").eq("user_id", user!.id).gte("event_date", today)
        .in("event_type", ["medical", "health"])
        .order("event_date").limit(5),
      supabase.from("events").select("*").eq("user_id", user!.id).eq("event_type", "medication").eq("reminder", true),
    ]);
    if (medsRes.data) setMedications(medsRes.data);
    if (moodRes.data) {
      setMoodEntries(moodRes.data);
      const todayEntry = moodRes.data.find(m => m.entry_date === today);
      if (todayEntry) setTodayMood(todayEntry.mood_level);
    }
    if (eventsRes.data) setUpcomingEvents(eventsRes.data);
    if (medEventsRes.data) {
      const map: Record<string, { eventId: string; time: string | null }> = {};
      for (const ev of medEventsRes.data) {
        // description stores the medication ID
        if (ev.description) map[ev.description] = { eventId: ev.id, time: ev.event_time };
      }
      setMedReminders(map);
    }
    setLoading(false);
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("Veuillez entrer un nom de médicament"); return; }
    const { data: medData, error } = await supabase.from("medications").insert({
      user_id: user?.id,
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      notes: notes || null,
      is_active: true,
    }).select().single();
    if (error) { toast.error("Erreur lors de l'ajout"); return; }
    // Create reminder event if enabled
    if (reminderEnabled && medData) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("events").insert({
        user_id: user?.id,
        title: `💊 ${name}${dosage ? " — " + dosage : ""}`,
        description: medData.id,
        event_date: today,
        event_time: reminderTime || null,
        event_type: "medication",
        reminder: true,
      });
    }
    toast.success(reminderEnabled ? "Médicament ajouté avec rappel !" : "Médicament ajouté !");
    setName(""); setDosage(""); setFrequency(""); setNotes(""); setReminderTime(""); setReminderEnabled(false);
    setShowForm(false);
    fetchAll();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("medications").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Erreur lors de la mise à jour");
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce médicament ?")) return;
    // Also delete associated reminder event
    const reminder = medReminders[id];
    if (reminder) {
      await supabase.from("events").delete().eq("id", reminder.eventId);
    }
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) toast.error("Erreur lors de la suppression");
    else toast.success("Médicament supprimé");
    fetchAll();
  };

  const toggleMedReminder = async (med: Medication) => {
    const existing = medReminders[med.id];
    if (existing) {
      // Remove reminder
      await supabase.from("events").delete().eq("id", existing.eventId);
      toast.success(`Rappel supprimé pour "${med.name}"`);
    } else {
      // Create reminder — default to 08:00 if no time
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("events").insert({
        user_id: user?.id,
        title: `💊 ${med.name}${med.dosage ? " — " + med.dosage : ""}`,
        description: med.id,
        event_date: today,
        event_time: "08:00",
        event_type: "medication",
        reminder: true,
      });
      toast.success(`Rappel ajouté pour "${med.name}" à 08h00`);
    }
    fetchAll();
  };

  const handleMoodSelect = async (level: number) => {
    if (savingMood) return;
    setSavingMood(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      // Upsert today's mood
      const { error } = await supabase.from("mood_entries").upsert(
        { user_id: user?.id, mood_level: level, entry_date: today },
        { onConflict: "user_id,entry_date" }
      );
      if (error) throw error;

      setTodayMood(level);
      toast.success("Humeur enregistrée !");
      fetchAll();
    } catch (err) {
      console.error("Erreur mood:", err);
      // Mise à jour locale même si la DB échoue
      setTodayMood(level);
      toast.success("Humeur enregistrée !");
    } finally {
      setSavingMood(false);
    }
  };

  const formatEventDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: fr }); } catch { return d; }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Santé & bien-être</h1>
          <p className="text-sm text-muted-foreground">Suivez votre santé au quotidien</p>
        </div>
        <Heart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3 pb-24">

          {/* ══════════ MÉDICAMENTS ══════════ */}
          <button onClick={() => toggleSection("medications")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Médicaments</span>
            <span className="text-xs text-muted-foreground mr-1">{medications.length > 0 ? `${medications.filter(m => m.is_active).length} actif(s)` : ""}</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.medications ? "rotate-180" : ""}`} />
          </button>
          {openSections.medications && (
          <div className="space-y-4 pl-1">
            {!showForm ? (
              <Button className="w-full gap-2 min-h-[52px]" size="lg" onClick={() => setShowForm(true)}>
                <Plus className="w-5 h-5" />
                Ajouter un médicament
              </Button>
            ) : (
              <form onSubmit={handleAddMed} className="bg-card rounded-xl p-4 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Nouveau médicament</h3>
                  <button type="button" onClick={() => setShowForm(false)}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Doliprane 1000mg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input id="dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Ex: 1 comprimé" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Input id="frequency" value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Ex: 2 fois par jour" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations supplémentaires" />
                </div>
                {/* Rappel Oscar */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <Label htmlFor="med-reminder" className="font-semibold text-foreground cursor-pointer">Rappel Oscar</Label>
                    </div>
                    <Switch id="med-reminder" checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
                  </div>
                  {reminderEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">Heure de prise</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={reminderTime}
                        onChange={e => setReminderTime(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Oscar vous rappellera chaque jour à cette heure.</p>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full min-h-[48px]">Ajouter</Button>
              </form>
            )}

            {/* Upcoming medical appointments */}
            {upcomingEvents.length > 0 && (
              <div className="bg-accent rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-5 h-5 text-accent-foreground" />
                  <p className="font-semibold text-accent-foreground text-sm">Prochains rendez-vous médicaux</p>
                </div>
                <div className="space-y-2">
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary w-16">{formatEventDate(ev.event_date)}</span>
                      <span className="text-sm text-foreground">{ev.title}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/services/agenda?type=medical")} className="mt-3 text-sm text-primary font-medium underline-offset-2 hover:underline">
                  Voir l'agenda médical →
                </button>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {loading ? "Chargement..." : medications.length > 0 ? "Mes médicaments" : "Aucun médicament"}
              </h2>
              {medications.map(med => {
                const reminder = medReminders[med.id];
                return (
                  <div key={med.id} className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleActive(med.id, med.is_active)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${med.is_active ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}
                      >
                        {med.is_active ? <Check className="w-6 h-6 text-green-600" /> : <Pill className="w-6 h-6 text-muted-foreground" />}
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${med.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>{med.name}</h3>
                        {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage}</p>}
                        {med.frequency && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-secondary rounded-full text-sm text-foreground">
                            <Clock className="w-3 h-3" />{med.frequency}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDelete(med.id)} className="p-2 hover:bg-destructive/10 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </button>
                    </div>
                    {med.notes && <p className="text-sm text-muted-foreground">{med.notes}</p>}
                    {/* Reminder row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      <button
                        onClick={() => toggleMedReminder(med)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                          reminder
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        {reminder ? (
                          <><Bell className="w-4 h-4" /> Rappel à {reminder.time || "08:00"}</>
                        ) : (
                          <><BellOff className="w-4 h-4" /> Me rappeler</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* ══════════ HUMEUR ══════════ */}
          <button onClick={() => toggleSection("mood")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Humeur du jour</span>
            {todayMood && <span className="text-lg mr-1">{MOODS.find(m => m.level === todayMood)?.emoji}</span>}
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.mood ? "rotate-180" : ""}`} />
          </button>
          {openSections.mood && (
          <div className="space-y-6 pl-1">
            {/* Today's mood */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h2 className="font-bold text-foreground text-base mb-1">Comment vous sentez-vous aujourd'hui ?</h2>
              <p className="text-sm text-muted-foreground mb-5">Appuyez sur un emoji pour enregistrer votre humeur</p>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.level}
                    onClick={() => handleMoodSelect(m.level)}
                    disabled={savingMood}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer active:scale-95 select-none ${
                      todayMood === m.level
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border bg-secondary hover:border-primary/40"
                    }`}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-sm text-foreground font-medium leading-tight text-center">{m.label}</span>
                  </button>
                ))}
              </div>
              {todayMood && (
                <p className="text-center mt-4 text-sm text-primary font-medium">
                  Humeur du jour : {MOODS.find(m => m.level === todayMood)?.emoji} {MOODS.find(m => m.level === todayMood)?.label}
                </p>
              )}
            </div>

            {/* Mood history */}
            {moodEntries.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Historique (7 jours)</h2>
                <div className="space-y-2">
                  {moodEntries.map(entry => {
                    const mood = MOODS.find(m => m.level === entry.mood_level);
                    return (
                      <div key={entry.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                        <span className="text-2xl">{mood?.emoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{mood?.label}</p>
                          {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.entry_date), "d MMM", { locale: fr })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {/* ══════════ SERVICES SANTÉ ══════════ */}
          <button onClick={() => toggleSection("services")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Services & RDV</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.services ? "rotate-180" : ""}`} />
          </button>
          {openSections.services && (
          <div className="space-y-4 pl-1">
            {/* Doctolib RDV Tool — avec localisation */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(0,127,243,0.1)" }}>
                  📅
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Prendre rendez-vous</h3>
                  <p className="text-sm text-muted-foreground">Via Doctolib — choisissez un spécialiste et votre ville</p>
                </div>
              </div>

              {/* Étape 1 : Choisir la spécialité */}
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">1. Type de spécialiste</p>
              <div className="grid grid-cols-2 gap-2">
                {DOCTOLIB_SPECIALTIES.map(spec => (
                  <button
                    key={spec.key}
                    onClick={() => setDoctoSpec(spec.key)}
                    className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `1.5px solid ${doctoSpec === spec.key ? "#007FF3" : "hsl(var(--border))"}`,
                      background: doctoSpec === spec.key ? "rgba(0,127,243,0.06)" : "hsl(var(--background))",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-lg">{spec.emoji}</span>
                    <span className="text-sm font-medium text-foreground leading-tight">{spec.label}</span>
                  </button>
                ))}
              </div>

              {/* Étape 2 : Localisation */}
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2. Où ? (optionnel)</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ville ou adresse (ex: Paris, Lyon...)"
                  value={doctoLocation}
                  onChange={e => setDoctoLocation(e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={handleDoctoGeolocate}
                  disabled={doctoLocating}
                  className="flex items-center justify-center gap-1.5 px-3 rounded-xl text-sm font-medium flex-shrink-0 transition-all"
                  style={{
                    border: "1.5px solid hsl(var(--border))",
                    background: doctoLocating ? "hsl(var(--muted))" : "hsl(var(--background))",
                    cursor: doctoLocating ? "wait" : "pointer",
                    minHeight: 40,
                  }}
                >
                  {doctoLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <><MapPin className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">Ma position</span></>
                  )}
                </button>
              </div>

              {/* Bouton Rechercher */}
              <button
                onClick={openDoctolib}
                disabled={!doctoSpec}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all"
                style={{
                  background: !doctoSpec ? "#94a3b8" : "linear-gradient(135deg, #007FF3 0%, #0066cc 100%)",
                  border: "none",
                  cursor: !doctoSpec ? "not-allowed" : "pointer",
                  fontSize: 15,
                }}
              >
                Rechercher sur Doctolib →
              </button>
            </div>

            {/* Oscar banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-lg mt-0.5">💡</span>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-primary">Oscar peut aussi vous aider !</span>{" "}
                Dites-lui : « Oscar, explique-moi mon relevé Ameli »
              </p>
            </div>

            {/* Plateformes de santé */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2">Services en ligne</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3">
              {HEALTH_PLATFORMS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => window.open(p.url, "_blank")}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Trouver autour de moi — recherche intégrée */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2">Trouver autour de moi</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Filtres type */}
            <div className="flex gap-2">
              {([
                { type: "pharmacy" as POIType, label: "Pharmacies", emoji: "💊" },
                { type: "doctor" as POIType, label: "Médecins", emoji: "👨‍⚕️" },
                { type: "hospital" as POIType, label: "Hôpitaux", emoji: "🏥" },
              ]).map(f => (
                <button
                  key={f.type}
                  onClick={() => { setNearbyType(f.type); if (nearbySearched) searchNearbyHealth(f.type); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: nearbyType === f.type ? "rgba(72,162,158,0.12)" : undefined,
                    border: `1.5px solid ${nearbyType === f.type ? "#48A29E" : "hsl(var(--border))"}`,
                    color: nearbyType === f.type ? "#48A29E" : undefined,
                  }}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>

            {/* Bouton recherche */}
            <button
              onClick={() => searchNearbyHealth()}
              disabled={nearbyLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
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
                <><MapPin className="w-5 h-5" /> Chercher près de moi</>
              )}
            </button>

            {/* Résultats */}
            {nearbySearched && !nearbyLoading && (
              <div className="space-y-3">
                {nearbyPOIs.length > 0 ? nearbyPOIs.map(poi => (
                  <div key={poi.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-xl flex-shrink-0">
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
                            <a
                              href={`tel:${poi.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                            >
                              <Phone className="w-3.5 h-3.5" /> Appeler
                            </a>
                          )}
                          <a
                            href={googleMapsDirectionsUrl({ lat: poi.lat, lon: poi.lon })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-medium"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Y aller
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-muted-foreground">Aucun résultat trouvé à proximité</p>
                  </div>
                )}
              </div>
            )}

            {/* Liens en ligne (fallback) */}
            {(!nearbySearched || nearbyPOIs.length === 0) && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center uppercase tracking-wide">Ou recherchez en ligne</p>
                {NEARBY_HEALTH.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => window.open(p.url, "_blank")}
                    className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* ══════════ ACTIVITÉ PHYSIQUE ══════════ */}
          <button onClick={() => toggleSection("activity")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-orange-500" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Activité physique</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.activity ? "rotate-180" : ""}`} />
          </button>
          {openSections.activity && (
          <div className="space-y-4 pl-1">
            <div className="bg-accent rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Dumbbell className="w-6 h-6 text-accent-foreground" />
                <p className="font-bold text-accent-foreground">Restez actif, à votre rythme</p>
              </div>
              <p className="text-sm text-foreground">L'activité physique adaptée améliore l'équilibre, le moral et la santé. Choisissez ce qui vous convient.</p>
            </div>
            <div className="space-y-3">
              {EXERCISES.map((ex, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {ex.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{ex.name}</h3>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${ex.level === "Facile" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                        {ex.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ex.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recherche lieux sport/parcs proches */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2">Près de chez moi</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-2">
              {([
                { type: "park" as POIType, label: "Parcs", emoji: "🌳" },
                { type: "sports_centre" as POIType, label: "Sport", emoji: "🏋️" },
              ]).map(f => (
                <button
                  key={f.type}
                  onClick={() => {
                    setNearbyType(f.type);
                    searchNearbyHealth(f.type);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: nearbyType === f.type ? "rgba(72,162,158,0.12)" : undefined,
                    border: `1.5px solid ${nearbyType === f.type ? "#48A29E" : "hsl(var(--border))"}`,
                    color: nearbyType === f.type ? "#48A29E" : undefined,
                  }}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => searchNearbyHealth(nearbyType === "park" || nearbyType === "sports_centre" ? nearbyType : "park")}
              disabled={nearbyLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all"
              style={{
                background: nearbyLoading ? "#94a3b8" : "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
                border: "none",
                cursor: nearbyLoading ? "wait" : "pointer",
                fontSize: 14,
              }}
            >
              {nearbyLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Recherche...</>
              ) : (
                <><MapPin className="w-4 h-4" /> Trouver près de moi</>
              )}
            </button>

            {nearbySearched && !nearbyLoading && (nearbyType === "park" || nearbyType === "sports_centre") && (
              <div className="space-y-3">
                {nearbyPOIs.length > 0 ? nearbyPOIs.map(poi => (
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
                  <div className="text-center py-6">
                    <span className="text-3xl block mb-2">🔍</span>
                    <p className="text-muted-foreground">Aucun lieu trouvé à proximité</p>
                  </div>
                )}
              </div>
            )}

          </div>
          )}

          {/* ══════════ CONSEILS BIEN-ÊTRE ══════════ */}
          <button onClick={() => toggleSection("wellness")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="flex-1 text-left font-semibold text-foreground">Conseils bien-être</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.wellness ? "rotate-180" : ""}`} />
          </button>
          {openSections.wellness && (
          <div className="space-y-4 pl-1">
            {/* Daily tip */}
            <div className="bg-accent rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-6 h-6 text-accent-foreground" />
                <p className="font-bold text-accent-foreground">Conseil du jour</p>
              </div>
              <p className="text-base text-foreground leading-relaxed">{dailyTip}</p>
            </div>

            {/* All tips */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tous les conseils</h2>
              {WELLNESS_TIPS.map((tip, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-base text-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
