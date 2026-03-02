import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Receipt, TrendingUp, Euro, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  title: string;
  amount: number;
  payment_type: string;
  category: string | null;
  payment_date: string;
  is_recurring: boolean;
  notes: string | null;
}

export function PaymentsPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("expense");
  const [category, setCategory] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des paiements");
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !paymentDate) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const { error } = await supabase.from("payments").insert({
      user_id: user?.id,
      title,
      amount: parseFloat(amount),
      payment_type: paymentType,
      category: category || null,
      payment_date: paymentDate,
      is_recurring: isRecurring,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Paiement ajouté !");
      setTitle("");
      setAmount("");
      setCategory("");
      setPaymentDate("");
      setIsRecurring(false);
      setShowForm(false);
      fetchPayments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Paiement supprimé");
      fetchPayments();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const totalExpenses = payments
    .filter(p => p.payment_type === "expense")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalIncome = payments
    .filter(p => p.payment_type === "income")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
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
            <span className="text-sm opacity-80">Résumé</span>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Dépenses</p>
              <p className="text-xl font-bold">{totalExpenses.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Revenus</p>
              <p className="text-xl font-bold">{totalIncome.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {!showForm ? (
          <Button className="w-full gap-2" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Ajouter un paiement
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau paiement</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Libellé *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: EDF Électricité"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Énergie"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring" className="text-sm">Paiement récurrent</Label>
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {payments.length > 0 ? "Historique" : "Aucun paiement"}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {payment.payment_type === "income" ? (
                    <Euro className="w-6 h-6 text-green-600" />
                  ) : (
                    <Receipt className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{payment.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(payment.payment_date)}
                    {payment.category && ` • ${payment.category}`}
                    {payment.is_recurring && " 🔄"}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className={`font-bold ${payment.payment_type === "income" ? "text-green-600" : "text-foreground"}`}>
                    {payment.payment_type === "income" ? "+" : "-"}{Number(payment.amount).toFixed(2)} €
                  </p>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
