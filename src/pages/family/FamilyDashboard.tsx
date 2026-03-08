import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Bell, Heart, Activity, Settings, RefreshCw, Clock, UserPlus, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
  };

  const fetchSeniorsStatus = async () => {
    if (linkedSeniors.length === 0) { setLoading(false); return; }
    const seniorsData = await Promise.all(
      linkedSeniors.map(async (link) => {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', link.senior_id).single();
        const { data: moodData } = await supabase.from('mood_entries').select('mood_level, created_at').eq('user_id', link.senior_id).order('created_at', { ascending: false }).limit(1).single();
        const { data: activityData } = await supabase.from('wellness_activities').select('activity_type, created_at').eq('user_id', link.senior_id).order('created_at', { ascending: false }).limit(1).single();
        return { id: link.senior_id, name: profile?.full_name || 'Senior', avatar: profile?.avatar_url, lastMood: moodData?.mood_level, lastMoodTime: moodData?.created_at, lastActivity: activityData?.activity_type, lastActivityTime: activityData?.created_at, unreadMessages: 0 };
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
  useEffect(() => { if (!linksLoading) { fetchSeniorsStatus(); fetchNotificationCount(); } }, [linkedSeniors, linksLoading, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('family-notifications-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'family_notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
      const notification = payload.new as any;
      setNotificationCount(prev => prev + 1);
      toast({ title: notification.title, description: notification.message || 'Nouvelle notification reçue' });
      if (notification.type === 'mood' || notification.type === 'activity') fetchSeniorsStatus();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, toast]);

  const handleRefresh = () => { setRefreshing(true); fetchSeniorsStatus(); fetchNotificationCount(); };

  const getMoodEmoji = (level?: number) => { if (!level) return '😐'; if (level >= 4) return '😊'; if (level >= 3) return '🙂'; if (level >= 2) return '😐'; return '😔'; };
  const getMoodLabel = (level?: number) => { if (!level) return 'Pas de données'; if (level >= 4) return 'Très bien'; if (level >= 3) return 'Bien'; if (level >= 2) return 'Moyen'; return 'Pas bien'; };
  const getMoodCardBg = (level?: number) => { if (!level) return 'bg-white'; if (level >= 4) return 'bg-emerald-50/60'; if (level >= 3) return 'bg-amber-50/60'; return 'bg-rose-50/60'; };

  const tips = [
    "Prenez régulièrement des nouvelles de vos proches. Un simple message peut illuminer leur journée !",
    "Encouragez vos proches à noter leur humeur quotidiennement pour mieux suivre leur bien-être.",
    "Un appel de 5 minutes par jour peut faire une grande différence dans la vie de vos proches.",
    "N'hésitez pas à féliciter vos proches quand ils maintiennent une bonne routine de bien-être."
  ];
  const dailyTip = tips[new Date().getDay() % tips.length];

  if (loading || linksLoading) {
    return (
      <div className="min-h-screen bg-stone-50 pb-24">
        <div className="px-6 pt-14 pb-6">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-8 w-52 mb-2" />
        </div>
        <div className="px-5 space-y-4">
          <div className="flex gap-3"><Skeleton className="h-24 flex-1 rounded-2xl" /><Skeleton className="h-24 flex-1 rounded-2xl" /></div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="px-6 pt-14 pb-2">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Espace Famille</p>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              {userName ? `Bonjour, ${userName}` : 'Bonjour'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 h-9 w-9">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/family/settings">
              <Button variant="ghost" size="icon" className="rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link to="/family/messages" className="flex-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 h-5 bg-blue-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>
              <p className="font-semibold text-stone-800 text-sm">Messages</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Discuter'}</p>
            </div>
          </Link>
          <Link to="/family/notifications" className="flex-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-500" />
                </div>
                {notificationCount > 0 && (
                  <span className="px-2 h-5 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{notificationCount > 9 ? '9+' : notificationCount}</span>
                )}
              </div>
              <p className="font-semibold text-stone-800 text-sm">Alertes</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{notificationCount > 0 ? `${notificationCount} nouvelle${notificationCount > 1 ? 's' : ''}` : 'Tout va bien'}</p>
            </div>
          </Link>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-lg font-bold text-stone-800">Mes proches</h2>
        </div>

        {/* Senior Cards */}
        {seniors.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="font-bold text-lg text-stone-800 mb-2">Aucun proche lié</h3>
            <p className="text-sm text-stone-500 mb-6 max-w-[260px] mx-auto leading-relaxed">
              Demandez à votre proche son code d'invitation pour commencer à suivre son bien-être.
            </p>
            <Link to="/family/settings">
              <Button className="w-full h-12 text-base rounded-xl"><UserPlus className="w-5 h-5 mr-2" />Entrer un code</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {seniors.map((senior) => (
              <Link key={senior.id} to={`/family/senior/${senior.id}`}>
                <div className={`rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all ${getMoodCardBg(senior.lastMood)}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 shadow-sm border-2 border-white">
                        <AvatarImage src={senior.avatar || undefined} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{senior.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 text-lg">{getMoodEmoji(senior.lastMood)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-stone-800 truncate">{senior.name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">{senior.lastMoodTime ? `Dernière activité ${format(new Date(senior.lastMoodTime), "EEEE", { locale: fr })}` : 'Pas encore de données'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300 flex-shrink-0" />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-white">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-medium text-stone-400">Humeur</span>
                      </div>
                      <p className="text-xs font-bold text-stone-700">{getMoodLabel(senior.lastMood)}</p>
                    </div>
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-white">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-medium text-stone-400">Activité</span>
                      </div>
                      <p className="text-xs font-bold text-stone-700 truncate">{senior.lastActivity || '---'}</p>
                    </div>
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-white">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-medium text-stone-400">Dernière</span>
                      </div>
                      <p className="text-xs font-bold text-stone-700">{senior.lastMoodTime ? format(new Date(senior.lastMoodTime), 'd MMM', { locale: fr }) : '---'}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100/60">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-emerald-900">Conseil du jour</h3>
              <p className="text-[13px] text-emerald-700/70 mt-1 leading-relaxed">{dailyTip}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
