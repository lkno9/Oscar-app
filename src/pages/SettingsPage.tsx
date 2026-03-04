import { ArrowLeft, User, Bell, Volume2, Moon, Shield, HelpCircle, LogOut, ChevronRight, CheckCircle2, Users, MessageSquare, Phone, AlertTriangle, MapPin, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MFAEnrollment } from "@/components/MFAEnrollment";
import { Factor } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  sms_notifications_enabled: boolean | null;
}

const FAQ_ITEMS = [
  { q: "Comment parler à Oscar ?", a: "Appuyez sur le micro en bas de la page d'accueil et parlez naturellement. Oscar comprend le français et répond immédiatement." },
  { q: "Comment inviter ma famille ?", a: "Allez dans Paramètres > Accès Famille, choisissez le lien familial et générez un code d'invitation à partager." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Seuls vous et les membres de famille que vous invitez y ont accès." },
  { q: "Comment ajouter un médicament ?", a: "Rendez-vous dans Services > Santé, puis dans l'onglet Médicaments. Appuyez sur le bouton '+' pour ajouter un nouveau médicament avec sa posologie." },
  { q: "Comment mettre un document en favori ?", a: "Dans Services > Documents, ouvrez le document et appuyez sur l'étoile pour l'ajouter aux favoris. Retrouvez-le ensuite dans l'onglet Favoris." },
  { q: "Puis-je désactiver les rappels de médicaments ?", a: "Oui, dans Paramètres > Préférences, désactivez les Notifications. Vous pouvez aussi gérer chaque rappel individuellement depuis la page Santé." },
  { q: "Comment signaler une arnaque ?", a: "Allez dans Services > Protection Arnaques. Vous pouvez vérifier un message suspect ou consulter les alertes récentes. Oscar vous guide pour porter plainte si nécessaire." },
  { q: "Comment fonctionne le mode sombre ?", a: "Dans Paramètres > Préférences, activez le Mode sombre. L'écran passe en tons foncés pour réduire la fatigue oculaire, surtout le soir." },
  { q: "Puis-je changer la langue de l'application ?", a: "Pour l'instant, Oscar est disponible uniquement en français. D'autres langues sont prévues dans les prochaines mises à jour." },
  { q: "Comment contacter le support ?", a: "Appelez directement le support au +33 9 00 00 00 00 depuis Paramètres > Aide & Support, ou discutez avec Oscar qui peut vous orienter." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left gap-3"
      >
        <span className="text-base font-medium text-foreground">{q}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <p className="pb-3 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, listFactors, unenrollMFA } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const stored = localStorage.getItem("oscar_voice_enabled");
    return stored !== null ? stored === "true" : true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem("oscar_notifications_enabled");
    return stored !== null ? stored === "true" : true;
  });
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMFAFactors();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).maybeSingle();
    if (data) {
      setProfile(data);
      setSmsNotificationsEnabled(data.sms_notifications_enabled || false);
    }
    setLoading(false);
  };

  const fetchMFAFactors = async () => {
    const { totp } = await listFactors();
    setMfaFactors(totp.filter(f => f.status === 'verified'));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const handleDisableMFA = async () => {
    if (mfaFactors.length === 0) return;
    setMfaLoading(true);
    try {
      const { error } = await unenrollMFA(mfaFactors[0].id);
      if (error) toast.error("Erreur lors de la désactivation");
      else { toast.success("Double authentification désactivée"); await fetchMFAFactors(); }
    } finally { setMfaLoading(false); }
  };

  const handleMFAEnrollmentSuccess = () => {
    setShowMFAEnrollment(false);
    fetchMFAFactors();
  };

  const handleVoiceChange = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    localStorage.setItem("oscar_voice_enabled", String(enabled));
    toast.success(enabled ? "Mode vocal activé" : "Mode vocal désactivé");
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("oscar_notifications_enabled", String(enabled));
    toast.success(enabled ? "Notifications activées" : "Notifications désactivées");
  };

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("oscar_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("oscar_dark_mode", "false");
    }
  };

  const handleSmsNotificationsChange = async (enabled: boolean) => {
    setSmsNotificationsEnabled(enabled);
    const { error } = await supabase.from('profiles').update({ sms_notifications_enabled: enabled }).eq('id', user?.id);
    if (error) { toast.error("Erreur lors de la mise à jour"); setSmsNotificationsEnabled(!enabled); }
    else toast.success(enabled ? "Notifications SMS activées" : "Notifications SMS désactivées");
  };

  const handleCallEmergency = () => window.open("tel:15", "_self");
  const handleCallFamily = () => navigate("/services/communication");
  const handleSendLocation = () => {
    if (!navigator.geolocation) { toast.error("Géolocalisation non disponible"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      if (navigator.share) {
        navigator.share({ title: "Ma position", url });
      } else {
        window.open(url, "_blank");
      }
      toast.success("Position envoyée !");
    }, () => toast.error("Impossible d'obtenir votre position"));
  };

  const isMFAEnabled = mfaFactors.length > 0;

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Profile summary */}
          <div className="p-4 bg-card border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{profile?.full_name || "Utilisateur"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* SOS Section — visually prominent */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Urgence</h3>
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-destructive text-base">SOS — Urgence</p>
                    <p className="text-sm text-muted-foreground">Contactez les secours rapidement</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleCallEmergency}
                    className="flex items-center gap-4 bg-destructive text-destructive-foreground rounded-xl px-4 py-4 min-h-[56px] font-semibold text-base hover:bg-destructive/90 transition-colors active:scale-95"
                  >
                    <Phone className="w-6 h-6 flex-shrink-0" />
                    Appeler les secours (15)
                  </button>
                  <button
                    onClick={handleCallFamily}
                    className="flex items-center gap-4 bg-card border-2 border-destructive/30 text-foreground rounded-xl px-4 py-4 min-h-[56px] font-semibold text-base hover:bg-destructive/5 transition-colors active:scale-95"
                  >
                    <Users className="w-6 h-6 flex-shrink-0 text-destructive" />
                    Appeler ma famille
                  </button>
                  <button
                    onClick={handleSendLocation}
                    className="flex items-center gap-4 bg-card border-2 border-destructive/30 text-foreground rounded-xl px-4 py-4 min-h-[56px] font-semibold text-base hover:bg-destructive/5 transition-colors active:scale-95"
                  >
                    <MapPin className="w-6 h-6 flex-shrink-0 text-destructive" />
                    Envoyer ma position
                  </button>
                </div>
              </div>
            </section>

            {/* Help Section */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Aide & Support</h3>
              <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                <button
                  onClick={() => navigate("/")}
                  className="w-full flex items-center gap-4 bg-primary text-primary-foreground rounded-xl px-4 py-4 min-h-[56px] font-semibold text-base hover:bg-primary/90 transition-colors active:scale-95"
                >
                  <MessageCircle className="w-6 h-6 flex-shrink-0" />
                  Parler à Oscar
                </button>
                <a
                  href="tel:+33900000000"
                  className="flex items-center gap-4 bg-secondary text-foreground rounded-xl px-4 py-4 min-h-[56px] font-semibold text-base hover:bg-accent transition-colors active:scale-95"
                >
                  <Phone className="w-6 h-6 flex-shrink-0 text-primary" />
                  Appeler le support
                </a>
                <div className="pt-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Questions fréquentes</p>
                  <div className="divide-y divide-border">
                    {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                  </div>
                </div>
              </div>
            </section>

            {/* Account */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Compte</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-4 p-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Profil</p>
                    <p className="text-sm text-muted-foreground">Modifier vos informations</p>
                  </div>
                  <button onClick={() => toast.info("La page profil sera bientôt disponible")} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Accès Famille</p>
                    <p className="text-sm text-muted-foreground">Gérer les membres de la famille</p>
                  </div>
                  <button onClick={() => navigate("/settings/family-access")} className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Sécurité</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMFAEnabled ? "bg-green-500/20" : "bg-secondary"}`}>
                    <Shield className={`w-5 h-5 ${isMFAEnabled ? "text-green-500" : "text-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Double authentification</p>
                      {isMFAEnabled && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{isMFAEnabled ? "Votre compte est protégé" : "Protégez votre compte"}</p>
                  </div>
                  <Button
                    variant={isMFAEnabled ? "outline" : "default"}
                    size="sm"
                    onClick={isMFAEnabled ? handleDisableMFA : () => setShowMFAEnrollment(true)}
                    disabled={mfaLoading}
                    className={isMFAEnabled ? "border-destructive text-destructive hover:bg-destructive/10" : ""}
                  >
                    {mfaLoading ? "..." : isMFAEnabled ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Préférences</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                {[
                  { icon: Volume2, label: "Mode vocal", desc: "Oscar lit les réponses à haute voix", value: voiceEnabled, onChange: handleVoiceChange },
                  { icon: Bell, label: "Notifications", desc: "Rappels et alertes importantes", value: notificationsEnabled, onChange: handleNotificationsChange },
                  { icon: MessageSquare, label: "Notifications SMS", desc: profile?.phone_number ? "Recevoir les alertes par SMS" : "Ajoutez un numéro dans votre profil", value: smsNotificationsEnabled, onChange: handleSmsNotificationsChange, disabled: !profile?.phone_number },
                  { icon: Moon, label: "Mode sombre", desc: "Adapter l'affichage", value: darkMode, onChange: handleDarkModeChange },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.onChange} disabled={(item as any).disabled} />
                  </div>
                ))}
              </div>
            </section>

            {/* Sign out */}
            <Button variant="destructive" className="w-full min-h-[52px]" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>

            <p className="text-center text-xs text-muted-foreground py-4">Oscar v1.0.0 • Fait avec ❤️ pour vous</p>
          </div>
        </div>
      </div>

      {showMFAEnrollment && (
        <MFAEnrollment onSuccess={handleMFAEnrollmentSuccess} onCancel={() => setShowMFAEnrollment(false)} />
      )}
    </>
  );
}
