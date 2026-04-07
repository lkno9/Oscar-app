import { ArrowLeft, Image, Camera, X, Trash2, Heart, Users, ZoomIn, BookOpen, Plus, Save, ImagePlus, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MEDIA_ACCEPT, IMAGE_ACCEPT, compressForUpload, validateStorageSize, isVideoFile, isVideoUrl } from "@/lib/fileUtils";

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
  images: string[];
  created_at: string;
}

const JOURNAL_STORAGE_KEY = "oscar_journal_entries";

function isRecent(dateStr: string, hoursAgo = 24): boolean {
  return Date.now() - new Date(dateStr).getTime() < hoursAgo * 60 * 60 * 1000;
}

export function PhotosPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "famille";
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
  const [journalImages, setJournalImages] = useState<string[]>([]);
  const [journalUploading, setJournalUploading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const journalFileRef = useRef<HTMLInputElement>(null);

  const newReceivedCount = receivedPhotos.filter(p => isRecent(p.created_at)).length;

  useEffect(() => {
    if (user) fetchPhotos();
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((e: any) => ({ ...e, images: e.images || [] }));
        setJournalEntries(migrated);
      }
    } catch { /* ignore */ }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setPhotos(data.filter(p => p.album !== "family_received"));
      setReceivedPhotos(data.filter(p => p.album === "family_received"));
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const isVideo = isVideoFile(file);
    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error("La vidéo est trop lourde (max 50 Mo).");
      e.target.value = ""; return;
    }
    const sizeErr = !isVideo ? validateStorageSize(file) : null;
    if (sizeErr) { toast.error(sizeErr); e.target.value = ""; return; }
    setUploading(true);
    try {
      const toUpload = isVideo ? file : await compressForUpload(file);
      const fileExt = toUpload.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, toUpload, { contentType: toUpload.type });
      if (uploadError) { toast.error("Erreur lors de l'upload"); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-files").getPublicUrl(fileName);
      const { error: dbError } = await supabase.from("photos").insert({ user_id: user.id, url: publicUrl, title: null });
      if (dbError) toast.error("Erreur lors de l'enregistrement");
      else { toast.success(isVideo ? "Vidéo ajoutée !" : "Photo ajoutée !"); fetchPhotos(); }
    } catch { toast.error("Impossible de traiter ce fichier."); }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    const photo = [...photos, ...receivedPhotos].find(p => p.id === id);
    if (photo?.url && user) {
      const match = photo.url.match(/user-files\/(.+)$/);
      if (match) await supabase.storage.from("user-files").remove([match[1]]);
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

  // Extract sender name from title "De [Name]"
  const getSenderFromTitle = (title: string | null): string => {
    if (!title) return "La famille";
    const match = title.match(/^De\s+(.+)$/i);
    return match ? match[1] : title;
  };

  // ─── Journal handlers ──────────────────────────────────

  const handleJournalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const sizeErr = validateStorageSize(file);
    if (sizeErr) { toast.error(sizeErr); return; }
    setJournalUploading(true);
    try {
      const compressed = await compressForUpload(file);
      const fileExt = compressed.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/journal/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("user-files").upload(fileName, compressed);
      if (uploadError) { toast.error("Erreur lors de l'upload"); setJournalUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-files").getPublicUrl(fileName);
      setJournalImages(prev => [...prev, publicUrl]);
      toast.success("Image ajoutée !");
    } catch { toast.error("Impossible de traiter cette image."); }
    setJournalUploading(false);
    e.target.value = "";
  };

  const removeJournalImage = (index: number) => setJournalImages(prev => prev.filter((_, i) => i !== index));

  const saveJournalEntry = () => {
    if (!journalContent.trim() && journalImages.length === 0) { toast.error("Écrivez quelque chose ou ajoutez une image"); return; }
    const entry: JournalEntry = { id: Date.now().toString(), title: journalTitle.trim() || null, content: journalContent.trim(), images: journalImages, created_at: new Date().toISOString() };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    setJournalTitle(""); setJournalContent(""); setJournalImages([]);
    setShowJournalForm(false);
    toast.success("Souvenir enregistré !");
  };

  const deleteJournalEntry = (id: string) => {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Entrée supprimée");
  };

  // ─── Photo grid component ──────────────────────────────────
  const PhotoGrid = ({ items, showSender = false }: { items: Photo[]; showSender?: boolean }) => (
    <div className="grid grid-cols-3 gap-2">
      {items.map(photo => (
        <button key={photo.id} onClick={() => setPreviewPhoto(photo)} className="aspect-square rounded-xl overflow-hidden bg-secondary relative group">
          {isVideoUrl(photo.url) ? (
            <>
              <video src={photo.url} className="w-full h-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <>
              <img src={photo.url} alt={photo.title || ""} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {showSender ? <Heart className="w-6 h-6 text-white" /> : <ZoomIn className="w-5 h-5 text-white" />}
              </div>
            </>
          )}
          {/* New badge */}
          {showSender && isRecent(photo.created_at) && (
            <div className="absolute top-1.5 left-1.5">
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                Nouveau
              </span>
            </div>
          )}
          {/* Sender name or caption */}
          {(showSender || photo.title) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-[11px] font-medium truncate">
                {showSender ? getSenderFromTitle(photo.title) : photo.title}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Warm emotional header */}
      <header className="flex-shrink-0 relative overflow-hidden">
        <div
          className="px-4 py-4 flex items-center gap-3 relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(168,85,247,0.06) 50%, rgba(244,114,182,0.06) 100%)",
            borderBottom: "1px solid rgba(45,212,191,0.12)",
          }}
        >
          <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-white/60 transition-colors" aria-label="Retour">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              Photos & souvenirs
              <Heart className="w-4 h-4 text-pink-400" />
            </h1>
            <p className="text-sm text-muted-foreground">Vos plus beaux moments en famille</p>
          </div>
          {newReceivedCount > 0 && (
            <span className="bg-pink-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-pulse">
              {newReceivedCount} nouvelle{newReceivedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid grid-cols-3 flex-shrink-0">
            <TabsTrigger value="famille" className="flex items-center gap-1 text-xs relative">
              <Heart className="w-3.5 h-3.5" />
              Famille
              {newReceivedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {newReceivedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1 text-xs">
              <Camera className="w-3.5 h-3.5" />
              Mes photos
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Jardin Secret
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: DE LA FAMILLE ═══ */}
          <TabsContent value="famille" className="flex-1 overflow-y-auto p-4 space-y-5 pb-8 mt-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : receivedPhotos.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.15), rgba(168,85,247,0.1))" }}
                >
                  <Heart className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">En attente de photos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Quand vos proches vous enverront des photos, elles apparaîtront ici.
                  Demandez-leur d'utiliser l'app pour partager leurs plus beaux moments !
                </p>
              </div>
            ) : (
              <>
                {/* Warm banner when new photos */}
                {newReceivedCount > 0 && (
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(244,114,182,0.1), rgba(168,85,247,0.08))",
                      border: "1px solid rgba(244,114,182,0.15)",
                    }}
                  >
                    <div className="text-3xl">💝</div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">
                        Votre famille pense à vous !
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {newReceivedCount} nouvelle{newReceivedCount > 1 ? 's' : ''} photo{newReceivedCount > 1 ? 's' : ''} reçue{newReceivedCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Sparkles className="w-5 h-5 text-pink-400" />
                  </div>
                )}

                {/* Featured carousel — last 3 photos large */}
                {receivedPhotos.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-pink-400" />
                      Photos récentes
                    </h2>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                      {receivedPhotos.slice(0, 5).map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setPreviewPhoto(photo)}
                          className="flex-shrink-0 w-44 rounded-2xl overflow-hidden bg-secondary relative"
                          style={{ aspectRatio: "3/4" }}
                        >
                          <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          {isRecent(photo.created_at) && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                Nouveau
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                            <p className="text-white text-sm font-medium">{getSenderFromTitle(photo.title)}</p>
                            <p className="text-white/60 text-xs">{formatDate(photo.created_at)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full grid */}
                {receivedPhotos.length > 5 && (
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Toutes les photos ({receivedPhotos.length})
                    </h2>
                    <PhotoGrid items={receivedPhotos} showSender />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ TAB 2: MES PHOTOS ═══ */}
          <TabsContent value="photos" className="flex-1 overflow-y-auto p-4 space-y-5 pb-8 mt-0">
            <input type="file" ref={fileInputRef} className="hidden" accept={MEDIA_ACCEPT} onChange={handlePhotoUpload} />

            <Button className="w-full min-h-[56px] gap-2" size="lg" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Camera className="w-6 h-6" />
              {uploading ? "Envoi en cours..." : "Ajouter une photo ou vidéo"}
            </Button>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : photos.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Aucune photo ou vidéo</p>
                <p className="text-sm text-muted-foreground">Appuyez sur le bouton ci-dessus pour ajouter des photos ou vidéos</p>
              </div>
            ) : (
              <PhotoGrid items={photos} />
            )}
          </TabsContent>

          {/* ═══ TAB 3: JARDIN SECRET ═══ */}
          <TabsContent value="journal" className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 mt-0">
            <input type="file" ref={journalFileRef} className="hidden" accept={IMAGE_ACCEPT} onChange={handleJournalImageUpload} />

            {!showJournalForm ? (
              <Button className="w-full min-h-[56px] gap-2" size="lg" onClick={() => setShowJournalForm(true)}>
                <Plus className="w-5 h-5" />
                Écrire un souvenir
              </Button>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Nouvelle entrée</h3>
                  <button onClick={() => { setShowJournalForm(false); setJournalImages([]); }}>
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <Input value={journalTitle} onChange={e => setJournalTitle(e.target.value)} placeholder="Titre (optionnel)" />
                <textarea
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  placeholder="Écrivez ici vos pensées, vos souvenirs... C'est votre espace privé."
                  className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-foreground text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                {journalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {journalImages.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeJournalImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => journalFileRef.current?.click()} disabled={journalUploading}>
                    <ImagePlus className="w-4 h-4" />
                    {journalUploading ? "..." : "Image"}
                  </Button>
                  <Button className="flex-1 min-h-[48px] gap-2" onClick={saveJournalEntry}>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {journalEntries.length === 0 && !showJournalForm ? (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Votre jardin secret est vide</p>
                <p className="text-sm text-muted-foreground">Notez vos pensées, ajoutez des photos, gardez vos souvenirs...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {journalEntries.map(entry => (
                  <div key={entry.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {entry.title && <h3 className="font-semibold text-foreground mb-1">{entry.title}</h3>}
                        <p className="text-sm text-muted-foreground mb-2">{formatDate(entry.created_at)}</p>
                        {entry.images && entry.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {entry.images.map((url, i) => (
                              <button key={i} onClick={() => setPreviewImage(url)} className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                        {entry.content && (
                          <p className={`text-sm text-foreground whitespace-pre-wrap ${expandedEntry !== entry.id && entry.content.length > 150 ? "line-clamp-3" : ""}`}>
                            {entry.content}
                          </p>
                        )}
                        {entry.content && entry.content.length > 150 && (
                          <button onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)} className="text-sm text-primary font-medium mt-1">
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

      {/* Fullscreen photo preview modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => { setPreviewPhoto(null); setEditingCaption(null); }}>
          <div className="flex items-center justify-between p-4" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm">{formatDate(previewPhoto.created_at)}</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditingCaption(previewPhoto.id); setCaptionValue(previewPhoto.title || ""); }} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                ✏️
              </button>
              <button onClick={() => handleDelete(previewPhoto.id)} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setPreviewPhoto(null)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            {isVideoUrl(previewPhoto.url) ? (
              <video src={previewPhoto.url} controls autoPlay className="max-w-full max-h-full rounded-xl" style={{ background: "#000" }} />
            ) : (
              <img src={previewPhoto.url} alt={previewPhoto.title || ""} className="max-w-full max-h-full object-contain rounded-xl" />
            )}
          </div>
          <div className="p-4" onClick={e => e.stopPropagation()}>
            {editingCaption === previewPhoto.id ? (
              <div className="flex gap-2">
                <Input value={captionValue} onChange={e => setCaptionValue(e.target.value)} placeholder="Ajouter une légende..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50" autoFocus />
                <Button size="sm" onClick={() => handleSaveCaption(previewPhoto.id)}>OK</Button>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => setEditingCaption(null)}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <p className="text-white/70 text-center text-sm">
                {previewPhoto.title || <span className="italic">Appuyez sur ✏️ pour ajouter une légende</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen journal image preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          <img src={previewImage} alt="" className="max-w-full max-h-full object-contain rounded-xl p-4" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
