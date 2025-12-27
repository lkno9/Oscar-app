import { ArrowLeft, AlertTriangle, Phone, MapPin, Heart, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function EmergencyPage() {
  const navigate = useNavigate();

  const emergencyContacts = [
    { id: 1, name: "SAMU", number: "15", description: "Urgences médicales" },
    { id: 2, name: "Pompiers", number: "18", description: "Incendie, accident" },
    { id: 3, name: "Police", number: "17", description: "Police secours" },
    { id: 4, name: "Urgences Europe", number: "112", description: "Numéro européen" },
  ];

  const personalContacts = [
    { id: 1, name: "Marie (fille)", relation: "Contact d'urgence", emoji: "👩" },
    { id: 2, name: "Dr. Martin", relation: "Médecin traitant", emoji: "👨‍⚕️" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-destructive/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Urgence / SOS</h1>
          <p className="text-sm text-destructive">Accès rapide aux secours</p>
        </div>
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* SOS Button */}
        <Button 
          className="w-full h-24 text-xl font-bold gap-3 bg-destructive hover:bg-destructive/90"
          size="lg"
        >
          <AlertTriangle className="w-8 h-8" />
          APPELER LES SECOURS
        </Button>

        {/* Location sharing */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-center gap-3 border border-orange-200 dark:border-orange-800">
          <MapPin className="w-6 h-6 text-orange-600" />
          <div className="flex-1">
            <p className="font-semibold text-orange-700 dark:text-orange-400">Partager ma position</p>
            <p className="text-sm text-orange-600 dark:text-orange-500">Envoyer ma localisation aux proches</p>
          </div>
          <Button size="sm" variant="outline" className="border-orange-300">
            Partager
          </Button>
        </div>

        {/* Emergency numbers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Numéros d'urgence
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {emergencyContacts.map((contact) => (
              <button
                key={contact.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-destructive transition-colors"
              >
                <span className="text-3xl font-bold text-destructive">{contact.number}</span>
                <span className="font-semibold text-foreground">{contact.name}</span>
                <span className="text-xs text-muted-foreground text-center">{contact.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Personal contacts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mes contacts d'urgence
          </h2>
          {personalContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {contact.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{contact.name}</h3>
                <p className="text-sm text-muted-foreground">{contact.relation}</p>
              </div>
              <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600">
                <Phone className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
