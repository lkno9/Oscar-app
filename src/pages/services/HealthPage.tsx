import { useState, useEffect } from "react";
import { ArrowLeft, Pill, Clock, Plus, Check, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  is_active: boolean;
  notes: string | null;
}

export function HealthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user) fetchMedications();
  }, [user]);

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      toast.error("Erreur lors du chargement des médicaments");
    } else {
      setMedications(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Veuillez entrer un nom de médicament");
      return;
    }

    const { error } = await supabase.from("medications").insert({
      user_id: user?.id,
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      notes: notes || null,
      is_active: true,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Médicament ajouté !");
      setName("");
      setDosage("");
      setFrequency("");
      setNotes("");
      setShowForm(false);
      fetchMedications();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("medications")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      fetchMedications();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Médicament supprimé");
      fetchMedications();
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
          <h1 className="text-lg font-bold text-foreground">Santé & médicaments</h1>
          <p className="text-sm text-muted-foreground">Suivi de vos traitements</p>
        </div>
        <Pill className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!showForm ? (
          <Button className="w-full gap-2" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Ajouter un médicament
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau médicament</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du médicament *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Doliprane 1000mg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ex: 1 comprimé"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Ex: 2 fois par jour"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires"
              />
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {medications.length > 0 ? "Mes médicaments" : "Aucun médicament"}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            medications.map((med) => (
              <div
                key={med.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleActive(med.id, med.is_active)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      med.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                    }`}
                  >
                    {med.is_active ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <Pill className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${med.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {med.name}
                    </h3>
                    {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
                {(med.frequency || med.notes) && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {med.frequency && (
                      <span className="px-3 py-1 bg-secondary rounded-full text-sm text-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {med.frequency}
                      </span>
                    )}
                  </div>
                )}
                {med.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">{med.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
