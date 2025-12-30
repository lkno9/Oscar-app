import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FileText, Upload, File, Trash2, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  name: string;
  file_url: string | null;
  file_size: string | null;
  category: string;
  created_at: string;
}

export function DocumentsPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des documents");
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) setName(file.name);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Veuillez entrer un nom");
      return;
    }

    setUploading(true);
    let fileUrl = null;
    let fileSize = null;

    if (selectedFile && user) {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
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
      fileSize = formatFileSize(selectedFile.size);
    }

    const { error } = await supabase.from("documents").insert({
      user_id: user?.id,
      name,
      file_url: fileUrl,
      file_size: fileSize,
      category,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Document ajouté !");
      setName("");
      setCategory("other");
      setSelectedFile(null);
      setShowForm(false);
      fetchDocuments();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Document supprimé");
      fetchDocuments();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

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
          <h1 className="text-lg font-bold text-foreground">Documents & démarches</h1>
          <p className="text-sm text-muted-foreground">Vos documents importants</p>
        </div>
        <FileText className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!showForm ? (
          <Button className="w-full gap-2" size="lg" onClick={() => setShowForm(true)}>
            <Upload className="w-5 h-5" />
            Ajouter un document
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau document</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du document *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carte d'identité"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="identity">Identité</option>
                <option value="health">Santé</option>
                <option value="finance">Finance</option>
                <option value="housing">Logement</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fichier (optionnel)</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Envoi en cours..." : "Ajouter"}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {documents.length > 0 ? "Mes documents" : "Aucun document"}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <File className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(doc.created_at)}
                    {doc.file_size && ` • ${doc.file_size}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <Download className="w-5 h-5 text-primary" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
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
