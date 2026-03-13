import { ArrowLeft, User, Bell, Volume2, Moon, Shield, ChevronRight, CheckCircle2, Users, MessageSquare, LogOut, Type, Pencil, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
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


export function SettingsPage() {
  const navigate = useNavigate();
  const goBack = useBackNavigation();
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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [textSize, setTextSize] = useState<"normal" | "large" | "xlarge">(() => {
    return (localStorage.getItem("oscar_text_size") as "normal" | "large" | "xlarge") || "normal";
  });

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

  const isMFAEnabled = mfaFactors.length > 0;
  // Les seniors connectés par téléphone n'ont pas besoin de MFA (le code vocal fait office de 2FA)
  const isPhoneAuth = !!user?.phone && !user?.email;

  const startEditProfile = () => {
    setEditName(profile?.full_name || "");
    setEditPhone(profile?.phone_number || profile?.phone || "");
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editName.trim() || null,
      phone_number: editPhone.trim() || null,
    }).eq('id', user.id);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour");
      setEditingProfile(false);
      fetchProfile();
    }
    setSavingProfile(false);
  };

  const handleTextSizeChange = (size: "normal" | "large" | "xlarge") => {
    setTextSize(size);
    localStorage.setItem("oscar_text_size", size);
    const root = document.documentElement;
    root.classList.remove("text-size-normal", "text-size-large", "text-size-xlarge");
    root.classList.add(`text-size-${size}`);
    toast.success(size === "normal" ? "Taille normale" : size === "large" ? "Gros texte activé" : "Très gros texte activé");
  };

  // Apply text size on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-size-normal", "text-size-large", "text-size-xlarge");
    root.classList.add(`text-size-${textSize}`);
  }, []);

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Profile summary */}
          <div className="p-4 bg-card border-b border-border">
            {!editingProfile ? (
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
                  <p className="text-sm text-muted-foreground">{user?.email || user?.phone}</p>
                </div>
                <button onClick={startEditProfile} className="p-3 rounded-full hover:bg-secondary transition-colors" aria-label="Modifier le profil">
                  <Pencil className="w-5 h-5 text-primary" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Modifier le profil</h2>
                  <button onClick={() => setEditingProfile(false)} className="p-2.5 rounded-full hover:bg-secondary transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Nom complet</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Téléphone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="06 12 34 56 78"
                    type="tel"
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full min-h-[48px]">
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-6">
            {/* Account */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Compte</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-4 p-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Profil</p>
                    <p className="text-sm text-muted-foreground">Modifier vos informations</p>
                  </div>
                  <button onClick={startEditProfile} className="p-3 rounded-full hover:bg-secondary transition-colors">
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
                  <button onClick={() => navigate("/settings/family-access")} className="p-3 rounded-full hover:bg-secondary transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </section>

            {/* Security — masqué pour les seniors connectés par téléphone */}
            {!isPhoneAuth && (
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Sécurité</h3>
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
            )}

            {/* Preferences */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Préférences</h3>
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

            {/* Text Size */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Taille du texte</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Type className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Taille d'affichage</p>
                    <p className="text-sm text-muted-foreground">Ajustez la taille du texte</p>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  {([
                    { key: "normal" as const, label: "Normal", sample: "Aa" },
                    { key: "large" as const, label: "Grand", sample: "Aa" },
                    { key: "xlarge" as const, label: "Très grand", sample: "Aa" },
                  ]).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleTextSizeChange(opt.key)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                        textSize === opt.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span style={{ fontSize: opt.key === "normal" ? 16 : opt.key === "large" ? 20 : 24 }} className="font-bold text-foreground">{opt.sample}</span>
                      <span className="text-sm text-muted-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Sign out */}
            <Button variant="destructive" className="w-full min-h-[52px]" onClick={() => setShowSignOutConfirm(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>

            <p className="text-center text-sm text-muted-foreground py-4">Oscar v1.0.0 • Fait avec ❤️ pour vous</p>
          </div>
        </div>
      </div>

      {showMFAEnrollment && (
        <MFAEnrollment onSuccess={handleMFAEnrollmentSuccess} onCancel={() => setShowMFAEnrollment(false)} />
      )}

      {/* Sign-out confirmation dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Se déconnecter ?</h3>
              <p className="text-sm text-muted-foreground">Vous devrez vous reconnecter pour accéder à votre compte Oscar.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 min-h-[48px]" onClick={() => setShowSignOutConfirm(false)}>
                Annuler
              </Button>
              <Button variant="destructive" className="flex-1 min-h-[48px]" onClick={handleSignOut}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
