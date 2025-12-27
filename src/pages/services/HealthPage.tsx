import { ArrowLeft, Pill, Clock, Bell, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HealthPage() {
  const navigate = useNavigate();

  const medications = [
    { id: 1, name: "Doliprane 1000mg", dosage: "1 comprimé", times: ["08:00", "20:00"], taken: true },
    { id: 2, name: "Vitamine D", dosage: "1 goutte", times: ["12:00"], taken: false },
    { id: 3, name: "Kardegic 75mg", dosage: "1 sachet", times: ["08:00"], taken: true },
  ];

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
          <h1 className="text-lg font-bold text-foreground">Santé & médicaments</h1>
          <p className="text-sm text-muted-foreground">Suivi de vos traitements</p>
        </div>
        <Pill className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Button className="w-full gap-2" size="lg">
          <Plus className="w-5 h-5" />
          Ajouter un médicament
        </Button>

        <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Rappels activés</p>
            <p className="text-sm text-muted-foreground">Vous serez notifié aux heures de prise</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Mes médicaments
          </h2>
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${med.taken ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {med.taken ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Pill className="w-6 h-6 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{med.name}</h3>
                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {med.times.map((time, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm text-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {time}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
