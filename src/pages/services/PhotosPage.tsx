import { ArrowLeft, Image, Camera, FolderHeart, Grid3X3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PhotosPage() {
  const navigate = useNavigate();

  const albums = [
    { id: 1, name: "Famille", count: 156, emoji: "👨‍👩‍👧‍👦" },
    { id: 2, name: "Vacances 2024", count: 89, emoji: "🏖️" },
    { id: 3, name: "Anniversaires", count: 45, emoji: "🎂" },
    { id: 4, name: "Mes petits-enfants", count: 234, emoji: "👶" },
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
          <h1 className="text-lg font-bold text-foreground">Photos & souvenirs</h1>
          <p className="text-sm text-muted-foreground">Vos plus beaux moments</p>
        </div>
        <Image className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-auto py-4 flex-col gap-2" size="lg">
            <Camera className="w-6 h-6" />
            <span>Prendre photo</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" size="lg">
            <Grid3X3 className="w-6 h-6" />
            <span>Toutes les photos</span>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Albums
          </h2>
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {album.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{album.name}</h3>
                <p className="text-sm text-muted-foreground">{album.count} photos</p>
              </div>
              <FolderHeart className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
