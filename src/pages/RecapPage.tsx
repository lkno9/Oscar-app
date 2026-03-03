import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CalendarDays,
  Pill,
  Activity,
  FileWarning,
  ShieldAlert,
  ClipboardList,
  Gamepad2,
  Phone,
  ChevronRight,
  Smile,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OscarAvatar } from "@/components/OscarAvatar";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// --- Types ---
interface MoodEntry {
  mood_level: number;
}

interface UnreadMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

interface SenderProfile {
  id: string;
  full_name: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
}

interface WellnessData {
  steps: number | null;
  steps_goal: number | null;
  sleep_minutes: number | null;
  sleep_goal_minutes: number | null;
  activity_minutes: number | null;
  activity_goal_minutes: number | null;
}

interface UrgentDocument {
  id: string;
  name: string;
  expiration_date: string;
}

interface GameSession {
  game_type: string;
  score: number | null;
  played_at: string;
}

interface CallRecord {
  contact_name: string;
  call_type: string;
  call_date: string;
}

interface ScamAlert {
  id: string;
  title: string;
  danger_level: string;
}

interface AdminTask {
  id: string;
  title: string;
  steps: unknown;
  current_step: number | null;
}

// --- Constants ---
const MOODS = [
  { level: 1, emoji: "😢", label: "Triste" },
  { level: 2, emoji: "😕", label: "Pas bien" },
  { level: 3, emoji: "😐", label: "Correct" },
  { level: 4, emoji: "🙂", label: "Bien" },
  { level: 5, emoji: "😊", label: "Très bien" },
];

const EVENT_ICONS: Record<string, string> = {
  medical: "🏥",
  health: "💊",
  family: "👨‍👩‍👧",
  admin: "📋",
  leisure: "🎉",
  general: "📅",
};

const GAME_LABELS: Record<string, string> = {
  "2048": "2048",
  memory: "Mémoire",
  sudoku: "Sudoku",
  quiz: "Quiz Culture",
};

