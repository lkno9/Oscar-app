import { ArrowLeft, User, Bell, Volume2, Moon, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();
    
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const settingsSections = [
    {
      title: "Compte",
      items: [
        {
          icon: User,
          label: "Profil",
          description: "Modifier vos informations personnelles",
          action: () => navigate("/profile"),
          type: "link" as const,
        },
      ],
    },
    {
      title: "Préférences",
      items: [
        {
          icon: Volume2,
          label: "Mode vocal",
          description: "Oscar lit les réponses à haute voix",
          value: voiceEnabled,
          onChange: setVoiceEnabled,
          type: "toggle" as const,
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Rappels et alertes importantes",
          value: notificationsEnabled,
          onChange: setNotificationsEnabled,
          type: "toggle" as const,
        },
        {
          icon: Moon,
          label: "Mode sombre",
          description: "Adapter l'affichage à vos yeux",
          value: darkMode,
          onChange: setDarkMode,
          type: "toggle" as const,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Aide & FAQ",
          description: "Obtenir de l'aide sur Oscar",
          action: () => navigate("/services/help"),
          type: "link" as const,
        },
        {
          icon: Shield,
          label: "Confidentialité",
          description: "Politique de confidentialité",
          action: () => {},
          type: "link" as const,
        },
      ],
    },
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
              <h2 className="text-lg font-bold text-foreground">
                {profile?.full_name || "Utilisateur"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Settings sections */}
        <div className="p-4 space-y-6">
          {settingsSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                {section.title}
              </h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`flex items-center gap-4 p-4 ${
                      itemIdx !== section.items.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {item.type === "toggle" ? (
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                      />
                    ) : (
                      <button
                        onClick={item.action}
                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>

          {/* App version */}
          <p className="text-center text-xs text-muted-foreground py-4">
            Oscar v1.0.0 • Fait avec ❤️ pour vous
          </p>
        </div>
      </div>
    </div>
  );
}
