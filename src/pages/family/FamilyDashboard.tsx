import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Bell, Heart, Activity, Settings, RefreshCw, Clock, UserPlus, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useFamilyMessages } from '@/hooks/useFamilyMessages';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface SeniorStatus {
  id: string;
  name: string;
  avatar: string | null;
  lastMood?: number;
  lastMoodTime?: string;
  lastActivity?: string;
  lastActivityTime?: string;
}

export default function FamilyDashboard() {
  const { user } = useAuth();
  const { linkedSeniors, loading: linksLoading } = useFamilyLinks();
  const { unreadCount } = useFamilyMessages();
  const [seniors, setSeniors] = useState<SeniorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  const fetchUserName = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
  };

  const fetchSeniorsStatus = async () => {
    if (linkedSeniors.length === 0) { setLoading(false); return; }
    const seniorsData = await Promise.all(
      linkedSeniors.map(async (link) => {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', link.senior_id).single();
        const { data: moodData } = await supabase.from('mood_entries').select('mood_level, created_at').eq('user_id', link.senior_id).order('created_at', { ascending: false }).limit(1).single();
        const { data: activityData } = await supabase.from('wellness_activities').select('activity_type, created_at').eq('user_id', link.senior_id).order('created_at', { ascending: false }).limit(1).single();
        return {
          id: link.senior_id,
          name: profile?.full_name || 'Senior',
          avatar: profile?.avatar_url || null,
          lastMood: moodData?.mood_level,
          lastMoodTime: moodData?.created_at,
          lastActivity: activityData?.activity_type,
          lastActivityTime: activityData?.created_at,
        };
      })
    );
    setSeniors(seniorsData);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchNotificationCount = async () => {
    if (!user) return;
    const { count } = await supabase.from('family_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    setNotificationCount(count || 0);
  };

  useEffect(() => { fetchUserName(); }, [user]);
  useEffect(() => {
    if (!linksLoading) { fetchSeniorsStatus(); fetchNotificationCount(); }
  }, [linkedSeniors, linksLoading, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('family-dash-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'family_notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as { title: string; message?: string; type: string };
        setNotificationCount(prev => prev + 1);
        toast(n.title, { description: n.message });
        if (n.type === 'mood' || n.type === 'activity') fetchSeniorsStatus();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleRefresh = () => { setRefreshing(true); fetchSeniorsStatus(); fetchNotificationCount(); };

  const getMoodEmoji = (level?: number) => {
    if (!level) return '😐';
    if (level >= 4) return '😊';
    if (level >= 3) return '🙂';
    if (level >= 2) return '😐';
    return '😔';
  };
  const getMoodLabel = (level?: number) => {
    if (!level) return 'Pas de données';
    if (level >= 4) return 'Très bien';
    if (level >= 3) return 'Bien';
    if (level >= 2) return 'Moyen';
    return 'Pas bien';
  };
  const getMoodCardBg = (level?: number) => {
    if (!level) return 'bg-card border border-border';
    if (level >= 4) return 'bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900';
    if (level >= 3) return 'bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900';
    return 'bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900';
  };

  const tips = [
    "Prenez régulièrement des nouvelles de vos proches. Un simple message peut illuminer leur journée !",
    "Encouragez vos proches à noter leur humeur quotidiennement pour mieux suivre leur bien-être.",
    "Un appel de 5 minutes par jour peut faire une grande différence dans la vie de vos proches.",
    "N'hésitez pas à féliciter vos proches quand ils maintiennent une bonne routine de bien-être.",
  ];
  const dailyTip = tips[new Date().getDay() % tips.length];

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading || linksLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-12 pb-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-52" />
        </div>
        <div className="px-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-24 flex-1 rounded-xl" />
            <Skeleton className="h-24 flex-1 rounded-xl" />
            <Skeleton className="h-24 flex-1 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{getHour()}</p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              {userName ? `${userName} 👋` : 'Espace Famille 👋'}
            </h1>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="rounded-full h-9 w-9 text-muted-foreground hover:bg-secondary">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/family/settings">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-secondary">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-5">
        {/* Quick Actions — 3 colonnes */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/family/messages">
            <div className="bg-card rounded-xl p-4 border border-border active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 h-4 bg-primary rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>
              <p className="font-semibold text-foreground text-xs">Messages</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Discuter'}</p>
            </div>
          </Link>

          <Link to="/family/chat">
            <div className="bg-card rounded-xl p-4 border border-border active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="font-semibold text-foreground text-xs">Chat Oscar</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Assistant IA</p>
            </div>
          </Link>

          <Link to="/family/notifications">
            <div className="bg-card rounded-xl p-4 border border-border active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-500" />
                </div>
                {notificationCount > 0 && (
                  <span className="px-1.5 h-4 bg-amber-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{notificationCount > 9 ? '9+' : notificationCount}</span>
                )}
              </div>
              <p className="font-semibold text-foreground text-xs">Alertes</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{notificationCount > 0 ? `${notificationCount} nouvelle${notificationCount > 1 ? 's' : ''}` : 'Tout va bien'}</p>
            </div>
          </Link>
        </div>

        {/* Section Mes proches */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mes proches</h2>

          {seniors.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="font-bold text-foreground mb-2">Aucun proche lié</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[260px] mx-auto leading-relaxed">
                Demandez à votre proche son code d'invitation pour commencer à suivre son bien-être.
              </p>
              <Link to="/family/settings">
                <Button className="w-full gap-2 min-h-[52px]" size="lg">
                  <UserPlus className="w-5 h-5" />
                  Entrer un code
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {seniors.map((senior) => (
                <Link key={senior.id} to={`/family/senior/${senior.id}`}>
                  <div className={`rounded-xl p-4 active:scale-[0.98] transition-all ${getMoodCardBg(senior.lastMood)}`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border-2 border-card shadow-sm">
                          <AvatarImage src={senior.avatar || undefined} />
                          <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{senior.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 text-lg leading-none">{getMoodEmoji(senior.lastMood)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-foreground truncate">{senior.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {senior.lastMoodTime
                            ? `Dernière activité ${format(new Date(senior.lastMoodTime), "EEEE", { locale: fr })}`
                            : 'Pas encore de données'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-card/80 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[10px] font-medium text-muted-foreground">Humeur</span>
                        </div>
                        <p className="text-xs font-bold text-foreground">{getMoodLabel(senior.lastMood)}</p>
                      </div>
                      <div className="flex-1 bg-card/80 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] font-medium text-muted-foreground">Activité</span>
                        </div>
                        <p className="text-xs font-bold text-foreground truncate">{senior.lastActivity || '---'}</p>
                      </div>
                      <div className="flex-1 bg-card/80 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] font-medium text-muted-foreground">Dernière</span>
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          {senior.lastMoodTime ? format(new Date(senior.lastMoodTime), 'd MMM', { locale: fr }) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Conseil du jour */}
        <div className="bg-accent rounded-xl p-4 border border-primary/20">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Conseil du jour</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{dailyTip}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
