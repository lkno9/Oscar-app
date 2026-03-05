import { useState, useEffect } from "react";
import { ArrowLeft, CalendarDays, Plus, Clock, Trash2, X, MapPin, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  reminder: boolean | null;
}

const EVENT_TYPES = [
  { value: "general", label: "Général", emoji: "📅" },
  { value: "medical", label: "Médical", emoji: "🏥" },
  { value: "family", label: "Famille", emoji: "👨‍👩‍👧" },
  { value: "birthday", label: "Anniversaire", emoji: "🎂" },
  { value: "admin", label: "Administratif", emoji: "📋" },
  { value: "leisure", label: "Loisir", emoji: "🎉" },
];

function MiniCalendar({ currentMonth, events, selectedDate, onSelectDate, onMonthChange }: {
  currentMonth: Date;
  events: Event[];
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  onMonthChange: (d: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: Date[][] = [];
  let day = startDate;
  while (day <= endDate) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      row.push(day);
      day = addDays(day, 1);
    }
    rows.push(row);
  }

  const dayNames = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date();

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-bold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {rows.flatMap((row, ri) =>
          row.map((day, di) => {
            const hasEvent = events.some(e => isSameDay(new Date(e.event_date + "T00:00:00"), day));
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);
            return (
              <button
                key={`${ri}-${di}`}
                onClick={() => onSelectDate(day)}
                className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-full text-sm font-medium transition-all ${
                  !inMonth ? "text-muted-foreground/30" :
                  isSelected ? "bg-primary text-primary-foreground" :
                  isToday ? "bg-accent text-accent-foreground font-bold" :
                  "text-foreground hover:bg-secondary"
                }`}
              >
                {day.getDate()}
                {hasEvent && inMonth && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AgendaPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("general");
  const [reminder, setReminder] = useState(false);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (error) toast.error("Erreur lors du chargement");
    else setEvents(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) { toast.error("Titre et date requis"); return; }
    const { error } = await supabase.from("events").insert({
      user_id: user?.id,
      title,
      description: location ? `${description || ""}\n📍 ${location}`.trim() : (description || null),
      event_date: eventDate,
      event_time: eventTime || null,
      event_type: eventType,
      reminder,
    });
    if (error) toast.error("Erreur lors de l'ajout");
    else {
      toast.success("Événement ajouté !");
      setTitle(""); setDescription(""); setLocation(""); setEventDate(""); setEventTime(""); setEventType("general"); setReminder(false);
      setShowForm(false);
      fetchEvents();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Événement supprimé");
    fetchEvents();
  };

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr + "T00:00:00"), "EEEE d MMMM", { locale: fr }); }
    catch { return dateStr; }
  };

  const getTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];

  // Filter events for selected date or show upcoming
  const today = new Date().toISOString().split("T")[0];
  const filteredEvents = selectedDate
    ? events.filter(e => isSameDay(new Date(e.event_date + "T00:00:00"), selectedDate))
    : events.filter(e => e.event_date >= today);

  const sectionTitle = selectedDate
    ? `Événements du ${format(selectedDate, "d MMMM", { locale: fr })}`
    : filteredEvents.length > 0 ? "Prochains événements" : "Aucun événement à venir";

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Agenda & rendez-vous</h1>
          <p className="text-sm text-muted-foreground">Gérez votre calendrier</p>
        </div>
        <CalendarDays className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Calendar */}
        <MiniCalendar
          currentMonth={currentMonth}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(isSameDay(d, selectedDate ?? new Date(0)) ? null : d)}
          onMonthChange={setCurrentMonth}
        />

        {/* Upcoming birthdays */}
        {!selectedDate && (() => {
          const upcomingBirthdays = events
            .filter(e => e.event_type === "birthday" && e.event_date >= today)
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
            .slice(0, 5);
          if (upcomingBirthdays.length === 0) return null;
          return (
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎂</span>
                <p className="font-bold text-pink-700 dark:text-pink-400">Prochains anniversaires</p>
              </div>
              <div className="space-y-2">
                {upcomingBirthdays.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-pink-600 dark:text-pink-400 w-20">{format(new Date(ev.event_date + "T00:00:00"), "d MMM", { locale: fr })}</span>
                    <span className="text-sm text-foreground">{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Add button */}
        {!showForm ? (
          <Button className="w-full gap-2 min-h-[52px]" size="lg" onClick={() => { setShowForm(true); if (selectedDate) setEventDate(format(selectedDate, "yyyy-MM-dd")); }}>
            <Plus className="w-5 h-5" />
            Ajouter un rendez-vous
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau rendez-vous</h3>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* Event type */}
            <div className="flex gap-2 flex-wrap">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEventType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${eventType === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-foreground border-border"}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Rendez-vous médecin" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input id="time" type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location"><MapPin className="w-3 h-3 inline mr-1" />Lieu</Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Cabinet Dr. Dupont, Paris" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Notes</Label>
              <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Informations supplémentaires" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="reminder" className="cursor-pointer">Rappel Oscar</Label>
              </div>
              <Switch id="reminder" checked={reminder} onCheckedChange={setReminder} />
            </div>
            <Button type="submit" className="w-full min-h-[48px]">Enregistrer</Button>
          </form>
        )}

        {/* Events list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sectionTitle}</h2>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-sm text-primary font-medium">
                Tout voir
              </button>
            )}
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {selectedDate ? "Aucun événement ce jour" : "Aucun événement à venir"}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const typeInfo = getTypeInfo(event.event_type);
              return (
                <div key={event.id} className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {typeInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(event.event_date)}
                        {event.event_time && ` à ${event.event_time.slice(0, 5)}`}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{typeInfo.label}</span>
                        {event.reminder && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Bell className="w-3 h-3" />Rappel</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
