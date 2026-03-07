import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, Activity, Pill, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

    const { data, error } = await supabase
      .from('family_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-page-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('family_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('family_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mood':
        return <Heart className="w-4.5 h-4.5 text-amber-600" />;
      case 'activity':
        return <Activity className="w-4.5 h-4.5 text-green-600" />;
      case 'medication':
        return <Pill className="w-4.5 h-4.5 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="w-4.5 h-4.5 text-red-600" />;
      default:
        return <Bell className="w-4.5 h-4.5 text-primary" />;
    }
  };

  const getUrgencyStyle = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-card border-border';
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40';
      case 'medication':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40';
      case 'mood':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40';
      case 'activity':
        return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/40';
      default:
        return 'bg-primary/5 border-primary/20';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-red-100 dark:bg-red-900/40';
      case 'medication': return 'bg-blue-100 dark:bg-blue-900/40';
      case 'mood': return 'bg-amber-100 dark:bg-amber-900/40';
      case 'activity': return 'bg-green-100 dark:bg-green-900/40';
      default: return 'bg-primary/10';
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

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  // Group by date
  const groupByDate = (items: Notification[]) => {
    const groups: { date: string; label: string; items: Notification[] }[] = [];
    let currentDateKey = '';

    items.forEach(n => {
      const dateKey = format(new Date(n.created_at), 'yyyy-MM-dd');
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        groups.push({
          date: dateKey,
          label: getDateLabel(n.created_at),
          items: [n]
        });
      } else {
        groups[groups.length - 1].items.push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/family">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-primary font-medium">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-primary hover:text-primary hover:bg-primary/10 text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Tout lire
            </Button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full bg-muted/50 p-1 h-auto">
            <TabsTrigger value="all" className="text-xs flex-1 py-2 rounded-lg">
              Tout
            </TabsTrigger>
            <TabsTrigger value="mood" className="text-xs flex-1 py-2 rounded-lg">
              Humeur
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs flex-1 py-2 rounded-lg">
              Activité
            </TabsTrigger>
            <TabsTrigger value="alert" className="text-xs flex-1 py-2 rounded-lg">
              Alertes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-base mb-2">
              {filter === 'all' ? 'Aucune notification' : 'Aucune notification de ce type'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Les alertes et mises à jour apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="pb-4">
            {groupedNotifications.map((group) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="sticky top-[65px] z-[5] bg-background/95 backdrop-blur-sm py-2 px-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </p>
                </div>

                {/* Notification Cards */}
                <div className="px-4 space-y-2">
                  {group.items.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all active:scale-[0.98] border
                        ${getUrgencyStyle(notification.type, notification.is_read)}
                        ${!notification.is_read ? 'shadow-sm' : ''}`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`text-sm ${!notification.is_read ? 'font-bold' : 'font-medium'}`}>
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                              {format(new Date(notification.created_at), 'HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
