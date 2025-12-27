import { ArrowLeft, FileHeart, Upload, Euro, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PrescriptionsPage() {
  const navigate = useNavigate();

  const prescriptions = [
    { id: 1, doctor: "Dr. Martin", date: "15 Déc 2024", status: "active", items: 3 },
    { id: 2, doctor: "Dr. Dubois", date: "01 Nov 2024", status: "expired", items: 2 },
  ];

  const reimbursements = [
    { id: 1, description: "Pharmacie", amount: "23.50", date: "20 Déc", status: "pending" },
    { id: 2, description: "Consultation", amount: "25.00", date: "15 Déc", status: "done" },
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
          <h1 className="text-lg font-bold text-foreground">Ordonnances & remboursements</h1>
          <p className="text-sm text-muted-foreground">Gérez vos prescriptions</p>
        </div>
        <FileHeart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Button variant="outline" className="w-full gap-2" size="lg">
          <Upload className="w-5 h-5" />
          Scanner une ordonnance
        </Button>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ordonnances
          </h2>
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileHeart className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{rx.doctor}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {rx.date} • {rx.items} médicaments
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${rx.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {rx.status === 'active' ? 'Active' : 'Expirée'}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Remboursements
          </h2>
          {reimbursements.map((r) => (
            <div
              key={r.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{r.description}</h3>
                <p className="text-sm text-muted-foreground">{r.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{r.amount} €</p>
                <span className={`text-xs ${r.status === 'done' ? 'text-green-600' : 'text-orange-500'}`}>
                  {r.status === 'done' ? 'Remboursé' : 'En cours'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
