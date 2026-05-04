import { useState, useEffect } from "react";
import { ArrowLeft, Pill, Clock, Plus, Check, Trash2, X, Heart, CalendarDays, ExternalLink, Dumbbell, MapPin, Loader2, Phone, Navigation, Bell, BellOff } from "lucide-react";
import { getCurrentPosition, reverseGeocode, formatDistance, googleMapsDirectionsUrl, type Coordinates } from "@/lib/geo";
import { searchNearbyPOIs, getPOIEmoji, type OverpassPOI, type POIType } from "@/lib/overpass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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


const HEALTH_PLATFORMS = [
  { name: "Mon Espace Santé", desc: "Dossier médical partagé (DMP), ordonnances, résultats", url: "https://www.monespacesante.fr", emoji: "🏥" },
  { name: "Ameli.fr", desc: "Assurance maladie, remboursements, attestations", url: "https://www.ameli.fr", emoji: "💳" },
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


  // Recherche à proximité
  const [nearbyPOIs, setNearbyPOIs] = useState<OverpassPOI[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbySearched, setNearbySearched] = useState(false);
  const [nearbyType, setNearbyType] = useState<POIType>("pharmacy");
  const [locationDenied, setLocationDenied] = useState(false);

  const searchNearbyHealth = async (type?: POIType) => {
    const searchType = type || nearbyType;
    setNearbyLoading(true);
    setNearbyPOIs([]);
    setLocationDenied(false);
    try {
      const coords = await getCurrentPosition();
      const radius = searchType === "hospital" ? 5000 : 2000;
      const results = await searchNearbyPOIs(coords, searchType, radius);
      setNearbyPOIs(results);
      setNearbySearched(true);
      if (results.length === 0) toast("Aucun résultat dans un rayon de " + (radius / 1000) + " km.");
    } catch (err: any) {
      if ((err as any).isDenied) {
        setLocationDenied(true);
      } else {
        toast.error(err.message || "Impossible d'obtenir votre position.");
      }
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="medications" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="px-2 pt-3 pb-1 flex-shrink-0">
            <TabsList className="grid grid-cols-4 h-auto p-1 w-full gap-0">
              <TabsTrigger value="medications" className="flex flex-col items-center gap-0.5 py-2 px-0 text-xs leading-tight rounded-md">
                <Pill className="w-4 h-4" />
                Médic.
              </TabsTrigger>
              <TabsTrigger value="mood" className="flex flex-col items-center gap-0.5 py-2 px-0 text-xs leading-tight rounded-md">
                <Heart className="w-4 h-4" />
                Humeur
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex flex-col items-center gap-0.5 py-2 px-0 text-xs leading-tight rounded-md">
                <CalendarDays className="w-4 h-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex flex-col items-center gap-0.5 py-2 px-0 text-xs leading-tight rounded-md">
                <Dumbbell className="w-4 h-4" />
                Activité
              </TabsTrigger>
            </TabsList>
          </div>

          {/* MEDICATIONS TAB */}
          <TabsContent value="medications" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
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
                      <button onClick={() => handleDelete(med.id)} className="p-3 hover:bg-destructive/10 rounded-full transition-colors">
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
          </TabsContent>

          {/* MOOD TAB */}
          <TabsContent value="mood" className="flex-1 overflow-y-auto p-4 space-y-5 mt-0">
            {/* Today's mood picker */}
            <div className="rounded-2xl p-5 border border-border" style={{ background: todayMood ? `linear-gradient(135deg, ${todayMood >= 4 ? 'rgba(34,197,94,0.08)' : todayMood >= 3 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)'} 0%, transparent 100%)` : undefined }}>
              <h2 className="font-bold text-foreground text-lg mb-1">Comment allez-vous ?</h2>
              <p className="text-sm text-muted-foreground mb-4">Choisissez l'emoji qui correspond à votre journée</p>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.level}
                    onClick={() => handleMoodSelect(m.level)}
                    disabled={savingMood}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer active:scale-95 select-none ${
                      todayMood === m.level
                        ? "border-primary bg-primary/10 scale-110 shadow-md"
                        : "border-border bg-card hover:border-primary/40 hover:scale-105"
                    }`}
                  >
                    <span style={{ fontSize: todayMood === m.level ? 36 : 28 }} className="transition-all">{m.emoji}</span>
                    <span className={`text-xs font-medium leading-tight text-center ${todayMood === m.level ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
              {todayMood && (
                <div className="mt-4 p-3 rounded-xl bg-card border border-border">
                  <p className="text-sm text-foreground font-medium mb-1">
                    {todayMood >= 4 ? "Super ! Continuez sur cette lancée." :
                     todayMood >= 3 ? "Journée tranquille. Prenez soin de vous." :
                     "Courage. N'hésitez pas à appeler un proche ou Oscar."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayMood >= 4 ? "Un petit appel à un proche pourrait rendre cette journée encore meilleure !" :
                     todayMood >= 3 ? "Une petite balade ou un jeu de mémoire peut faire du bien." :
                     "Parler fait du bien. Vos proches sont là pour vous."}
                  </p>
                </div>
              )}
            </div>

            {/* Visual trend — 7 days */}
            {moodEntries.length > 1 && (
              <div className="bg-card rounded-2xl p-4 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3">Votre semaine</h3>
                <div className="flex items-end justify-between gap-1" style={{ height: 80 }}>
                  {[...moodEntries].reverse().slice(0, 7).map((entry, i) => {
                    const mood = MOODS.find(m => m.level === entry.mood_level);
                    const height = (entry.mood_level / 5) * 100;
                    const colors = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#16A34A'];
                    return (
                      <div key={entry.id || i} className="flex-1 flex flex-col items-center gap-1">
                        <span style={{ fontSize: 16 }}>{mood?.emoji}</span>
                        <div className="w-full rounded-t-md transition-all" style={{ height: `${height}%`, backgroundColor: colors[entry.mood_level - 1], opacity: 0.7, minHeight: 8 }} />
                        <span className="text-xs text-foreground/70">
                          {format(new Date(entry.entry_date), "EEE", { locale: fr }).slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const avg = moodEntries.reduce((s, e) => s + e.mood_level, 0) / moodEntries.length;
                  return (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Moyenne : {avg.toFixed(1)}/5 — {avg >= 3.5 ? "Bonne forme cette semaine !" : avg >= 2.5 ? "Semaine correcte." : "Prenez du temps pour vous."}
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Mood history list */}
            {moodEntries.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Détail des 7 derniers jours</h3>
                <div className="space-y-2">
                  {moodEntries.map(entry => {
                    const mood = MOODS.find(m => m.level === entry.mood_level);
                    return (
                      <div key={entry.id} className="bg-card rounded-xl p-3.5 border border-border flex items-center gap-3">
                        <span className="text-2xl">{mood?.emoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{mood?.label}</p>
                          {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.entry_date), "EEEE d MMM", { locale: fr })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {moodEntries.length === 0 && !todayMood && (
              <div className="text-center py-8">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">Commencez votre suivi</p>
                <p className="text-sm text-muted-foreground">Enregistrez votre humeur chaque jour pour voir votre tendance.</p>
              </div>
            )}
          </TabsContent>

          {/* PLATFORMS TAB */}
          <TabsContent value="platforms" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
            {/* Oscar banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-lg mt-0.5">💡</span>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-primary">Oscar peut aussi vous aider !</span>{" "}
                Dites-lui : « Oscar, explique-moi mon relevé Ameli »
              </p>
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

            {/* Localisation refusée */}
            {locationDenied && (
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                  Vous avez initialement refusé l'accès à votre localisation. Souhaitez-vous l'activer maintenant pour trouver des établissements près de chez vous ?
                </p>
                <button
                  onClick={() => searchNearbyHealth()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

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

            {/* Plateformes de santé */}
            <div className="flex items-center gap-3 pt-2">
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
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
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

          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
