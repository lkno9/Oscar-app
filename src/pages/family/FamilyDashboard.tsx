import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, Settings, RefreshCw, Clock, UserPlus, ChevronRight, Sparkles, Bell, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
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

interface FamilyDashboardProps {
  onNavigate?: (tab: "accueil" | "oscar" | "messages") => void;
}

export default function FamilyDashboard({ onNavigate }: FamilyDashboardProps = {}) {
  const { user } = useAuth();
  const { linkedSeniors, loading: linksLoading } = useFamilyLinks();
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
    "Partagez des photos ou des souvenirs avec vos proches pour renforcer le lien au quotidien.",
    "Proposez une activité commune, même à distance : lecture, musique, jeu de mots...",
    "Vérifiez que vos proches ont bien pris leurs médicaments — un rappel bienveillant aide beaucoup.",
    "Demandez à Oscar un résumé hebdomadaire du bien-être de votre proche pour rester informé.",
    "Un message vocal est souvent plus chaleureux qu'un texto. Pensez-y de temps en temps !",
    "La régularité compte plus que la durée : mieux vaut un appel court chaque jour qu'un long appel une fois par mois.",
    "Pensez à varier les sujets de conversation : actualités, souvenirs, projets… la diversité nourrit l'échange.",
    "Encouragez votre proche à sortir se promener — même 15 minutes améliorent le moral.",
  ];
  const dailyTip = tips[Math.floor((new Date().getFullYear() * 366 + new Date().getMonth() * 31 + new Date().getDate()) % tips.length)];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading || linksLoading) {
    return (
      <div className="h-full bg-background overflow-y-auto">
        <div className="px-4 pt-12 pb-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-52" />
        </div>
        <div className="px-4 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto pb-6">
      {/* Header */}
      <header className="px-4 pt-10 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-foreground mt-0.5">
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
        {/* Bandeau alertes si notifs */}
        {notificationCount > 0 && (
          <Link to="/family/notifications">
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">
                {notificationCount} nouvelle{notificationCount > 1 ? 's' : ''} alerte{notificationCount > 1 ? 's' : ''}
              </p>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </Link>
        )}

        {/* Section Mes proches */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Mes proches</h2>

          {seniors.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border">
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
                  <div className={`rounded-2xl p-4 active:scale-[0.98] transition-all ${getMoodCardBg(senior.lastMood)}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-card shadow-sm">
                          <AvatarImage src={senior.avatar || undefined} />
                          <AvatarFallback className="text-base bg-primary/10 text-primary font-bold">{senior.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 text-base leading-none">{getMoodEmoji(senior.lastMood)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{senior.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {senior.lastMoodTime
                            ? `Actif ${format(new Date(senior.lastMoodTime), "EEEE d MMM", { locale: fr })}`
                            : 'Pas encore de données'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-card/80 rounded-xl p-2.5 text-center">
                        <Heart className="w-3.5 h-3.5 text-rose-400 mx-auto mb-1" />
                        <p className="text-[11px] font-semibold text-foreground leading-tight">{getMoodLabel(senior.lastMood)}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Humeur</p>
                      </div>
                      <div className="bg-card/80 rounded-xl p-2.5 text-center">
                        <Activity className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-[11px] font-semibold text-foreground leading-tight truncate">{senior.lastActivity || '---'}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Activité</p>
                      </div>
                      <div className="bg-card/80 rounded-xl p-2.5 text-center">
                        <Clock className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                        <p className="text-[11px] font-semibold text-foreground leading-tight">
                          {senior.lastMoodTime ? format(new Date(senior.lastMoodTime), 'd MMM', { locale: fr }) : '---'}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Dernière</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Card Demander à Oscar */}
        {seniors.length > 0 && (
          <button
            onClick={() => onNavigate?.("oscar")}
            className="w-full text-left rounded-2xl p-4 active:scale-[0.98] transition-all border-0"
            style={{ background: 'linear-gradient(135deg, #48A29E 0%, #38b2ac 50%, #319795 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white">Demander à Oscar</h3>
                <p className="text-xs text-white/80 mt-0.5">Résumé, conseils, suivi de vos proches</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Conseil du jour */}
        <div className="bg-accent rounded-2xl p-4 border border-primary/20">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Conseil du jour</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{dailyTip}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
