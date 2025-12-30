import { ArrowLeft, Heart, Activity, Moon, Footprints, Smile, Save, Edit2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface DailyWellness {
  id?: string;
  steps: number;
  sleep_minutes: number;
  activity_minutes: number;
  steps_goal: number;
  sleep_goal_minutes: number;
  activity_goal_minutes: number;
}

interface MoodEntry {
  id: string;
  mood_level: number;
  entry_date: string;
}

const defaultWellness: DailyWellness = {
  steps: 0,
  sleep_minutes: 0,
  activity_minutes: 0,
  steps_goal: 6000,
  sleep_goal_minutes: 480,
  activity_goal_minutes: 30
};

const tips = [
  "Pensez à vous hydrater régulièrement. Boire 1,5L d'eau par jour aide à rester en forme !",
  "Une marche de 30 minutes par jour réduit le stress et améliore le sommeil.",
  "Prenez le temps de respirer profondément 5 fois pour vous détendre.",
  "Un bon petit-déjeuner donne l'énergie pour bien commencer la journée.",
  "Étirer vos muscles le matin aide à réveiller votre corps en douceur."
];

export function WellnessPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [wellness, setWellness] = useState<DailyWellness>(defaultWellness);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  useEffect(() => {
    if (user) {
      fetchTodayData();
    }
  }, [user]);

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch wellness data
    const { data: wellnessData } = await supabase
      .from('daily_wellness')
      .select('*')
      .eq('entry_date', today)
      .maybeSingle();

    if (wellnessData) {
      setWellness(wellnessData);
    }

    // Fetch mood
    const { data: moodData } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('entry_date', today)
      .maybeSingle();

    if (moodData) {
      setTodayMood(moodData.mood_level);
    }

    setLoading(false);
  };

  const handleMoodSelect = async (level: number) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Check if mood exists for today
    const { data: existing } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('entry_date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('mood_entries')
        .update({ mood_level: level })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('mood_entries')
        .insert({ user_id: user.id, mood_level: level, entry_date: today });
    }

    setTodayMood(level);
    toast.success("Humeur enregistrée !");
  };

  const handleSaveWellness = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const wellnessData = {
      user_id: user.id,
      entry_date: today,
      steps: wellness.steps,
      sleep_minutes: wellness.sleep_minutes,
      activity_minutes: wellness.activity_minutes,
      steps_goal: wellness.steps_goal,
      sleep_goal_minutes: wellness.sleep_goal_minutes,
      activity_goal_minutes: wellness.activity_goal_minutes
    };

    const { error } = await supabase
      .from('daily_wellness')
      .upsert(wellnessData, { onConflict: 'user_id,entry_date' });

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Données sauvegardées !");
      setEditing(false);
    }
  };

  const formatSleep = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const moods = [
    { level: 5, emoji: "😊", label: "Super" },
    { level: 4, emoji: "🙂", label: "Bien" },
    { level: 3, emoji: "😐", label: "Moyen" },
    { level: 2, emoji: "😔", label: "Pas top" },
    { level: 1, emoji: "😢", label: "Difficile" }
  ];

  const stats = [
    { 
      icon: Footprints, 
      label: "Pas aujourd'hui", 
      value: wellness.steps.toLocaleString(), 
      goal: wellness.steps_goal.toLocaleString(), 
      progress: Math.min(100, (wellness.steps / wellness.steps_goal) * 100), 
      color: "text-blue-500",
      field: 'steps',
      unit: 'pas'
    },
    { 
      icon: Moon, 
      label: "Sommeil", 
      value: formatSleep(wellness.sleep_minutes), 
      goal: formatSleep(wellness.sleep_goal_minutes), 
      progress: Math.min(100, (wellness.sleep_minutes / wellness.sleep_goal_minutes) * 100), 
      color: "text-purple-500",
      field: 'sleep_minutes',
      unit: 'minutes'
    },
    { 
      icon: Activity, 
      label: "Activité", 
      value: `${wellness.activity_minutes} min`, 
      goal: `${wellness.activity_goal_minutes} min`, 
      progress: Math.min(100, (wellness.activity_minutes / wellness.activity_goal_minutes) * 100), 
      color: "text-green-500",
      field: 'activity_minutes',
      unit: 'minutes'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Bien-être</h1>
          <p className="text-sm text-muted-foreground">Prenez soin de vous</p>
        </div>
        <Heart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mood check */}
        <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-5 h-5" />
            Comment vous sentez-vous ?
          </h2>
          <div className="flex justify-between">
            {moods.map((mood) => (
              <button
                key={mood.level}
                onClick={() => handleMoodSelect(mood.level)}
                className={`w-12 h-12 rounded-full transition-all flex items-center justify-center text-2xl ${
                  todayMood === mood.level 
                    ? 'bg-primary ring-2 ring-primary ring-offset-2 scale-110' 
                    : 'bg-card hover:bg-secondary'
                }`}
              >
                {mood.emoji}
              </button>
            ))}
          </div>
          {todayMood && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Vous vous sentez "{moods.find(m => m.level === todayMood)?.label}" aujourd'hui
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Votre journée
            </h2>
            {editing ? (
              <Button size="sm" onClick={handleSaveWellness}>
                <Save className="w-4 h-4 mr-1" />
                Sauvegarder
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />
                Modifier
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : (
            stats.map((stat, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{stat.label}</h3>
                    <p className="text-sm text-muted-foreground">Objectif : {stat.goal}</p>
                  </div>
                  {editing ? (
                    <Input
                      type="number"
                      className="w-24 text-right"
                      value={wellness[stat.field as keyof DailyWellness] as number}
                      onChange={(e) => setWellness({
                        ...wellness,
                        [stat.field]: parseInt(e.target.value) || 0
                      })}
                    />
                  ) : (
                    <span className="text-xl font-bold text-foreground">
                      {stat.value || '—'}
                    </span>
                  )}
                </div>
                <Progress value={stat.progress} className="h-2" />
              </div>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="bg-accent rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-2">💡 Conseil du jour</h3>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </div>
      </div>
    </div>
  );
}
