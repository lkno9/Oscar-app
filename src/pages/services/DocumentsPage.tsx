import { ArrowLeft, FileText, Upload, FolderOpen, File } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function DocumentsPage() {
  const navigate = useNavigate();

  const documents = [
    { id: 1, name: "Carte d'identité.pdf", date: "15 Nov 2024", size: "2.4 MB" },
    { id: 2, name: "Attestation sécu.pdf", date: "10 Oct 2024", size: "1.1 MB" },
    { id: 3, name: "Facture EDF.pdf", date: "01 Déc 2024", size: "456 KB" },
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
          <h1 className="text-lg font-bold text-foreground">Documents & démarches</h1>
          <p className="text-sm text-muted-foreground">Vos documents importants</p>
        </div>
        <FileText className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Upload className="w-6 h-6" />
            <span>Ajouter</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <FolderOpen className="w-6 h-6" />
            <span>Dossiers</span>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Documents récents
          </h2>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <File className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{doc.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {doc.date} • {doc.size}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
