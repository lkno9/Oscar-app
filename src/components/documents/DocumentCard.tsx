import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Download, Trash2, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExpirationBadge } from "./ExpirationBadge";
import { DOCUMENT_TYPES } from "./TaskTemplates";

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

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
  onAskOscar?: (docName: string) => void;
}

export const DocumentCard = ({ document, onDelete, onAskOscar }: DocumentCardProps) => {
  const docTypeLabel = DOCUMENT_TYPES.find(t => t.value === document.document_type)?.label || document.document_type || 'Document';

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground truncate">{document.name}</h3>
                <p className="text-sm text-muted-foreground">{docTypeLabel}</p>
              </div>
              {document.expiration_date && (
                <ExpirationBadge expirationDate={document.expiration_date} size="sm" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Ajouté le {formatDate(document.created_at)}</span>
              {document.file_size && (
                <>
                  <span>•</span>
                  <span>{document.file_size}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              {document.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(document.file_url!, '_blank')}
                  className="text-sm"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Télécharger
                </Button>
              )}
              
              {onAskOscar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAskOscar(document.name)}
                  className="text-sm text-primary"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Demander à Oscar
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(document.id)}
                className="text-sm text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
