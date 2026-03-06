import { ArrowLeft, Image, Camera, X, Trash2, Heart, Users, ZoomIn, BookOpen, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
  title: string | null;
  created_at: string;
  album: string | null;
}

interface JournalEntry {
  id: string;
  content: string;
  title: string | null;
  created_at: string;
}

const JOURNAL_STORAGE_KEY = "oscar_journal_entries";

export function PhotosPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [receivedPhotos, setReceivedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchPhotos();
    // Load journal from localStorage
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) setJournalEntries(JSON.parse(stored));
    } catch {
      // Ignore corrupted localStorage data
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      // My photos — all uploaded by user
      setPhotos(data.filter(p => p.album !== "family_received"));
      // Family-sent photos
      setReceivedPhotos(data.filter(p => p.album === "family_received"));
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, file);
    if (uploadError) { toast.error("Erreur lors de l'upload"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-files").getPublicUrl(fileName);
    const { error: dbError } = await supabase.from("photos").insert({
      user_id: user.id,
      url: publicUrl,
      title: null,
    });
    if (dbError) toast.error("Erreur lors de l'enregistrement");
    else { toast.success("Photo ajoutée !"); fetchPhotos(); }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    // Find the photo to get its storage path
    const photo = [...photos, ...receivedPhotos].find(p => p.id === id);
    if (photo?.url && user) {
      // Extract storage path from public URL
      const match = photo.url.match(/user-files\/(.+)$/);
      if (match) {
        await supabase.storage.from("user-files").remove([match[1]]);
      }
    }
    await supabase.from("photos").delete().eq("id", id);
    toast.success("Photo supprimée");
    fetchPhotos();
    if (previewPhoto?.id === id) setPreviewPhoto(null);
  };

  const handleSaveCaption = async (id: string) => {
    await supabase.from("photos").update({ title: captionValue || null }).eq("id", id);
    toast.success("Légende enregistrée");
    setEditingCaption(null);
    fetchPhotos();
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  const saveJournalEntry = () => {
    if (!journalContent.trim()) { toast.error("Écrivez quelque chose avant de sauvegarder"); return; }
    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: journalTitle.trim() || null,
      content: journalContent.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    setJournalTitle("");
    setJournalContent("");
    setShowJournalForm(false);
    toast.success("Pensée enregistrée !");
  };

  const deleteJournalEntry = (id: string) => {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Entrée supprimée");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Photos & souvenirs</h1>
          <p className="text-sm text-muted-foreground">Vos plus beaux moments</p>
        </div>
        <Image className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="photos" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid grid-cols-2 flex-shrink-0">
            <TabsTrigger value="photos" className="flex items-center gap-1.5 text-sm">
              <Camera className="w-4 h-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4" />
              Jardin Secret
            </TabsTrigger>
          </TabsList>

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="flex-1 overflow-y-auto p-4 space-y-6 pb-8 mt-0">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

            <Button className="w-full min-h-[56px] gap-2" size="lg" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Camera className="w-6 h-6" />
              {uploading ? "Envoi en cours..." : "Ajouter une photo"}
            </Button>

            {receivedPhotos.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  Envoyées par la famille ({receivedPhotos.length})
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {receivedPhotos.map(photo => (
                    <button key={photo.id} onClick={() => setPreviewPhoto(photo)} className="aspect-square rounded-xl overflow-hidden bg-secondary relative group">
                      <img src={photo.url} alt={photo.title || ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Mes photos {photos.length > 0 && `(${photos.length})`}
              </h2>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : photos.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center border border-border">
                  <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium mb-1">Aucune photo</p>
                  <p className="text-sm text-muted-foreground">Appuyez sur "Ajouter une photo" pour commencer</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <button key={photo.id} onClick={() => setPreviewPhoto(photo)} className="aspect-square rounded-xl overflow-hidden bg-secondary relative group">
                      <img src={photo.url} alt={photo.title || ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                      {photo.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{photo.title}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          {/* JOURNAL TAB */}
          <TabsContent value="journal" className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 mt-0">
            {!showJournalForm ? (
              <Button className="w-full min-h-[56px] gap-2" size="lg" onClick={() => setShowJournalForm(true)}>
                <Plus className="w-5 h-5" />
                Écrire une pensée
              </Button>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Nouvelle entrée</h3>
                  <button onClick={() => setShowJournalForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <Input
                  value={journalTitle}
                  onChange={e => setJournalTitle(e.target.value)}
                  placeholder="Titre (optionnel)"
                />
                <textarea
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  placeholder="Écrivez ici vos pensées, vos souvenirs, vos poèmes... C'est votre espace privé."
                  className="w-full min-h-[150px] p-3 rounded-lg border border-border bg-background text-foreground text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <Button className="w-full min-h-[48px] gap-2" onClick={saveJournalEntry}>
                  <Save className="w-5 h-5" />
                  Enregistrer
                </Button>
              </div>
            )}

            {journalEntries.length === 0 && !showJournalForm ? (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Votre jardin secret est vide</p>
                <p className="text-sm text-muted-foreground">Notez vos pensées, vos souvenirs, vos poèmes... C'est votre espace privé.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {journalEntries.map(entry => (
                  <div key={entry.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {entry.title && <h3 className="font-semibold text-foreground mb-1">{entry.title}</h3>}
                        <p className="text-xs text-muted-foreground mb-2">{formatDate(entry.created_at)}</p>
                        <p className={`text-sm text-foreground whitespace-pre-wrap ${expandedEntry !== entry.id && entry.content.length > 150 ? "line-clamp-3" : ""}`}>
                          {entry.content}
                        </p>
                        {entry.content.length > 150 && (
                          <button
                            onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                            className="text-sm text-primary font-medium mt-1"
                          >
                            {expandedEntry === entry.id ? "Voir moins" : "Lire la suite"}
                          </button>
                        )}
                      </div>
                      <button onClick={() => deleteJournalEntry(entry.id)} className="p-2 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fullscreen preview modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => { setPreviewPhoto(null); setEditingCaption(null); }}>
          <div className="flex items-center justify-between p-4" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm">{formatDate(previewPhoto.created_at)}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingCaption(previewPhoto.id); setCaptionValue(previewPhoto.title || ""); }}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(previewPhoto.id)}
                className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setPreviewPhoto(null)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img src={previewPhoto.url} alt={previewPhoto.title || ""} className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
          <div className="p-4" onClick={e => e.stopPropagation()}>
            {editingCaption === previewPhoto.id ? (
              <div className="flex gap-2">
                <Input
                  value={captionValue}
                  onChange={e => setCaptionValue(e.target.value)}
                  placeholder="Ajouter une légende..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSaveCaption(previewPhoto.id)}>OK</Button>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => setEditingCaption(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-white/70 text-center text-sm">
                {previewPhoto.title || <span className="italic">Appuyez sur ✏️ pour ajouter une légende</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
