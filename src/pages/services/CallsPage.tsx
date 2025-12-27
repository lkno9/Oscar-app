import { ArrowLeft, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CallsPage() {
  const navigate = useNavigate();

  const calls = [
    { id: 1, name: "Marie (fille)", type: "incoming", time: "Aujourd'hui, 14:30", duration: "12 min" },
    { id: 2, name: "Dr. Martin", type: "outgoing", time: "Hier, 10:15", duration: "5 min" },
    { id: 3, name: "Pierre (fils)", type: "missed", time: "Lun, 18:00", duration: null },
  ];

  const getCallIcon = (type: string) => {
    switch (type) {
      case "incoming": return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case "outgoing": return <PhoneOutgoing className="w-5 h-5 text-blue-500" />;
      case "missed": return <PhoneMissed className="w-5 h-5 text-destructive" />;
      default: return <Phone className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Appels & visios</h1>
          <p className="text-sm text-muted-foreground">Historique des appels</p>
        </div>
        <Phone className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-auto py-4 flex-col gap-2" size="lg">
            <Phone className="w-6 h-6" />
            <span>Appel audio</span>
          </Button>
          <Button variant="secondary" className="h-auto py-4 flex-col gap-2" size="lg">
            <Video className="w-6 h-6" />
            <span>Appel vidéo</span>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Historique
          </h2>
          {calls.map((call) => (
            <div
              key={call.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                {getCallIcon(call.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{call.name}</h3>
                <p className="text-sm text-muted-foreground">{call.time}</p>
              </div>
              {call.duration && (
                <span className="text-sm text-muted-foreground">{call.duration}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
