import { ArrowLeft, HelpCircle, MessageCircle, BookOpen, Video, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";

export function HelpPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();

  const faqs = [
    { id: 1, question: "Comment ajouter un contact ?", category: "Contacts" },
    { id: 2, question: "Comment scanner un document ?", category: "Documents" },
    { id: 3, question: "Comment activer les rappels de médicaments ?", category: "Santé" },
    { id: 4, question: "Comment passer un appel vidéo ?", category: "Communication" },
  ];

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
          <h1 className="text-lg font-bold text-foreground">Aide & support</h1>
          <p className="text-sm text-muted-foreground">Nous sommes là pour vous</p>
        </div>
        <HelpCircle className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick help */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-2">Besoin d'aide ?</h2>
          <p className="text-sm opacity-90 mb-4">
            Oscar est là pour vous accompagner. Posez-lui vos questions !
          </p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Parler à Oscar
          </Button>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => toast.info("Le support téléphonique sera bientôt disponible")}>
            <Phone className="w-6 h-6" />
            <span>Appeler le support</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => toast.info("Les tutoriels vidéo arrivent bientôt")}>
            <Video className="w-6 h-6" />
            <span>Tutoriels vidéo</span>
          </Button>
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Questions fréquentes
          </h2>
          {faqs.map((faq) => (
            <button
              key={faq.id}
              className="w-full bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 hover:border-primary transition-colors text-left"
              onClick={() => toast.info("Demandez à Oscar pour plus de détails sur cette question")}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.category}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Support info */}
        <div className="bg-accent rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Pour toute question, parlez directement à Oscar !
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Il est disponible 24h/24 pour vous aider.
          </p>
        </div>
      </div>
    </div>
  );
}
