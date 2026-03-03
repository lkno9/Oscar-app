import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Pill,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Smile,
  Phone,
  Heart,
  FileText,
  Gamepad2,
  Sun,
  CloudSun,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OscarAvatar } from "@/components/OscarAvatar";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface MoodEntry { mood_level: number; }
interface UnreadMessage { id: string; content: string; created_at: string; sender_id: string; }
interface SenderProfile { id: string; full_name: string | null; }
interface CalendarEvent { id: string; title: string; event_date: string; event_time: string | null; event_type: string | null; }
interface Medication { id: string; name: string; dosage: string | null; }
interface UrgentDocument { id: string; name: string; expiration_date: string; }
interface ScamAlert { id: string; title: string; danger_level: string; }

const MOODS = [
  { level: 1, emoji: "😢", label: "Triste", color: "text-blue-500" },
  { level: 2, emoji: "😕", label: "Pas bien", color: "text-indigo-500" },
  { level: 3, emoji: "😐", label: "Correct", color: "text-yellow-500" },
  { level: 4, emoji: "🙂", label: "Bien", color: "text-green-500" },
  { level: 5, emoji: "😊", label: "Très bien", color: "text-primary" },
];

const EVENT_ICONS: Record<string, string> = {
  medical: "🏥", health: "💊", family: "👨‍👩‍👧", admin: "📋", leisure: "🎉", general: "📅",
};

