import { ArrowLeft, CalendarDays, Plus, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AgendaPage() {
  const navigate = useNavigate();

  const events = [
    { id: 1, title: "Rendez-vous médecin", date: "Lun 30 Déc", time: "10:00", type: "health" },
    { id: 2, title: "Appel famille", date: "Mar 31 Déc", time: "15:00", type: "family" },
    { id: 3, title: "Renouvellement ordonnance", date: "Ven 3 Jan", time: "09:30", type: "admin" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Agenda & rendez-vous</h1>
          <p className="text-sm text-muted-foreground">Gérez vos événements</p>
        </div>
        <CalendarDays className="w-6 h-6 text-primary" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add event button */}
        <Button className="w-full gap-2" size="lg">
          <Plus className="w-5 h-5" />
          Ajouter un événement
        </Button>

        {/* Events list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Prochains événements
          </h2>
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {event.date} à {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
