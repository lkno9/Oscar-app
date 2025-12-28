import { ArrowLeft, Cloud, HardDrive, Image, FileText, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface StorageStats {
  photosSize: number;
  documentsSize: number;
  totalSize: number;
  photoCount: number;
  documentCount: number;
}

const MAX_STORAGE_MB = 50; // 50 MB limit for demo

export function StoragePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<StorageStats>({
    photosSize: 0,
    documentsSize: 0,
    totalSize: 0,
    photoCount: 0,
    documentCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStorageStats();
  }, [user]);

  const fetchStorageStats = async () => {
    // Fetch photos count
    const { data: photos } = await supabase
      .from('photos')
      .select('id');

    // Fetch documents with sizes
    const { data: documents } = await supabase
      .from('documents')
      .select('id, file_size');

    const photoCount = photos?.length || 0;
    const documentCount = documents?.length || 0;

    // Estimate photo sizes (avg 2MB per photo)
    const photosSize = photoCount * 2 * 1024 * 1024; // in bytes

    // Calculate documents size
    let documentsSize = 0;
    documents?.forEach(doc => {
      if (doc.file_size) {
        // Parse file_size string (e.g., "1.5 MB", "500 KB")
        const match = doc.file_size.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'KB') documentsSize += value * 1024;
          else if (unit === 'MB') documentsSize += value * 1024 * 1024;
          else if (unit === 'GB') documentsSize += value * 1024 * 1024 * 1024;
        }
      }
    });

    setStats({
      photosSize,
      documentsSize,
      totalSize: photosSize + documentsSize,
      photoCount,
      documentCount
    });
    setLoading(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const usedMB = stats.totalSize / (1024 * 1024);
  const usagePercent = Math.min(100, (usedMB / MAX_STORAGE_MB) * 100);
  const availableMB = Math.max(0, MAX_STORAGE_MB - usedMB);

  const categories = [
    { 
      icon: Image, 
      label: "Photos", 
      size: formatSize(stats.photosSize), 
      count: stats.photoCount,
      color: "text-blue-500",
      path: "/services/photos"
    },
    { 
      icon: FileText, 
      label: "Documents", 
      size: formatSize(stats.documentsSize), 
      count: stats.documentCount,
      color: "text-green-500",
      path: "/services/documents"
    },
  ];

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
          <h1 className="text-lg font-bold text-foreground">Stockage & fichiers</h1>
          <p className="text-sm text-muted-foreground">Votre espace cloud</p>
        </div>
        <Cloud className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Storage overview */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-8 h-8 text-primary" />
            <div>
              <h2 className="font-bold text-foreground">Espace utilisé</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Calcul en cours...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formatSize(stats.totalSize)} sur {MAX_STORAGE_MB} MB
                </p>
              )}
            </div>
          </div>
          <Progress value={usagePercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {availableMB.toFixed(1)} MB disponibles
          </p>
        </div>

        {stats.totalSize === 0 && !loading && (
          <div className="bg-accent rounded-xl p-4 text-center">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-foreground font-medium mb-1">Votre espace est vide</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez des photos et documents pour commencer
            </p>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Par catégorie
          </h2>
          {categories.map((cat, index) => (
            <button
              key={index}
              onClick={() => navigate(cat.path)}
              className="w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">{cat.count} fichier(s)</p>
              </div>
              <span className="text-muted-foreground font-medium">{cat.size}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
