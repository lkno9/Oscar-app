import { useState, useEffect } from "react";
import { ArrowLeft, Pill, Clock, Plus, Check, Trash2, X, Heart, Smile, CalendarDays, Lightbulb, ExternalLink, Dumbbell, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const HEALTH_PLATFORMS = [
  { name: "Mon Espace Santé", desc: "Dossier médical partagé (DMP), ordonnances, résultats", url: "https://www.monespacesante.fr", emoji: "🏥" },
  { name: "Ameli.fr", desc: "Assurance maladie, remboursements, attestations", url: "https://www.ameli.fr", emoji: "💳" },
  { name: "Doctolib", desc: "Prendre un rendez-vous médical en ligne", url: "https://www.doctolib.fr", emoji: "📅" },
  { name: "Pharmacie en ligne", desc: "Commander vos médicaments (1001Pharmacies)", url: "https://www.1001pharmacies.com", emoji: "💊" },
  { name: "Service-Public Santé", desc: "Vos droits santé, aides et démarches", url: "https://www.service-public.fr/particuliers/vosdroits/N17", emoji: "📋" },
  { name: "Pour les personnes âgées", desc: "Guide officiel des aides et droits seniors", url: "https://www.pour-les-personnes-agees.gouv.fr", emoji: "🤝" },
];

const NEARBY_HEALTH = [
  { name: "Pharmacie de garde", desc: "Trouver une pharmacie ouverte près de chez vous", url: "https://www.3237.fr", emoji: "💊" },
  { name: "Maisons de santé", desc: "Trouver un centre ou maison médicale", url: "https://annuaire.sante.fr", emoji: "🏥" },
  { name: "Médecin près de chez moi", desc: "Annuaire des professionnels de santé", url: "https://annuaire.sante.fr/web/site-pro/recherche-avancee", emoji: "👨‍⚕️" },
];

const SPORT_LINKS = [
  { name: "FFEPGV", desc: "Fédération sport pour tous, gym volontaire", url: "https://www.sport-sante.fr", emoji: "🤸" },
  { name: "Randonnée France", desc: "Clubs et parcours de randonnée", url: "https://www.ffrandonnee.fr", emoji: "🥾" },
  { name: "Gym seniors", desc: "Trouver un cours adapté près de chez vous", url: "https://www.pagesjaunes.fr/annuaire/chercherdans?quoiqui=gym+seniors&ou=", emoji: "💪" },
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
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const dailyTip = WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length];

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [medsRes, moodRes, eventsRes] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user!.id).order("name"),
      supabase.from("mood_entries").select("*").eq("user_id", user!.id).order("entry_date", { ascending: false }).limit(7),
      supabase.from("events").select("*").eq("user_id", user!.id).gte("event_date", today)
        .in("event_type", ["medical", "health"])
        .order("event_date").limit(5),
    ]);
    if (medsRes.data) setMedications(medsRes.data);
    if (moodRes.data) {
      setMoodEntries(moodRes.data);
      const todayEntry = moodRes.data.find(m => m.entry_date === today);
      if (todayEntry) setTodayMood(todayEntry.mood_level);
    }
    if (eventsRes.data) setUpcomingEvents(eventsRes.data);
    setLoading(false);
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("Veuillez entrer un nom de médicament"); return; }
    const { error } = await supabase.from("medications").insert({
      user_id: user?.id,
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      notes: notes || null,
      is_active: true,
    });
    if (error) { toast.error("Erreur lors de l'ajout"); } 
    else {
      toast.success("Médicament ajouté !");
      setName(""); setDosage(""); setFrequency(""); setNotes("");
      setShowForm(false);
      fetchAll();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("medications").update({ is_active: !current }).eq("id", id);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("medications").delete().eq("id", id);
    toast.success("Médicament supprimé");
    fetchAll();
  };

  const handleMoodSelect = async (level: number) => {
    if (savingMood) return;
    setSavingMood(true);
    const today = new Date().toISOString().split("T")[0];
    // Upsert today's mood
    const { error } = await supabase.from("mood_entries").upsert(
      { user_id: user?.id, mood_level: level, entry_date: today },
      { onConflict: "user_id,entry_date" }
    );
    if (!error) {
      setTodayMood(level);
      toast.success("Humeur enregistrée !");
      fetchAll();
    }
    setSavingMood(false);
  };

  const formatEventDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: fr }); } catch { return d; }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Santé & bien-être</h1>
          <p className="text-sm text-muted-foreground">Suivez votre santé au quotidien</p>
        </div>
        <Heart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="medications" className="flex-1 flex flex-col overflow-hidden">
          <div className="mx-4 mt-4 flex-shrink-0 overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="medications" className="flex items-center gap-1 text-xs px-3">
                <Pill className="w-3.5 h-3.5" />
                Médic.
              </TabsTrigger>
              <TabsTrigger value="mood" className="flex items-center gap-1 text-xs px-3">
                <Smile className="w-3.5 h-3.5" />
                Humeur
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center gap-1 text-xs px-3">
                <Link className="w-3.5 h-3.5" />
                Services
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-1 text-xs px-3">
                <Dumbbell className="w-3.5 h-3.5" />
                Activité
              </TabsTrigger>
              <TabsTrigger value="wellness" className="flex items-center gap-1 text-xs px-3">
                <Lightbulb className="w-3.5 h-3.5" />
                Conseils
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
                <button onClick={() => navigate("/services/agenda")} className="mt-3 text-sm text-primary font-medium underline-offset-2 hover:underline">
                  Voir l'agenda →
                </button>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {loading ? "Chargement..." : medications.length > 0 ? "Mes médicaments" : "Aucun médicament"}
              </h2>
              {medications.map(med => (
                <div key={med.id} className="bg-card rounded-xl p-4 shadow-sm border border-border">
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
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-secondary rounded-full text-xs text-foreground">
                          <Clock className="w-3 h-3" />{med.frequency}
                        </span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(med.id)} className="p-2 hover:bg-destructive/10 rounded-full transition-colors">
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                  {med.notes && <p className="mt-2 text-xs text-muted-foreground">{med.notes}</p>}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* MOOD TAB */}
          <TabsContent value="mood" className="flex-1 overflow-y-auto p-4 space-y-6 mt-0">
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
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      todayMood === m.level
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border bg-secondary hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs text-foreground font-medium leading-tight text-center">{m.label}</span>
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
            <p className="text-sm text-muted-foreground">Accédez directement à vos services de santé en ligne.</p>
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

            {/* Nearby health facilities */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Trouver autour de moi</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ex.level === "Facile" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                        {ex.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ex.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sport links */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Bouger près de chez moi</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-3">
              {SPORT_LINKS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => window.open(s.url, "_blank")}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </TabsContent>

          {/* WELLNESS TIPS TAB */}
          <TabsContent value="wellness" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
