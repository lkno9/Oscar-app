import { ArrowLeft, Cloud, HardDrive, Image, FileText, Music, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export function StoragePage() {
  const navigate = useNavigate();

  const categories = [
    { icon: Image, label: "Photos", size: "2.4 GB", color: "text-blue-500" },
    { icon: Video, label: "Vidéos", size: "1.8 GB", color: "text-purple-500" },
    { icon: FileText, label: "Documents", size: "856 MB", color: "text-green-500" },
    { icon: Music, label: "Musique", size: "340 MB", color: "text-orange-500" },
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
              <p className="text-sm text-muted-foreground">5.4 GB sur 15 GB</p>
            </div>
          </div>
          <Progress value={36} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">9.6 GB disponibles</p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Par catégorie
          </h2>
          {categories.map((cat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{cat.label}</h3>
              </div>
              <span className="text-muted-foreground font-medium">{cat.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