export function RecapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [nextEvents, setNextEvents] = useState<CalendarEvent[]>([]);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [wellness, setWellness] = useState<WellnessData | null>(null);
  const [urgentDocs, setUrgentDocs] = useState<UrgentDocument[]>([]);
  const [lastGame, setLastGame] = useState<GameSession | null>(null);
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const [scamAlerts, setScamAlerts] = useState<ScamAlert[]>([]);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split("T")[0];

    const [
      profileRes,
      moodRes,
      messagesRes,
      eventsRes,
      medsRes,
      wellnessRes,
      docsRes,
      gameRes,
      callRes,
      alertsRes,
      tasksRes,
    ] = await Promise.all([
      // Profile
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      // Today's mood
      supabase.from("mood_entries").select("mood_level").eq("user_id", user.id).eq("entry_date", today).maybeSingle(),
      // Unread messages
      supabase.from("family_messages").select("id, content, created_at, sender_id").eq("receiver_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
      // Next events
      supabase.from("events").select("id, title, event_date, event_time, event_type").eq("user_id", user.id).gte("event_date", today).order("event_date").limit(3),
      // Active medications
      supabase.from("medications").select("id, name, dosage").eq("user_id", user.id).eq("is_active", true).order("name").limit(5),
      // Today's wellness
      supabase.from("daily_wellness").select("steps, steps_goal, sleep_minutes, sleep_goal_minutes, activity_minutes, activity_goal_minutes").eq("user_id", user.id).eq("entry_date", today).maybeSingle(),
      // Documents expiring within 30 days
      supabase.from("documents").select("id, name, expiration_date").eq("user_id", user.id).gte("expiration_date", today).lte("expiration_date", in30DaysStr).order("expiration_date"),
      // Last game
      supabase.from("game_sessions").select("game_type, score, played_at").eq("user_id", user.id).order("played_at", { ascending: false }).limit(1).maybeSingle(),
      // Last call
      supabase.from("call_history").select("contact_name, call_type, call_date").eq("user_id", user.id).order("call_date", { ascending: false }).limit(1).maybeSingle(),
      // Active scam alerts
      supabase.from("scam_alerts").select("id, title, danger_level").eq("is_active", true).limit(3),
      // Admin tasks in progress
      supabase.from("administrative_tasks").select("id, title, steps, current_step").eq("user_id", user.id).eq("status", "in_progress").limit(3),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (moodRes.data) setTodayMood(moodRes.data);
    if (messagesRes.data) {
      setUnreadMessages(messagesRes.data);
      // Fetch sender names
      const senderIds = [...new Set(messagesRes.data.map((m) => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);
        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach((p: SenderProfile) => {
            names[p.id] = p.full_name || "Famille";
          });
          setSenderNames(names);
        }
      }
    }
    if (eventsRes.data) setNextEvents(eventsRes.data);
    if (medsRes.data) setActiveMeds(medsRes.data);
    if (wellnessRes.data) setWellness(wellnessRes.data);
    if (docsRes.data) setUrgentDocs(docsRes.data);
    if (gameRes.data) setLastGame(gameRes.data);
    if (callRes.data) setLastCall(callRes.data);
    if (alertsRes.data) setScamAlerts(alertsRes.data);
    if (tasksRes.data) setAdminTasks(tasksRes.data);

    setLoading(false);
  };

  // --- Helpers ---
  const getFirstName = () => {
    if (!profile.full_name) return "vous";
    return profile.full_name.split(" ")[0];
  };

  const formatRelative = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return "";
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getStepsCount = (steps: unknown): number => {
    if (!steps) return 0;
    try {
      const parsed = JSON.parse(steps as string);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const progressPercent = (value: number | null, goal: number | null) => {
    if (!value || !goal || goal === 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const moodInfo = todayMood ? MOODS.find((m) => m.level === todayMood.mood_level) : null;

  // --- Render ---
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <OscarAvatar size="sm" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              Bonjour {getFirstName()} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </p>
          </div>
          {/* Mood badge */}
          {moodInfo ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
              <span className="text-lg">{moodInfo.emoji}</span>
              <span className="text-xs font-medium text-primary">{moodInfo.label}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate("/services/health")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Smile className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Humeur ?</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <OscarAvatar size="md" />
              <p className="text-muted-foreground text-sm">Chargement de votre récap...</p>
            </div>
          </div>
        ) : (
          <>
            {/* === SCAM ALERTS (priority, shown first if any) === */}
            {scamAlerts.length > 0 && (
              <DashboardCard
                icon={<ShieldAlert className="w-5 h-5" />}
                iconBg="bg-destructive/10"
                iconColor="text-destructive"
                title={`${scamAlerts.length} alerte${scamAlerts.length > 1 ? "s" : ""} sécurité`}
                onClick={() => navigate("/services/scam-protection")}
              >
                <div className="space-y-1.5">
                  {scamAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          alert.danger_level === "high"
                            ? "bg-destructive"
                            : alert.danger_level === "medium"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <p className="text-sm text-foreground truncate">{alert.title}</p>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {/* === UNREAD MESSAGES === */}
            {unreadMessages.length > 0 && (
              <DashboardCard
                icon={<MessageSquare className="w-5 h-5" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600"
                title={`${unreadMessages.length} message${unreadMessages.length > 1 ? "s" : ""} non lu${unreadMessages.length > 1 ? "s" : ""}`}
                onClick={() => navigate("/services/communication")}
                badge={unreadMessages.length}
              >
                <div className="space-y-2">
                  {unreadMessages.slice(0, 2).map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">
                          {(senderNames[msg.sender_id] || "?")[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {senderNames[msg.sender_id] || "Famille"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelative(msg.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {/* === NEXT EVENTS === */}
            {nextEvents.length > 0 ? (
              <DashboardCard
                icon={<CalendarDays className="w-5 h-5" />}
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600"
                title="Prochains rendez-vous"
                onClick={() => navigate("/services/agenda")}
              >
                <div className="space-y-2">
                  {nextEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3">
                      <span className="text-lg">{EVENT_ICONS[ev.event_type || "general"] || "📅"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-primary">{formatEventDate(ev.event_date)}</p>
                        {ev.event_time && (
                          <p className="text-xs text-muted-foreground">{ev.event_time}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            ) : (
              <DashboardCard
                icon={<CalendarDays className="w-5 h-5" />}
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600"
                title="Aucun rendez-vous à venir"
                onClick={() => navigate("/services/agenda")}
                subtitle="Appuyez pour ajouter un événement"
              />
            )}

            {/* === MEDICATIONS === */}
            {activeMeds.length > 0 && (
              <DashboardCard
                icon={<Pill className="w-5 h-5" />}
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600"
                title={`${activeMeds.length} médicament${activeMeds.length > 1 ? "s" : ""} actif${activeMeds.length > 1 ? "s" : ""}`}
                onClick={() => navigate("/services/health")}
              >
                <div className="flex flex-wrap gap-2">
                  {activeMeds.slice(0, 3).map((med) => (
                    <span
                      key={med.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-full text-xs font-medium text-green-700 dark:text-green-400"
                    >
                      💊 {med.name}
                    </span>
                  ))}
                  {activeMeds.length > 3 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{activeMeds.length - 3} autre{activeMeds.length - 3 > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </DashboardCard>
            )}

            {/* === WELLNESS === */}
            {wellness && (
              <DashboardCard
                icon={<Activity className="w-5 h-5" />}
                iconBg="bg-orange-100 dark:bg-orange-900/30"
                iconColor="text-orange-600"
                title="Bien-être du jour"
                onClick={() => navigate("/services/wellness")}
              >
                <div className="grid grid-cols-3 gap-3">
                  <WellnessMetric
                    label="Pas"
                    value={wellness.steps || 0}
                    goal={wellness.steps_goal || 6000}
                    unit=""
                    color="bg-orange-500"
                  />
                  <WellnessMetric
                    label="Sommeil"
                    value={wellness.sleep_minutes ? Math.round(wellness.sleep_minutes / 60) : 0}
                    goal={wellness.sleep_goal_minutes ? Math.round(wellness.sleep_goal_minutes / 60) : 8}
                    unit="h"
                    color="bg-blue-500"
                  />
                  <WellnessMetric
                    label="Activité"
                    value={wellness.activity_minutes || 0}
                    goal={wellness.activity_goal_minutes || 30}
                    unit="min"
                    color="bg-green-500"
                  />
                </div>
              </DashboardCard>
            )}

            {/* === URGENT DOCUMENTS === */}
            {urgentDocs.length > 0 && (
              <DashboardCard
                icon={<FileWarning className="w-5 h-5" />}
                iconBg="bg-red-100 dark:bg-red-900/30"
                iconColor="text-red-600"
                title={`${urgentDocs.length} document${urgentDocs.length > 1 ? "s" : ""} expire${urgentDocs.length > 1 ? "nt" : ""} bientôt`}
                onClick={() => navigate("/services/documents")}
              >
                <div className="space-y-1.5">
                  {urgentDocs.slice(0, 2).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <p className="text-sm text-foreground truncate flex-1">{doc.name}</p>
                      <span className="text-xs text-red-600 font-medium flex-shrink-0 ml-2">
                        {formatEventDate(doc.expiration_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {/* === ADMIN TASKS === */}
            {adminTasks.length > 0 && (
              <DashboardCard
                icon={<ClipboardList className="w-5 h-5" />}
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                iconColor="text-amber-600"
                title="Démarches en cours"
                onClick={() => navigate("/services/documents")}
              >
                <div className="space-y-2">
                  {adminTasks.map((task) => {
                    const totalSteps = getStepsCount(task.steps);
                    const current = task.current_step || 0;
                    return (
                      <div key={task.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate flex-1">
                            {task.title}
                          </p>
                          {totalSteps > 0 && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {current}/{totalSteps}
                            </span>
                          )}
                        </div>
                        {totalSteps > 0 && (
                          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${Math.round((current / totalSteps) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DashboardCard>
            )}

            {/* === RECENT ACTIVITY === */}
            {(lastGame || lastCall) && (
              <DashboardCard
                icon={<Gamepad2 className="w-5 h-5" />}
                iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                iconColor="text-indigo-600"
                title="Activité récente"
              >
                <div className="space-y-2">
                  {lastGame && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎮</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {GAME_LABELS[lastGame.game_type] || lastGame.game_type} — {lastGame.score} pts
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelative(lastGame.played_at)}
                      </span>
                    </div>
                  )}
                  {lastCall && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {lastCall.call_type === "incoming" ? "📞" : lastCall.call_type === "missed" ? "📵" : "📱"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{lastCall.contact_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelative(lastCall.call_date)}
                      </span>
                    </div>
                  )}
                </div>
              </DashboardCard>
            )}

            {/* === EMPTY STATE (if absolutely nothing) === */}
            {!loading &&
              unreadMessages.length === 0 &&
              nextEvents.length === 0 &&
              activeMeds.length === 0 &&
              !wellness &&
              urgentDocs.length === 0 &&
              !lastGame &&
              !lastCall &&
              scamAlerts.length === 0 &&
              adminTasks.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <OscarAvatar size="lg" />
                  <h2 className="text-lg font-bold text-foreground">Tout est calme !</h2>
                  <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
                    Aucune notification pour le moment. Profitez de votre journée !
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

interface DashboardCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

function DashboardCard({ icon, iconBg, iconColor, title, subtitle, badge, onClick, children }: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-card transition-shadow active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {badge && badge > 0 ? (
          <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : (
          onClick && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {children && <div className="pl-13">{children}</div>}
    </button>
  );
}

interface WellnessMetricProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

function WellnessMetric({ label, value, goal, unit, color }: WellnessMetricProps) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-foreground">
        {value.toLocaleString("fr-FR")}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
