import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Bell, Heart, Activity, Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useFamilyMessages } from '@/hooks/useFamilyMessages';
import { supabase } from '@/integrations/supabase/client';

interface SeniorStatus {
  id: string;
  name: string;
  avatar: string | null;
  lastMood?: number;
  lastActivity?: string;
  unreadMessages: number;
}

export default function FamilyDashboard() {
  const { linkedSeniors, loading: linksLoading } = useFamilyLinks();
  const { unreadCount } = useFamilyMessages();
  const [seniors, setSeniors] = useState<SeniorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeniorsStatus = async () => {
      if (linkedSeniors.length === 0) {
        setLoading(false);
        return;
      }

      const seniorsData = await Promise.all(
        linkedSeniors.map(async (link) => {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', link.senior_id)
            .single();

          // Get last mood
          const { data: moodData } = await supabase
            .from('mood_entries')
            .select('mood_level')
            .eq('user_id', link.senior_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get last activity
          const { data: activityData } = await supabase
            .from('wellness_activities')
            .select('activity_type')
            .eq('user_id', link.senior_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: link.senior_id,
            name: profile?.full_name || 'Senior',
            avatar: profile?.avatar_url,
            lastMood: moodData?.mood_level,
            lastActivity: activityData?.activity_type,
            unreadMessages: 0
          };
        })
      );

      setSeniors(seniorsData);
      setLoading(false);
    };

    if (!linksLoading) {
      fetchSeniorsStatus();
    }
  }, [linkedSeniors, linksLoading]);

  const getMoodEmoji = (level?: number) => {
    if (!level) return '😐';
    if (level >= 4) return '😊';
    if (level >= 3) return '🙂';
    if (level >= 2) return '😐';
    return '😔';
  };

  const getMoodColor = (level?: number) => {
    if (!level) return 'bg-muted';
    if (level >= 4) return 'bg-green-500/20 text-green-700';
    if (level >= 3) return 'bg-yellow-500/20 text-yellow-700';
    return 'bg-red-500/20 text-red-700';
  };

  if (loading || linksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Espace Famille</h1>
              <p className="text-sm text-muted-foreground">Suivi de vos proches</p>
            </div>
          </div>
          <Link to="/family/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/family/messages">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Messages</p>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/family/notifications">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Alertes</p>
                  <p className="text-xs text-muted-foreground">Notifications</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Seniors List */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Mes proches
          </h2>

          {seniors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Aucun proche lié</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Demandez à votre proche de vous envoyer un code d'invitation depuis son application Oscar.
                </p>
                <Link to="/family/settings">
                  <Button>Entrer un code</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {seniors.map((senior) => (
                <Link key={senior.id} to={`/family/senior/${senior.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={senior.avatar || undefined} />
                          <AvatarFallback className="text-lg">
                            {senior.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{senior.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getMoodColor(senior.lastMood)}>
                              {getMoodEmoji(senior.lastMood)} Humeur
                            </Badge>
                            {senior.lastActivity && (
                              <Badge variant="outline" className="text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                {senior.lastActivity}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Brain className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm">Conseil du jour</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Prenez régulièrement des nouvelles de vos proches. Un simple message peut illuminer leur journée !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
