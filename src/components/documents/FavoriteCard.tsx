import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Favorite {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  is_pinned: boolean | null;
  created_at: string;
}

interface FavoriteCardProps {
  favorite: Favorite;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

const getCategoryEmoji = (category: string | null) => {
  switch (category) {
    case 'aide': return '🤝';
    case 'sante': return '🏥';
    case 'impots': return '📊';
    case 'logement': return '🏠';
    case 'retraite': return '🎖️';
    case 'transport': return '🚌';
    case 'lien': return '🔗';
    default: return '📌';
  }
};

export const FavoriteCard = ({ favorite, onDelete, onTogglePin }: FavoriteCardProps) => {
  const isUrl = favorite.content?.startsWith('http');

  return (
    <Card className={`transition-all ${favorite.is_pinned ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0">
            {getCategoryEmoji(favorite.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground text-sm truncate">{favorite.title}</h3>
                  {favorite.is_pinned && (
                    <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </div>
                {favorite.content && !isUrl && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{favorite.content}</p>
                )}
                {isUrl && (
                  <a 
                    href={favorite.content!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ouvrir le lien
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {favorite.category && (
                  <Badge variant="secondary" className="text-xs">
                    {favorite.category}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(favorite.created_at), "d MMM yyyy", { locale: fr })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePin(favorite.id, !favorite.is_pinned)}
                  className="h-8 w-8 p-0"
                >
                  <Pin className={`w-4 h-4 ${favorite.is_pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(favorite.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
