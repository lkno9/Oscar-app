import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Shield, Key, Plus, Trash2, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SecureNote {
  id: string;
  title: string;
  content: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
}

export function VaultPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<SecureNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [revealedNotes, setRevealedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("secure_notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erreur lors du chargement des notes");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Veuillez entrer un titre");
      return;
    }

    const { error } = await supabase.from("secure_notes").insert({
      user_id: user?.id,
      title,
      content: content || null,
      category,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Élément ajouté au coffre-fort !");
      setTitle("");
      setContent("");
      setCategory("general");
      setShowForm(false);
      fetchNotes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    const { error } = await supabase.from("secure_notes").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Élément supprimé");
      fetchNotes();
    }
  };

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedNotes);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealedNotes(newRevealed);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "payment": return "💳";
      case "security": return "🔐";
      case "network": return "📶";
      case "health": return "🏥";
      default: return "📝";
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
          <h1 className="text-lg font-bold text-foreground">Coffre-fort numérique</h1>
          <p className="text-sm text-muted-foreground">Vos données sécurisées</p>
        </div>
        <Lock className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Security info */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3 border border-green-200 dark:border-green-800">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Coffre-fort sécurisé</p>
            <p className="text-sm text-green-600 dark:text-green-500">Vos données sont protégées</p>
          </div>
        </div>

        {!showForm ? (
          <Button className="w-full gap-2" size="lg" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Ajouter un élément
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouvel élément</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Code carte bancaire"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenu secret</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Votre information secrète..."
                rows={3}
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
                <option value="general">Général</option>
                <option value="payment">Paiement</option>
                <option value="security">Sécurité</option>
                <option value="network">Réseau</option>
                <option value="health">Santé</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        )}

        {/* Items */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Key className="w-4 h-4" />
            {notes.length > 0 ? "Éléments stockés" : "Aucun élément"}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                    {getCategoryIcon(note.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{note.title}</h3>
                    <p className="text-xs text-muted-foreground">Ajouté le {formatDate(note.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    {note.content && (
                      <button
                        onClick={() => toggleReveal(note.id)}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                      >
                        {revealedNotes.has(note.id) ? (
                          <EyeOff className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </button>
                  </div>
                </div>
                {note.content && revealedNotes.has(note.id) && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-foreground font-mono">{note.content}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
