import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Activity, Brain, Pill, MessageCircle, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export default function SeniorDetailPage() {
  const { seniorId } = useParams<{ seniorId: string }>();
  const [data, setData] = useState<SeniorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeniorData = async () => {
      if (!seniorId) return;

      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', seniorId)
          .single();

        // Fetch recent moods (last 7 days)
        const { data: moods } = await supabase
          .from('mood_entries')
          .select('mood_level, entry_date, notes')
          .eq('user_id', seniorId)
          .order('entry_date', { ascending: false })
          .limit(7);

        // Fetch recent activities
        const { data: activities } = await supabase
          .from('wellness_activities')
          .select('activity_type, activity_date, duration')
          .eq('user_id', seniorId)
          .order('activity_date', { ascending: false })
          .limit(5);

        // Fetch active medications
        const { data: medications } = await supabase
          .from('medications')
          .select('name, dosage, frequency')
          .eq('user_id', seniorId)
          .eq('is_active', true);

        // Fetch upcoming events
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
      } catch (err) {
        console.error('Error fetching senior data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeniorData();
  }, [seniorId]);

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
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {data.profile.full_name || 'Mon proche'}
            </h1>
            <p className="text-sm text-muted-foreground">Vue détaillée</p>
          </div>
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
