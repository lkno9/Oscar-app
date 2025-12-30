import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Bell, Heart, Activity, Brain, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useFamilyMessages } from '@/hooks/useFamilyMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SeniorStatus {
  id: string;
  name: string;
  avatar: string | null;
  lastMood?: number;
  lastMoodTime?: string;
  lastActivity?: string;
  lastActivityTime?: string;
  unreadMessages: number;
}

export default function FamilyDashboard() {
  const { user } = useAuth();
  const { linkedSeniors, loading: linksLoading } = useFamilyLinks();
  const { unreadCount } = useFamilyMessages();
  const { toast } = useToast();
  const [seniors, setSeniors] = useState<SeniorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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
          .select('mood_level, created_at')
          .eq('user_id', link.senior_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get last activity
        const { data: activityData } = await supabase
          .from('wellness_activities')
          .select('activity_type, created_at')
          .eq('user_id', link.senior_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: link.senior_id,
          name: profile?.full_name || 'Senior',
          avatar: profile?.avatar_url,
          lastMood: moodData?.mood_level,
          lastMoodTime: moodData?.created_at,
          lastActivity: activityData?.activity_type,
          lastActivityTime: activityData?.created_at,
          unreadMessages: 0
        };
      })
    );

    setSeniors(seniorsData);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchNotificationCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('family_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotificationCount(count || 0);
  };

  useEffect(() => {
    if (!linksLoading) {
      fetchSeniorsStatus();
      fetchNotificationCount();
    }
  }, [linkedSeniors, linksLoading, user]);

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('family-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          setNotificationCount(prev => prev + 1);
          
          // Show toast for new notifications
          toast({
            title: notification.title,
            description: notification.message || 'Nouvelle notification reçue',
          });
          
          // Refresh senior data if it's a mood or activity notification
          if (notification.type === 'mood' || notification.type === 'activity') {
            fetchSeniorsStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSeniorsStatus();
    fetchNotificationCount();
  };

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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/family/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/family/messages">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Discuter'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/family/notifications">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center relative">
                  <Bell className="w-5 h-5 text-orange-500" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Alertes</p>
                  <p className="text-xs text-muted-foreground">
                    {notificationCount > 0 ? `${notificationCount} nouvelle${notificationCount > 1 ? 's' : ''}` : 'Notifications'}
                  </p>
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
                        <div className="relative">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={senior.avatar || undefined} />
                            <AvatarFallback className="text-lg">
                              {senior.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {senior.lastMood && (
                            <span className="absolute -bottom-1 -right-1 text-lg">
                              {getMoodEmoji(senior.lastMood)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{senior.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={getMoodColor(senior.lastMood)}>
                              {senior.lastMoodTime 
                                ? format(new Date(senior.lastMoodTime), "d MMM", { locale: fr })
                                : 'Pas de données'}
                            </Badge>
                            {senior.lastActivity && (
                              <Badge variant="outline" className="text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                {senior.lastActivity}
                              </Badge>
                            )}
                          </div>
                          {senior.lastMoodTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Dernière activité : {format(new Date(senior.lastMoodTime), "EEEE 'à' HH:mm", { locale: fr })}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <Button variant="ghost" size="sm">
                            Détails
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
