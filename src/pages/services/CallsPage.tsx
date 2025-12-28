import { ArrowLeft, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Call {
  id: string;
  contact_name: string | null;
  call_type: string | null;
  call_date: string;
  duration: number | null;
}

export function CallsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCalls();
  }, [user]);

  const fetchCalls = async () => {
    const { data, error } = await supabase
      .from('call_history')
      .select('*')
      .order('call_date', { ascending: false });
    
    if (!error && data) setCalls(data);
    setLoading(false);
  };

  const getCallIcon = (type: string | null) => {
    switch (type) {
      case "incoming": return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case "outgoing": return <PhoneOutgoing className="w-5 h-5 text-blue-500" />;
      case "missed": return <PhoneMissed className="w-5 h-5 text-destructive" />;
      default: return <Phone className="w-5 h-5" />;
    }
  };

  const formatCallDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui, ${format(date, 'HH:mm')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier, ${format(date, 'HH:mm')}`;
    }
    return format(date, "EEEE d MMMM, HH:mm", { locale: fr });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return `${seconds} sec`;
    return `${mins} min`;
  };

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
          <h1 className="text-lg font-bold text-foreground">Appels & visios</h1>
          <p className="text-sm text-muted-foreground">Historique des appels</p>
        </div>
        <Phone className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-auto py-4 flex-col gap-2" size="lg">
            <Phone className="w-6 h-6" />
            <span>Appel audio</span>
          </Button>
          <Button variant="secondary" className="h-auto py-4 flex-col gap-2" size="lg">
            <Video className="w-6 h-6" />
            <span>Appel vidéo</span>
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Historique
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : calls.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Aucun appel pour l'instant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Votre historique d'appels apparaîtra ici
              </p>
              <Button onClick={() => navigate('/services/family')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter des contacts
              </Button>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  {getCallIcon(call.call_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{call.contact_name || 'Inconnu'}</h3>
                  <p className="text-sm text-muted-foreground">{formatCallDate(call.call_date)}</p>
                </div>
                {call.duration && (
                  <span className="text-sm text-muted-foreground">{formatDuration(call.duration)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
