import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FileHeart, Upload, Euro, Calendar, Trash2, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HealthRecord {
  id: string;
  title: string;
  record_type: string;
  value: string | null;
  unit: string | null;
  notes: string | null;
  record_date: string;
}

export function PrescriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<HealthRecord[]>([]);
  const [reimbursements, setReimbursements] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showReimbursementForm, setShowReimbursementForm] = useState(false);
  
  // Prescription form
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medicationCount, setMedicationCount] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Reimbursement form
  const [reimbursementDesc, setReimbursementDesc] = useState("");
  const [reimbursementAmount, setReimbursementAmount] = useState("");
  const [reimbursementDate, setReimbursementDate] = useState("");
  const [reimbursementStatus, setReimbursementStatus] = useState("pending");

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    // Fetch prescriptions
    const { data: rxData, error: rxError } = await supabase
      .from("health_records")
      .select("*")
      .eq("record_type", "prescription")
      .order("record_date", { ascending: false });

    if (rxError) {
      toast.error("Erreur lors du chargement des ordonnances");
    } else {
      setPrescriptions(rxData || []);
    }

    // Fetch reimbursements
    const { data: reimbData, error: reimbError } = await supabase
      .from("health_records")
      .select("*")
      .eq("record_type", "reimbursement")
      .order("record_date", { ascending: false });

    if (reimbError) {
      toast.error("Erreur lors du chargement des remboursements");
    } else {
      setReimbursements(reimbData || []);
    }

    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !prescriptionDate) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setUploading(true);
    let fileUrl = null;

    if (selectedFile && user) {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/prescriptions/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast.error("Erreur lors de l'upload du fichier");
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("user-files")
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("health_records").insert({
      user_id: user?.id,
      title: doctorName,
      record_type: "prescription",
      value: medicationCount || null,
      unit: fileUrl,
      notes: prescriptionNotes || null,
      record_date: prescriptionDate,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Ordonnance ajoutée !");
      setDoctorName("");
      setPrescriptionDate("");
      setMedicationCount("");
      setPrescriptionNotes("");
      setSelectedFile(null);
      setShowPrescriptionForm(false);
      fetchRecords();
    }
    setUploading(false);
  };

  const handleAddReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbursementDesc || !reimbursementAmount || !reimbursementDate) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const { error } = await supabase.from("health_records").insert({
      user_id: user?.id,
      title: reimbursementDesc,
      record_type: "reimbursement",
      value: reimbursementAmount,
      unit: "€",
      notes: reimbursementStatus,
      record_date: reimbursementDate,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Remboursement ajouté !");
      setReimbursementDesc("");
      setReimbursementAmount("");
      setReimbursementDate("");
      setReimbursementStatus("pending");
      setShowReimbursementForm(false);
      fetchRecords();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("health_records").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Élément supprimé");
      fetchRecords();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (dateStr: string) => {
    const date = new Date(dateStr);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return date < threeMonthsAgo;
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
          <h1 className="text-lg font-bold text-foreground">Ordonnances & remboursements</h1>
          <p className="text-sm text-muted-foreground">Gérez vos prescriptions</p>
        </div>
        <FileHeart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Add prescription button/form */}
        {!showPrescriptionForm ? (
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setShowPrescriptionForm(true)}>
            <Upload className="w-5 h-5" />
            Ajouter une ordonnance
          </Button>
        ) : (
          <form onSubmit={handleAddPrescription} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouvelle ordonnance</h3>
              <button type="button" onClick={() => setShowPrescriptionForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor">Médecin *</Label>
              <Input
                id="doctor"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dr. Martin"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rxDate">Date *</Label>
                <Input
                  id="rxDate"
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medCount">Nb médicaments</Label>
                <Input
                  id="medCount"
                  type="number"
                  value={medicationCount}
                  onChange={(e) => setMedicationCount(e.target.value)}
                  placeholder="Ex: 3"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Photo/Scan (optionnel)</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? selectedFile.name : "Choisir un fichier"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rxNotes">Notes</Label>
              <Input
                id="rxNotes"
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                placeholder="Informations complémentaires"
              />
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Envoi en cours..." : "Ajouter"}
            </Button>
          </form>
        )}

        {/* Prescriptions list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ordonnances
          </h2>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileHeart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucune ordonnance enregistrée</p>
              <p className="text-sm">Ajoutez vos ordonnances pour les retrouver facilement</p>
            </div>
          ) : (
            prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileHeart className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{rx.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(rx.record_date)}
                    {rx.value && ` • ${rx.value} médicaments`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isExpired(rx.record_date) 
                    ? 'bg-muted text-muted-foreground' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}>
                  {isExpired(rx.record_date) ? 'Expirée' : 'Active'}
                </span>
                <button
                  onClick={() => handleDelete(rx.id)}
                  className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add reimbursement button/form */}
        {!showReimbursementForm ? (
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setShowReimbursementForm(true)}>
            <Plus className="w-5 h-5" />
            Ajouter un remboursement
          </Button>
        ) : (
          <form onSubmit={handleAddReimbursement} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau remboursement</h3>
              <button type="button" onClick={() => setShowReimbursementForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reimbDesc">Description *</Label>
              <Input
                id="reimbDesc"
                value={reimbursementDesc}
                onChange={(e) => setReimbursementDesc(e.target.value)}
                placeholder="Ex: Pharmacie, Consultation..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reimbAmount">Montant (€) *</Label>
                <Input
                  id="reimbAmount"
                  type="number"
                  step="0.01"
                  value={reimbursementAmount}
                  onChange={(e) => setReimbursementAmount(e.target.value)}
                  placeholder="25.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reimbDate">Date *</Label>
                <Input
                  id="reimbDate"
                  type="date"
                  value={reimbursementDate}
                  onChange={(e) => setReimbursementDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reimbStatus">Statut</Label>
              <select
                id="reimbStatus"
                value={reimbursementStatus}
                onChange={(e) => setReimbursementStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="pending">En attente</option>
                <option value="done">Remboursé</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        )}

        {/* Reimbursements list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Remboursements
          </h2>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : reimbursements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Euro className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun remboursement enregistré</p>
              <p className="text-sm">Suivez vos remboursements santé ici</p>
            </div>
          ) : (
            reimbursements.map((r) => (
              <div
                key={r.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(r.record_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{r.value} €</p>
                  <span className={`text-xs ${r.notes === 'done' ? 'text-green-600' : 'text-orange-500'}`}>
                    {r.notes === 'done' ? 'Remboursé' : 'En cours'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
