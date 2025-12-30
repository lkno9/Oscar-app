import { ArrowLeft, AlertTriangle, Phone, MapPin, Users, Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
}

export function EmergencyPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const nationalEmergencies = [
    { id: 1, name: "SAMU", number: "15", description: "Urgences médicales" },
    { id: 2, name: "Pompiers", number: "18", description: "Incendie, accident" },
    { id: 3, name: "Police", number: "17", description: "Police secours" },
    { id: 4, name: "Urgences Europe", number: "112", description: "Numéro européen" },
  ];

  useEffect(() => {
    if (user) fetchEmergencyContacts();
  }, [user]);

  const fetchEmergencyContacts = async () => {
    const { data } = await supabase
      .from('family_contacts')
      .select('*')
      .eq('is_emergency_contact', true)
      .order('name');

    if (data) setEmergencyContacts(data);
    setLoading(false);
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-destructive/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Urgence / SOS</h1>
          <p className="text-sm text-destructive">Accès rapide aux secours</p>
        </div>
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* SOS Button */}
        <Button 
          className="w-full h-24 text-xl font-bold gap-3 bg-destructive hover:bg-destructive/90"
          size="lg"
          onClick={() => handleCall('15')}
        >
          <AlertTriangle className="w-8 h-8" />
          APPELER LES SECOURS (15)
        </Button>

        {/* Location sharing */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-center gap-3 border border-orange-200 dark:border-orange-800">
          <MapPin className="w-6 h-6 text-orange-600" />
          <div className="flex-1">
            <p className="font-semibold text-orange-700 dark:text-orange-400">Partager ma position</p>
            <p className="text-sm text-orange-600 dark:text-orange-500">Envoyer ma localisation aux proches</p>
          </div>
          <Button size="sm" variant="outline" className="border-orange-300">
            Partager
          </Button>
        </div>

        {/* Emergency numbers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Numéros d'urgence nationaux
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {nationalEmergencies.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleCall(contact.number)}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-destructive transition-colors active:bg-destructive/10"
              >
                <span className="text-3xl font-bold text-destructive">{contact.number}</span>
                <span className="font-semibold text-foreground">{contact.name}</span>
                <span className="text-xs text-muted-foreground text-center">{contact.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Personal contacts */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mes contacts d'urgence
          </h2>
          
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : emergencyContacts.length === 0 ? (
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Aucun contact d'urgence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez des proches à contacter en cas d'urgence
              </p>
              <Button onClick={() => navigate('/services/family')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Gérer mes contacts
              </Button>
            </div>
          ) : (
            emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.relationship || 'Contact d\'urgence'}</p>
                </div>
                {contact.phone && (
                  <Button 
                    size="icon" 
                    className="rounded-full bg-green-500 hover:bg-green-600"
                    onClick={() => handleCall(contact.phone!)}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