export function RecapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [nextEvents, setNextEvents] = useState<CalendarEvent[]>([]);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [urgentDocs, setUrgentDocs] = useState<UrgentDocument[]>([]);
  const [scamAlerts, setScamAlerts] = useState<ScamAlert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split("T")[0];

    const [profileRes, moodRes, messagesRes, eventsRes, medsRes, docsRes, alertsRes] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("mood_entries").select("mood_level").eq("user_id", user.id).eq("entry_date", today).maybeSingle(),
      supabase.from("family_messages").select("id, content, created_at, sender_id").eq("receiver_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
      supabase.from("events").select("id, title, event_date, event_time, event_type").eq("user_id", user.id).gte("event_date", today).order("event_date").limit(3),
      supabase.from("medications").select("id, name, dosage").eq("user_id", user.id).eq("is_active", true).order("name").limit(5),
      supabase.from("documents").select("id, name, expiration_date").eq("user_id", user.id).gte("expiration_date", today).lte("expiration_date", in30DaysStr).order("expiration_date"),
      supabase.from("scam_alerts").select("id, title, danger_level").eq("is_active", true).limit(3),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (moodRes.data) setTodayMood(moodRes.data);
    if (messagesRes.data) {
      setUnreadMessages(messagesRes.data);
      const senderIds = [...new Set(messagesRes.data.map((m) => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
        if (profiles) {
          const names: Record<string, string> = {};
          (profiles as SenderProfile[]).forEach((p) => { names[p.id] = p.full_name || "Famille"; });
          setSenderNames(names);
        }
      }
    }
    if (eventsRes.data) setNextEvents(eventsRes.data);
    if (medsRes.data) setActiveMeds(medsRes.data);
    if (docsRes.data) setUrgentDocs(docsRes.data);
    if (alertsRes.data) setScamAlerts(alertsRes.data);
    setLoading(false);
  };

  const getFirstName = () => profile.full_name ? profile.full_name.split(" ")[0] : "vous";
  const moodInfo = todayMood ? MOODS.find((m) => m.level === todayMood.mood_level) : null;
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const totalAlerts = scamAlerts.length + urgentDocs.length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-5 pt-5 pb-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-4 w-32 h-32 rounded-full bg-white/30" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/20" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">
                {format(currentTime, "EEEE d MMMM", { locale: fr })}
              </p>
              <h1 className="text-2xl font-bold text-primary-foreground mt-0.5">
                {greeting}, {getFirstName()} 👋
              </h1>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground text-2xl font-bold tabular-nums">
                {format(currentTime, "HH:mm")}
              </p>
              {totalAlerts > 0 && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Bell className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-xs text-yellow-300 font-semibold">{totalAlerts} alerte{totalAlerts > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mood strip */}
          <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2.5">
            {moodInfo ? (
              <>
                <span className="text-2xl">{moodInfo.emoji}</span>
                <div>
                  <p className="text-primary-foreground text-xs font-medium">Votre humeur aujourd'hui</p>
                  <p className="text-primary-foreground font-bold text-sm">{moodInfo.label}</p>
                </div>
              </>
            ) : (
              <>
                <Smile className="w-6 h-6 text-primary-foreground/70" />
                <div className="flex-1">
                  <p className="text-primary-foreground text-xs font-medium">Comment vous sentez-vous ?</p>
                </div>
                <button
                  onClick={() => navigate("/services/health")}
                  className="bg-white/25 hover:bg-white/35 transition-colors text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-xl"
                >
                  Indiquer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <OscarAvatar size="md" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ) : (
          <div className="px-4 pb-6 -mt-4 space-y-4">

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: "📅", label: "Agenda", path: "/services/agenda", color: "bg-purple-100 dark:bg-purple-900/30" },
                { icon: "💊", label: "Santé", path: "/services/health", color: "bg-green-100 dark:bg-green-900/30" },
                { icon: "💬", label: "Famille", path: "/services/communication", color: "bg-blue-100 dark:bg-blue-900/30", badge: unreadMessages.length },
                { icon: "🆘", label: "Urgence", path: "/services/emergency", color: "bg-red-100 dark:bg-red-900/30" },
              ].map((a) => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  {a.badge ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {a.badge}
                    </span>
                  ) : null}
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-medium text-foreground leading-tight text-center">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Scam alert banner */}
            {scamAlerts.length > 0 && (
              <button
                onClick={() => navigate("/services/scam-protection")}
                className="w-full flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3 text-left"
              >
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-destructive">Alerte sécurité</p>
                  <p className="text-xs text-destructive/80 truncate">{scamAlerts[0].title}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/60 flex-shrink-0" />
              </button>
            )}

            {/* Messages famille */}
            {unreadMessages.length > 0 && (
              <SectionCard
                title="Messages famille"
                emoji="💬"
                badge={unreadMessages.length}
                onMore={() => navigate("/services/communication")}
              >
                <div className="space-y-3">
                  {unreadMessages.slice(0, 2).map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(senderNames[msg.sender_id] || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{senderNames[msg.sender_id] || "Famille"}</p>
                        <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Agenda */}
            <SectionCard
              title="Rendez-vous à venir"
              emoji="📅"
              onMore={() => navigate("/services/agenda")}
            >
              {nextEvents.length > 0 ? (
                <div className="space-y-2">
                  {nextEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 py-1">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-xl">
                        {EVENT_ICONS[ev.event_type || "general"] || "📅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                        {ev.event_time && <p className="text-xs text-muted-foreground">{ev.event_time}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">
                          {format(new Date(ev.event_date), "d MMM", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-1">Aucun rendez-vous prévu. Appuyez pour en ajouter.</p>
              )}
            </SectionCard>

            {/* Médicaments */}
            {activeMeds.length > 0 && (
              <SectionCard
                title="Mes médicaments"
                emoji="💊"
                onMore={() => navigate("/services/health")}
              >
                <div className="flex flex-wrap gap-2">
                  {activeMeds.slice(0, 4).map((med) => (
                    <span key={med.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm font-medium text-green-700 dark:text-green-400">
                      💊 {med.name}
                    </span>
                  ))}
                  {activeMeds.length > 4 && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-secondary rounded-xl text-sm text-muted-foreground">
                      +{activeMeds.length - 4}
                    </span>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Documents urgents */}
            {urgentDocs.length > 0 && (
              <SectionCard
                title="Documents à renouveler"
                emoji="📄"
                badge={urgentDocs.length}
                onMore={() => navigate("/services/documents")}
              >
                <div className="space-y-2">
                  {urgentDocs.slice(0, 2).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="flex-1 text-sm text-foreground truncate">{doc.name}</p>
                      <span className="text-xs font-semibold text-orange-600">
                        {format(new Date(doc.expiration_date), "d MMM", { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Services rapides */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2.5 px-0.5">Explorer</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "🎵", label: "Musique", desc: "Écouter de la musique", path: "/services/music" },
                  { emoji: "🎮", label: "Jeux", desc: "Sudoku, Mémoire...", path: "/services/games" },
                  { emoji: "📚", label: "Bibliothèque", desc: "Lire un article", path: "/services/library" },
                  { emoji: "🛡️", label: "Protection", desc: "Arnaque & sécurité", path: "/services/scam-protection" },
                ].map((s) => (
                  <button
                    key={s.path}
                    onClick={() => navigate(s.path)}
                    className="flex items-center gap-3 bg-card border border-border rounded-2xl px-3.5 py-3 text-left hover:shadow-md active:scale-95 transition-all"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---
interface SectionCardProps {
  title: string;
  emoji: string;
  badge?: number;
  onMore?: () => void;
  children?: React.ReactNode;
}

function SectionCard({ title, emoji, badge, onMore, children }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {badge ? (
            <span className="w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {badge}
            </span>
          ) : null}
        </div>
        {onMore && (
          <button onClick={onMore} className="flex items-center gap-0.5 text-xs text-primary font-medium">
            Voir <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
