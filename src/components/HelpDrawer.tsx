import { useState } from "react";
import { HelpCircle, MessageCircle, Phone, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const faqs = [
  { q: "Comment ajouter un rendez-vous ?", a: "Allez dans Services → Agenda, puis appuyez sur le bouton '+' pour créer un événement." },
  { q: "Comment scanner un document ?", a: "Dans Services → Documents, appuyez sur 'Ajouter un document' et choisissez un fichier depuis votre appareil." },
  { q: "Comment activer les rappels de médicaments ?", a: "Allez dans Services → Santé & médicaments, ajoutez un médicament et activez les rappels." },
  { q: "Comment passer un appel vidéo ?", a: "Appuyez sur l'icône téléphone en haut de l'écran d'accueil pour démarrer un appel." },
  { q: "Comment protéger mes données ?", a: "Vos données sont chiffrées et stockées en sécurité. Le coffre-fort numérique ajoute une couche supplémentaire." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-secondary/50 transition-colors min-h-[56px]"
      >
        <span className="font-semibold text-foreground text-base leading-tight">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Help Panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-card rounded-t-3xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up">
          {/* Handle */}
          <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-bold text-foreground">Aide & support</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4 scrollbar-hide">
            {/* Oscar CTA */}
            <div className="bg-primary rounded-2xl p-5">
              <p className="text-primary-foreground font-bold text-lg mb-1">Besoin d'aide ?</p>
              <p className="text-primary-foreground/80 text-sm mb-4">Oscar est là pour vous accompagner.</p>
              <button
                onClick={() => { navigate("/"); setOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-primary-foreground font-semibold rounded-xl py-3 transition-colors min-h-[48px]"
              >
                <MessageCircle className="w-5 h-5" />
                Parler à Oscar
              </button>
            </div>

            {/* Support phone */}
            <button className="w-full flex items-center gap-4 bg-secondary rounded-xl px-4 py-4 hover:bg-secondary/70 transition-colors min-h-[60px]">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">Appeler le support</p>
                <p className="text-sm text-muted-foreground">Lun – Ven, 9h – 18h</p>
              </div>
            </button>

            {/* FAQs */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Questions fréquentes</p>
              {faqs.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Icon button – rendered in header by parent */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        aria-label="Aide"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </>
  );
}
