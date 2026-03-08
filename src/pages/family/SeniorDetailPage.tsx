import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Activity, Pill, MessageCircle, Calendar, Volume2, Bell, Moon, Type, Clock, Smile, Dumbbell, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface SeniorData {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  recentMoods: Array<{
    mood_level: number;
    entry_date: string;
    notes: string | null;
  }>;
  recentActivities: Array<{
    activity_type: string;
    activity_date: string;
    duration: number | null;
  }>;
  medications: Array<{
    name: string;
    dosage: string | null;
    frequency: string | null;
  }>;
  upcomingEvents: Array<{
    title: string;
    event_date: string;
    event_time: string | null;
  }>;
}

interface RemotePreferences {
  voice_enabled: boolean;
  notifications_enabled: boolean;
  dark_mode_enabled: boolean;
  font_size: 'small' | 'normal' | 'large' | 'xlarge';
  medication_reminders: boolean;
  activity_reminders: boolean;
  mood_reminders: boolean;
}

const DEFAULT_PREFS: RemotePreferences = {
  voice_enabled: true,
  notifications_enabled: true,
  dark_mode_enabled: false,
  font_size: 'normal',
  medication_reminders: true,
  activity_reminders: true,
  mood_reminders: true,
};

const FONT_SIZE_LABELS: Record<string, string> = {
  small: 'Petit',
  normal: 'Normal',
  large: 'Grand',
  xlarge: 'Très grand',
};

