import { ArrowLeft, Image, Camera, FolderHeart, Grid3X3, Plus, Upload, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Album {
  id: string;
  name: string;
  emoji: string;
  photo_count?: number;
}

interface Photo {
  id: string;
  url: string;
  title: string | null;
  album_id: string | null;
}

export function PhotosPage() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumEmoji, setAlbumEmoji] = useState("📷");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchAlbums();
      fetchPhotos();
    }
  }, [user]);

  const fetchAlbums = async () => {
    const { data: albumsData } = await supabase
      .from('photo_albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (albumsData) {
      // Get photo count per album
      const { data: photosData } = await supabase
        .from('photos')
        .select('album_id');

      const albumsWithCount = albumsData.map(album => ({
        ...album,
        photo_count: photosData?.filter(p => p.album_id === album.id).length || 0
      }));

      setAlbums(albumsWithCount);
    }
    setLoading(false);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setPhotos(data);
  };

  const handleAddAlbum = async () => {
    if (!albumName.trim() || !user) return;

    const { error } = await supabase.from('photo_albums').insert({
      user_id: user.id,
      name: albumName.trim(),
      emoji: albumEmoji
    });

    if (error) {
      toast.error("Erreur lors de la création de l'album");
    } else {
      toast.success("Album créé !");
      setAlbumName("");
      setAlbumEmoji("📷");
      setShowAlbumForm(false);
      fetchAlbums();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erreur lors de l'upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-files')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('photos').insert({
      user_id: user.id,
      url: publicUrl,
      title: file.name
    });

    if (dbError) {
      toast.error("Erreur lors de l'enregistrement");
    } else {
      toast.success("Photo ajoutée !");
      fetchPhotos();
      fetchAlbums();
    }
    setUploading(false);
  };

  const emojiOptions = ["📷", "👨‍👩‍👧‍👦", "🏖️", "🎂", "👶", "🐕", "🏠", "✈️", "🎄", "💒"];

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
          <h1 className="text-lg font-bold text-foreground">Photos & souvenirs</h1>
          <p className="text-sm text-muted-foreground">Vos plus beaux moments</p>
        </div>
        <Image className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handlePhotoUpload}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-auto py-4 flex-col gap-2" 
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="w-6 h-6" />
            <span>{uploading ? 'Envoi...' : 'Ajouter photo'}</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2" 
            size="lg"
            onClick={() => setShowAlbumForm(!showAlbumForm)}
          >
            <FolderHeart className="w-6 h-6" />
            <span>Nouvel album</span>
          </Button>
        </div>

        {showAlbumForm && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Créer un album</h3>
              <button onClick={() => setShowAlbumForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Input
              placeholder="Nom de l'album"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAlbumEmoji(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                    albumEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button onClick={handleAddAlbum} className="w-full">
              Créer l'album
            </Button>
          </div>
        )}

        {/* Albums */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Albums
          </h2>
          
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : albums.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <FolderHeart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Aucun album</h3>
              <p className="text-sm text-muted-foreground">
                Créez votre premier album pour organiser vos souvenirs
              </p>
            </div>
          ) : (
            albums.map((album) => (
              <div
                key={album.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {album.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{album.name}</h3>
                  <p className="text-sm text-muted-foreground">{album.photo_count || 0} photos</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent photos */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Photos récentes ({photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 9).map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img 
                    src={photo.url} 
                    alt={photo.title || 'Photo'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
