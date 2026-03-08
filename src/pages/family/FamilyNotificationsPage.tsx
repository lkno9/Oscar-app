import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, Activity, Pill, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  senior_id: string | null;
  is_read: boolean;
  created_at: string;
}

export default function FamilyNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('family_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error) setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase.channel('notifications-page-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'family_notifications', filter: `user_id=eq.${user?.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase.from('family_notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('family_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'mood': return 'bg-rose-100 dark:bg-rose-900/30';
      case 'activity': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'medication': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'alert': return 'bg-amber-100 dark:bg-amber-900/30';
      default: return 'bg-secondary';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mood': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'activity': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'medication': return <Pill className="w-4 h-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return "Aujourd'hui";
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Hier';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const groupByDate = (items: Notification[]) => {
    const groups: { date: string; label: string; items: Notification[] }[] = [];
    let currentKey = '';
    items.forEach(n => {
      const key = format(new Date(n.created_at), 'yyyy-MM-dd');
      if (key !== currentKey) { currentKey = key; groups.push({ date: key, label: getDateLabel(n.created_at), items: [n] }); }
      else groups[groups.length - 1].items.push(n);
    });
    return groups;
  };

  const filters = [
    { key: 'all', label: 'Tout' },
    { key: 'mood', label: 'Humeur' },
    { key: 'activity', label: 'Activité' },
    { key: 'medication', label: 'Médicaments' },
    { key: 'alert', label: 'Alertes' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-4 border-b border-border"><Skeleton className="h-6 w-32" /></div>
        <div className="px-4 py-3 space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/family">
            <button className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && <p className="text-xs text-primary font-semibold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary hover:bg-primary/5 text-xs rounded-full h-8 px-3">
            <Check className="w-3.5 h-3.5 mr-1" />Tout lire
          </Button>
        )}
      </header>

      {/* Filtres pills */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground border border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main>
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-8">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="font-bold text-foreground mb-2">
              {filter === 'all' ? 'Aucune notification' : 'Rien de ce type'}
            </h3>
            <p className="text-sm text-muted-foreground">Les alertes et mises à jour apparaîtront ici.</p>
          </div>
        ) : (
          <div className="pb-4">
            {groupByDate(filtered).map((group) => (
              <div key={group.date}>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                </div>
                <div className="px-4 space-y-2">
                  {group.items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`bg-card rounded-xl p-4 border border-border transition-all active:scale-[0.98] cursor-pointer ${!n.is_read ? '' : 'opacity-60'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(n.type)}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm ${!n.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{n.title}</h3>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                          </div>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1.5">{format(new Date(n.created_at), 'HH:mm', { locale: fr })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