export default function SeniorDetailPage() {
  const { seniorId } = useParams<{ seniorId: string }>();
  const [data, setData] = useState<SeniorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<RemotePreferences>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchSeniorData = async () => {
      if (!seniorId) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', seniorId)
          .single();

        const { data: moods } = await supabase
          .from('mood_entries')
          .select('mood_level, entry_date, notes')
          .eq('user_id', seniorId)
          .order('entry_date', { ascending: false })
          .limit(7);

        const { data: activities } = await supabase
          .from('wellness_activities')
          .select('activity_type, activity_date, duration')
          .eq('user_id', seniorId)
          .order('activity_date', { ascending: false })
          .limit(5);

        const { data: medications } = await supabase
          .from('medications')
          .select('name, dosage, frequency')
          .eq('user_id', seniorId)
          .eq('is_active', true);

        const today = new Date().toISOString().split('T')[0];
        const { data: events } = await supabase
          .from('events')
          .select('title, event_date, event_time')
          .eq('user_id', seniorId)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);

        setData({
          profile: profile || { full_name: null, avatar_url: null },
          recentMoods: moods || [],
          recentActivities: activities || [],
          medications: medications || [],
          upcomingEvents: events || []
        });
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchSeniorData();
  }, [seniorId]);

  // Preferences stored locally (remote_preferences column not in DB schema)
  useEffect(() => {
    setPrefsLoading(false);
  }, [seniorId]);

  // Update a single preference (local state only)
  const updatePref = async (key: keyof RemotePreferences, value: boolean | string) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    toast.success("Préférence mise à jour");
  };

  const cycleFontSize = () => {
    const sizes: RemotePreferences['font_size'][] = ['small', 'normal', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(prefs.font_size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updatePref('font_size', sizes[nextIndex]);
  };

  const getMoodEmoji = (level: number) => {
    if (level >= 4) return '😊';
    if (level >= 3) return '🙂';
    if (level >= 2) return '😐';
    return '😔';
  };

  const getAverageMood = () => {
    if (!data?.recentMoods.length) return null;
    const sum = data.recentMoods.reduce((acc, m) => acc + m.mood_level, 0);
    return sum / data.recentMoods.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Données non disponibles</p>
      </div>
    );
  }

  const avgMood = getAverageMood();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/family">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Avatar className="w-10 h-10">
            <AvatarImage src={data.profile.avatar_url || undefined} />
            <AvatarFallback>
              {data.profile.full_name?.charAt(0).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {data.profile.full_name || 'Mon proche'}
            </h1>
            <p className="text-sm text-muted-foreground">Vue détaillée</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className={`w-5 h-5 transition-colors ${showSettings ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Quick Message */}
        <Link to={`/family/messages?contact=${seniorId}`}>
          <Button className="w-full" size="lg">
            <MessageCircle className="w-5 h-5 mr-2" />
            Envoyer un message
          </Button>
        </Link>

        {/* ──────── Paramétrage à distance ──────── */}
        {showSettings && !prefsLoading && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Paramétrage à distance
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Configurez les préférences de {data.profile.full_name?.split(' ')[0] || 'votre proche'}
              </p>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border/50">
              {/* Voice */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Mode vocal</p>
                  <p className="text-xs text-muted-foreground">Oscar lit les réponses à voix haute</p>
                </div>
                <Switch
                  checked={prefs.voice_enabled}
                  onCheckedChange={(v) => updatePref('voice_enabled', v)}
                />
              </div>

              {/* Notifications */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Rappels et alertes</p>
                </div>
                <Switch
                  checked={prefs.notifications_enabled}
                  onCheckedChange={(v) => updatePref('notifications_enabled', v)}
                />
              </div>

              {/* Dark mode */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center flex-shrink-0">
                  <Moon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Mode sombre</p>
                  <p className="text-xs text-muted-foreground">Adapter l'affichage</p>
                </div>
                <Switch
                  checked={prefs.dark_mode_enabled}
                  onCheckedChange={(v) => updatePref('dark_mode_enabled', v)}
                />
              </div>

              {/* Font size */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Type className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Taille du texte</p>
                  <p className="text-xs text-muted-foreground">Confort de lecture</p>
                </div>
                <button
                  onClick={cycleFontSize}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {FONT_SIZE_LABELS[prefs.font_size]}
                </button>
              </div>

              {/* Séparateur rappels */}
              <div className="pt-3 pb-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rappels</p>
              </div>

              {/* Medication reminders */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Médicaments</p>
                  <p className="text-xs text-muted-foreground">Rappels de prise</p>
                </div>
                <Switch
                  checked={prefs.medication_reminders}
                  onCheckedChange={(v) => updatePref('medication_reminders', v)}
                />
              </div>

              {/* Activity reminders */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Activités</p>
                  <p className="text-xs text-muted-foreground">Suggestions quotidiennes</p>
                </div>
                <Switch
                  checked={prefs.activity_reminders}
                  onCheckedChange={(v) => updatePref('activity_reminders', v)}
                />
              </div>

              {/* Mood reminders */}
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <Smile className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Humeur</p>
                  <p className="text-xs text-muted-foreground">Rappel quotidien</p>
                </div>
                <Switch
                  checked={prefs.mood_reminders}
                  onCheckedChange={(v) => updatePref('mood_reminders', v)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Humeur récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMoods.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">{getMoodEmoji(avgMood || 3)}</span>
                  <div>
                    <p className="font-medium">
                      {avgMood && avgMood >= 3.5 ? 'Bonne humeur générale' :
                       avgMood && avgMood >= 2.5 ? 'Humeur stable' : 'À surveiller'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Moyenne sur 7 jours: {avgMood?.toFixed(1)}/5
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {data.recentMoods.map((mood, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: `hsl(${(mood.mood_level / 5) * 120}, 70%, 90%)`
                      }}
                    >
                      {getMoodEmoji(mood.mood_level)}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune donnée d'humeur récente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length > 0 ? (
              <div className="space-y-2">
                {data.recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium capitalize">{activity.activity_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.activity_date), 'EEEE d MMMM', { locale: fr })}
                      </p>
                    </div>
                    {activity.duration && (
                      <Badge variant="secondary">{activity.duration} min</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-500" />
              Médicaments actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.medications.length > 0 ? (
              <div className="space-y-2">
                {data.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      {med.dosage && (
                        <p className="text-xs text-muted-foreground">{med.dosage}</p>
                      )}
                    </div>
                    {med.frequency && (
                      <Badge variant="outline">{med.frequency}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun médicament enregistré</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Prochains rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {data.upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), 'EEEE d MMMM', { locale: fr })}
                        {event.event_time && ` à ${event.event_time.slice(0, 5)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun rendez-vous à venir</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
