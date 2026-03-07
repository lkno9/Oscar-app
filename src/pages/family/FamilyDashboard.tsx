import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Bell, Heart, Activity, Brain, Settings, RefreshCw, Clock, UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [userName, setUserName] = useState('');

  const fetchUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (data?.full_name) {
      setUserName(data.full_name.split(' ')[0]);
    }
  };

  const fetchSeniorsStatus = async () => {
    if (linkedSeniors.length === 0) {
      setLoading(false);
      return;
    }

    const seniorsData = await Promise.all(
      linkedSeniors.map(async (link) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', link.senior_id)
          .single();

        const { data: moodData } = await supabase
          .from('mood_entries')
          .select('mood_level, created_at')
          .eq('user_id', link.senior_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

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
    fetchUserName();
  }, [user]);

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

          toast({
            title: notification.title,
            description: notification.message || 'Nouvelle notification reçue',
          });

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
    if (!level) return 'bg-muted-foreground/10 text-muted-foreground';
    if (level >= 4) return 'bg-green-500/10 text-green-700';
    if (level >= 3) return 'bg-yellow-500/10 text-yellow-700';
    return 'bg-red-500/10 text-red-700';
  };

  const getWellnessBorderColor = (mood?: number) => {
    if (!mood) return 'border-l-muted-foreground/30';
    if (mood >= 4) return 'border-l-green-500';
    if (mood >= 3) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  const tips = [
    "Prenez régulièrement des nouvelles de vos proches. Un simple message peut illuminer leur journée !",
    "Encouragez vos proches à noter leur humeur quotidiennement pour mieux suivre leur bien-être.",
    "Un appel de 5 minutes par jour peut faire une grande différence dans la vie de vos proches.",
    "N'hésitez pas à féliciter vos proches quand ils maintiennent une bonne routine de bien-être."
  ];
  const dailyTip = tips[new Date().getDay() % tips.length];

  // Skeleton loading
  if (loading || linksLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 pb-10 rounded-b-3xl">
          <Skeleton className="h-5 w-24 bg-white/20 mb-2" />
          <Skeleton className="h-7 w-48 bg-white/20 mb-1" />
          <Skeleton className="h-4 w-36 bg-white/20" />
          <div className="flex gap-3 mt-5">
            <Skeleton className="h-14 flex-1 rounded-2xl bg-white/15" />
            <Skeleton className="h-14 flex-1 rounded-2xl bg-white/15" />
          </div>
        </div>
        <div className="px-4 -mt-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Gradient Header */}
      <header className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 pb-10 sticky top-0 z-10 rounded-b-3xl shadow-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/70 font-medium">Espace Famille</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/family/settings">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white">
          {userName ? `Bonjour, ${userName}` : 'Bonjour'}
        </h1>
        <p className="text-sm text-white/70 mt-0.5">Suivi de vos proches</p>

        {/* Quick Stats Pills */}
        <div className="flex gap-3 mt-5">
          <Link to="/family/messages" className="flex-1">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                <MessageCircle className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Messages</p>
                <p className="text-[11px] text-white/60">
                  {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Discuter'}
                </p>
              </div>
            </div>
          </Link>

          <Link to="/family/notifications" className="flex-1">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                <Bell className="w-5 h-5 text-white" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Alertes</p>
                <p className="text-[11px] text-white/60">
                  {notificationCount > 0 ? `${notificationCount} nouvelle${notificationCount > 1 ? 's' : ''}` : 'Notifications'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-4">
        {/* Seniors Wellness Cards */}
        {seniors.length === 0 ? (
          <Card className="border-dashed border-2 border-primary/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Aucun proche lié</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Demandez à votre proche de vous envoyer un code d'invitation depuis son application Oscar.
              </p>
              <Link to="/family/settings">
                <Button className="w-full h-12 text-base rounded-xl">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Entrer un code
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {seniors.map((senior) => (
              <Link key={senior.id} to={`/family/senior/${senior.id}`}>
                <Card className={`border-l-4 ${getWellnessBorderColor(senior.lastMood)} hover:shadow-card transition-all active:scale-[0.98] overflow-hidden`}>
                  <CardContent className="p-4">
                    {/* Senior Header Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                          <AvatarImage src={senior.avatar || undefined} />
                          <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                            {senior.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 text-base bg-card rounded-full w-7 h-7 flex items-center justify-center shadow-sm border border-border">
                          {getMoodEmoji(senior.lastMood)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{senior.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {senior.lastMoodTime
                            ? `${format(new Date(senior.lastMoodTime), "EEEE 'à' HH:mm", { locale: fr })}`
                            : 'Pas encore de données'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                    </div>

                    {/* Mini Wellness Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`rounded-xl p-2.5 text-center ${getMoodColor(senior.lastMood)}`}>
                        <Heart className="w-4 h-4 mx-auto mb-0.5" />
                        <p className="text-[10px] font-medium opacity-70">Humeur</p>
                        <p className="text-xs font-bold">
                          {senior.lastMood ? `${senior.lastMood}/5` : '---'}
                        </p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center bg-green-500/10 text-green-700">
                        <Activity className="w-4 h-4 mx-auto mb-0.5" />
                        <p className="text-[10px] font-medium opacity-70">Activité</p>
                        <p className="text-xs font-bold truncate">
                          {senior.lastActivity || '---'}
                        </p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center bg-blue-500/10 text-blue-700">
                        <Clock className="w-4 h-4 mx-auto mb-0.5" />
                        <p className="text-[10px] font-medium opacity-70">Dernière</p>
                        <p className="text-xs font-bold">
                          {senior.lastMoodTime
                            ? format(new Date(senior.lastMoodTime), 'd MMM', { locale: fr })
                            : '---'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Tip of the Day */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent border-primary/20">
          <CardContent className="p-4 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Conseil du jour</h3>
              <p className="text-sm text-muted-foreground mt-1">{dailyTip}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
