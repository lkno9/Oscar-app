import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Favorite {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('secure_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error("Erreur lors du chargement des favoris");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const addFavorite = async (title: string, content?: string, category?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('secure_notes')
        .insert({
          user_id: user.id,
          title,
          content: content || null,
          category: category || null,
          is_pinned: false
        });

      if (error) throw error;
      
      toast.success("Favori ajouté");
      fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error("Erreur lors de l'ajout du favori");
      return false;
    }
  };

  const deleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('secure_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Favori supprimé");
      fetchFavorites();
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('secure_notes')
        .update({ is_pinned: isPinned })
        .eq('id', id);

      if (error) throw error;
      fetchFavorites();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getPinnedFavorites = () => favorites.filter(f => f.is_pinned);

  return {
    favorites,
    loading,
    addFavorite,
    deleteFavorite,
    togglePin,
    getPinnedFavorites,
    refetch: fetchFavorites
  };
};
