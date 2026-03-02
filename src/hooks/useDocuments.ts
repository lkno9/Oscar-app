import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  file_url: string | null;
  file_size: string | null;
  category: string;
  created_at: string;
  expiration_date: string | null;
  document_type: string | null;
  reminder_enabled: boolean;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (
    name: string,
    file: File | null,
    documentType: string,
    expirationDate: string | null,
    reminderEnabled: boolean,
    category: string = 'autre'
  ) => {
    if (!user) return false;

    try {
      let fileUrl = null;
      let fileSize = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
        fileSize = formatFileSize(file.size);
      }

      const { error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name,
          file_url: fileUrl,
          file_size: fileSize,
          category,
          document_type: documentType,
          expiration_date: expirationDate || null,
          reminder_enabled: reminderEnabled
        });

      if (error) throw error;

      toast({
        title: "Document ajouté",
        description: "Le document a été enregistré avec succès"
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le document",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé"
      });

      await fetchDocuments();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const getExpiringDocuments = (daysThreshold: number = 90) => {
    const today = new Date();
    return documents.filter(doc => {
      if (!doc.expiration_date) return false;
      const expDate = new Date(doc.expiration_date);
      const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= daysThreshold;
    }).sort((a, b) => {
      const dateA = new Date(a.expiration_date!);
      const dateB = new Date(b.expiration_date!);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getUrgentDocuments = () => getExpiringDocuments(30);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  return {
    documents,
    loading,
    addDocument,
    deleteDocument,
    fetchDocuments,
    getExpiringDocuments,
    getUrgentDocuments
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
