import { ArrowLeft, CreditCard, Receipt, TrendingUp, Euro } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PaymentsPage() {
  const navigate = useNavigate();

  const bills = [
    { id: 1, name: "EDF Électricité", amount: "85.40", dueDate: "15 Jan", status: "pending" },
    { id: 2, name: "Internet Orange", amount: "39.99", dueDate: "20 Jan", status: "pending" },
    { id: 3, name: "Assurance habitation", amount: "45.00", dueDate: "01 Fév", status: "paid" },
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
          <h1 className="text-lg font-bold text-foreground">Paiements & factures</h1>
          <p className="text-sm text-muted-foreground">Gérez vos finances</p>
        </div>
        <CreditCard className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary card */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm opacity-80">Factures en attente</span>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">125,39 €</p>
          <p className="text-sm opacity-80 mt-1">2 factures à payer</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Factures
          </h2>
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{bill.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Échéance : {bill.dueDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{bill.amount} €</p>
                <span className={`text-xs ${bill.status === 'paid' ? 'text-primary' : 'text-orange-500'}`}>
                  {bill.status === 'paid' ? 'Payée' : 'En attente'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full gap-2" size="lg">
          <Euro className="w-5 h-5" />
          Payer les factures
        </Button>
      </div>
    </div>
  );
}
