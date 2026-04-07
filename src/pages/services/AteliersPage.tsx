import { useState } from "react";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  Shield,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// TODO: connecter à Supabase partner_workshops
const WORKSHOPS: { id: string; orga: string; title: string; date: string; time: string; location: string; spots: number; emoji: string; category: string }[] = [];

// TODO: connecter à Supabase — aucun partenariat pour l'instant
const PARTNER_ORGS: { name: string; description: string; emoji: string; url: string }[] = [];

const STORAGE_KEY = "ateliers_linked_org";

export function AteliersPage() {
  const goBack = useBackNavigation();
  const [linkedOrg, setLinkedOrg] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  const handleLinkOrg = () => {
    // TODO: valider le code via Supabase
    setCodeError("Cette fonctionnalité sera bientôt disponible. Contactez votre organisme.");
  };

  const handleUnlink = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLinkedOrg(null);
    toast.info("Vous avez été délié de votre organisme.");
  };

  const handleRemind = (id: string) => {
    setRemindedIds(prev => [...prev, id]);
    toast.success("Rappel ajouté !");
  };

  const handleRegister = (id: string) => {
    setRegisteredIds(prev => [...prev, id]);
    toast.success("Inscription enregistrée — l'organisateur vous contactera");
  };

  const getSpotsColor = (spots: number) => {
    if (spots <= 2) return { bg: "rgba(239,68,68,0.1)", text: "#dc2626" };
    if (spots <= 5) return { bg: "rgba(245,158,11,0.1)", text: "#d97706" };
    return { bg: "rgba(34,197,94,0.1)", text: "#16a34a" };
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Ateliers & Accompagnement</h1>
          <p className="text-sm text-muted-foreground">Rejoindre un atelier près de chez vous</p>
        </div>
        <Users className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">

        {/* Section 1 — Mon organisme lié */}
        {linkedOrg ? (
          <div className="rounded-2xl p-4 bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Mon organisme</h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Lié
              </span>
            </div>
            <p className="font-semibold text-foreground text-lg">{linkedOrg}</p>
            <button
              onClick={handleUnlink}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Se délier
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Mon organisme</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Vous n'êtes lié à aucun organisme pour le moment
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">Rejoindre avec un code</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejoindre un organisme</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                  Saisissez le code à 6 chiffres fourni par votre organisme d'atelier.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.replace(/\D/g, "")); setCodeError(""); }}
                  placeholder="000000"
                  className="w-full rounded-xl p-3 text-center text-lg font-mono tracking-widest outline-none border-2 border-border focus:border-primary transition-colors"
                />
                {codeError && (
                  <p className="text-sm text-destructive mt-2">{codeError}</p>
                )}
                <Button onClick={handleLinkOrg} className="w-full mt-3" disabled={codeInput.length !== 6}>
                  Valider
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Section 2 — Ateliers à venir */}
        <div>
          <h2 className="font-bold text-foreground text-lg">Prochains ateliers</h2>
          <p className="text-sm text-muted-foreground mb-4">Près de chez vous</p>

          {WORKSHOPS.length === 0 ? (
            <div className="rounded-2xl p-6 bg-card border border-border text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">Aucun atelier pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Les prochains ateliers près de chez vous apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {WORKSHOPS.map(w => {
                const spots = getSpotsColor(w.spots);
                const isReminded = remindedIds.includes(w.id);
                const isRegistered = registeredIds.includes(w.id);

                return (
                  <div key={w.id} className="rounded-2xl p-4 bg-card border border-border">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl flex-shrink-0">{w.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {w.orga}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: spots.bg, color: spots.text }}>
                            {w.spots} place{w.spots > 1 ? "s" : ""} restante{w.spots > 1 ? "s" : ""}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{w.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" /> {w.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0" /> {w.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" /> {w.location}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={isReminded}
                        onClick={() => handleRemind(w.id)}
                      >
                        {isReminded ? "Rappel ajouté ✓" : "Me rappeler"}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        disabled={isRegistered}
                        onClick={() => handleRegister(w.id)}
                      >
                        {isRegistered ? "Inscrit ✓" : "S'inscrire"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3 — Organismes partenaires */}
        <div>
          <h2 className="font-bold text-foreground text-lg mb-3">Nos organismes partenaires</h2>
          {PARTNER_ORGS.length === 0 ? (
            <div className="rounded-2xl p-6 bg-card border border-border text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">Aucun partenaire pour le moment</p>
              <p className="text-sm text-muted-foreground">
                Nos futurs organismes partenaires apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {PARTNER_ORGS.map(org => (
                <button
                  key={org.name}
                  onClick={() => window.open(org.url, "_blank")}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border text-left transition-all hover:shadow-sm active:scale-[0.98]"
                  style={{ cursor: "pointer" }}
                >
                  <span className="text-2xl flex-shrink-0">{org.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{org.name}</p>
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 4 — Bandeau de confiance */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Notre engagement</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Oscar s'associe uniquement à des organismes reconnus pour la qualité de leur accompagnement.
                Tous les ateliers listés sont gratuits ou à tarif social.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
