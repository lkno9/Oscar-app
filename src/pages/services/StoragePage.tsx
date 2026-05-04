import { ArrowLeft, Cloud, FileText, FolderOpen, Lock, Upload, Eye, Trash2, X, Bot, Shield, Plus, FolderPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { STORAGE_ACCEPT, compressForUpload, validateStorageSize, formatFileSize } from "@/lib/fileUtils";

interface StoredDocument {
  id: string;
  name: string;
  file_url: string | null;
  file_size: string | null;
  category: string | null;
  document_type: string | null;
  created_at: string;
}

const FOLDERS_STORAGE_KEY = "oscar_custom_folders";

function loadFolders(): string[] {
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveFolders(folders: string[]) {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

export function StoragePage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dossiers personnalisables
  const [folders, setFolders] = useState<string[]>(loadFolders);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (data) setDocuments(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedFolder) return;

    const sizeErr = validateStorageSize(file);
    if (sizeErr) { toast.error(sizeErr); e.target.value = ""; return; }

    setUploading(true);
    try {
      const processed = await compressForUpload(file);
      const fileExt = processed.name.split(".").pop() || "file";
      const fileName = `${user.id}/documents/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, processed);
      if (uploadError) { toast.error("Erreur lors de l'upload"); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-files").getPublicUrl(fileName);
      const sizeStr = formatFileSize(processed.size);
      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        name: file.name,
        file_url: publicUrl,
        file_size: sizeStr,
        category: selectedFolder,
        document_type: fileExt,
      });
      if (dbError) toast.error("Erreur lors de l'enregistrement");
      else { toast.success("Fichier ajouté !"); fetchDocuments(); }
    } catch {
      toast.error("Impossible de traiter ce fichier.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce fichier ?")) return;
    await supabase.from("documents").delete().eq("id", id);
    toast.success("Fichier supprimé");
    fetchDocuments();
    if (previewDoc?.id === id) setPreviewDoc(null);
  };

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) { toast.error("Donnez un nom au dossier"); return; }
    if (folders.includes(name)) { toast.error("Ce dossier existe déjà"); return; }
    const updated = [...folders, name];
    setFolders(updated);
    saveFolders(updated);
    setNewFolderName("");
    setShowNewFolder(false);
    toast.success(`Dossier "${name}" créé`);
  };

  const deleteFolder = (folderName: string) => {
    const count = documents.filter(d => d.category === folderName).length;
    const msg = count > 0
      ? `Supprimer le dossier "${folderName}" ? Les ${count} fichier(s) qu'il contient resteront accessibles.`
      : `Supprimer le dossier "${folderName}" ?`;
    if (!window.confirm(msg)) return;
    const updated = folders.filter(f => f !== folderName);
    setFolders(updated);
    saveFolders(updated);
    toast.success(`Dossier "${folderName}" supprimé`);
  };

  const folderDocs = selectedFolder ? documents.filter(d => d.category === selectedFolder) : [];

  const isImage = (doc: StoredDocument) => {
    const ext = (doc.document_type || "").toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={selectedFolder ? () => setSelectedFolder(null) : goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            {selectedFolder || "Mes documents"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {selectedFolder ? `${folderDocs.length} fichier(s)` : "Fichiers et dossiers"}
          </p>
        </div>
        <Cloud className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {!selectedFolder ? (
          <>
            {/* Dossiers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mes dossiers</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {folders.map(folder => {
                  const count = documents.filter(d => d.category === folder).length;
                  return (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className="bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors text-left relative group"
                    >
                      <div className="text-3xl mb-2">📁</div>
                      <p className="font-semibold text-foreground text-sm">{folder}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{count} fichier{count !== 1 ? "s" : ""}</p>
                      {/* Supprimer dossier */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                        aria-label="Supprimer le dossier"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </button>
                  );
                })}

                {/* Bouton créer un dossier */}
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="bg-card rounded-xl p-4 border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center flex flex-col items-center justify-center gap-2"
                >
                  <FolderPlus className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Nouveau dossier</p>
                </button>
              </div>

              {/* Formulaire nouveau dossier */}
              {showNewFolder && (
                <div className="bg-card rounded-xl p-4 border border-primary/30 space-y-3">
                  <p className="font-semibold text-foreground text-sm">Créer un dossier</p>
                  <Input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Nom du dossier (ex: Impôts 2025)"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") addFolder(); }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addFolder} className="flex-1 min-h-[44px]">Créer</Button>
                    <Button variant="outline" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="min-h-[44px]">Annuler</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Coffre-fort numérique */}
            <button
              onClick={() => navigate("/services/vault")}
              className="w-full bg-card rounded-xl p-4 border-2 border-primary/30 hover:border-primary transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-foreground">Coffre-fort numérique</p>
                <p className="text-sm text-muted-foreground">Notes sensibles protégées par PIN</p>
              </div>
              <Shield className="w-5 h-5 text-primary" />
            </button>
          </>
        ) : (
          <>
            {/* Upload button */}
            <input type="file" ref={fileInputRef} className="hidden" accept={STORAGE_ACCEPT} onChange={handleUpload} />
            <Button className="w-full min-h-[56px] gap-2" size="lg" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-5 h-5" />
              {uploading ? "Envoi en cours..." : "Ajouter un fichier"}
            </Button>

            {/* File list */}
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : folderDocs.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Dossier vide</p>
                <p className="text-sm text-muted-foreground">Ajoutez vos fichiers ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {folderDocs.map(doc => (
                  <div key={doc.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        {isImage(doc) ? (
                          <img src={doc.file_url!} alt={doc.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <FileText className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.file_size || ""}</p>
                      </div>
                      <div className="flex gap-1">
                        {doc.file_url && (
                          <button onClick={() => setPreviewDoc(doc)} className="p-2.5 rounded-full hover:bg-secondary transition-colors">
                            <Eye className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(doc.id)} className="p-2.5 rounded-full hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    </div>
                    {doc.file_url && (
                      <button
                        onClick={() => navigate(`/?oscar_doc=${encodeURIComponent(doc.file_url!)}`)}
                        className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent border border-border text-sm font-medium text-accent-foreground hover:bg-accent/70 transition-colors"
                      >
                        <Bot className="w-4 h-4 flex-shrink-0" />
                        Demander à Oscar d'analyser ce document
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* File preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <p className="text-white font-medium truncate flex-1 mr-4">{previewDoc.name}</p>
            <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {isImage(previewDoc) ? (
              <img src={previewDoc.file_url!} alt={previewDoc.name} className="max-w-full max-h-full object-contain rounded-xl" />
            ) : (
              <div className="text-center">
                <FileText className="w-20 h-20 mx-auto text-white/50 mb-4" />
                <p className="text-white font-medium mb-4">{previewDoc.name}</p>
                <a
                  href={previewDoc.file_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Ouvrir le fichier
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
