import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, Heart, Trash2, X, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  is_emergency_contact: boolean;
}

export function FamilyPage() {
  const navigate = useNavigate();
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("family_contacts")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      toast.error("Erreur lors du chargement des contacts");
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Veuillez entrer un nom");
      return;
    }

    const { error } = await supabase.from("family_contacts").insert({
      user_id: user?.id,
      name,
      relationship: relationship || null,
      phone: phone || null,
      email: email || null,
      is_emergency_contact: isEmergency,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Contact ajouté !");
      setName("");
      setRelationship("");
      setPhone("");
      setEmail("");
      setIsEmergency(false);
      setShowForm(false);
      fetchContacts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) return;
    const { error } = await supabase.from("family_contacts").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Contact supprimé");
      fetchContacts();
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Retour"
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Famille & contacts</h1>
          <p className="text-sm text-muted-foreground">Restez en contact</p>
        </div>
        <Users className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Bouton messagerie interne */}
        <Button 
          variant="default" 
          className="w-full gap-2" 
          size="lg" 
          onClick={() => navigate("/family/messages")}
        >
          <MessageCircle className="w-5 h-5" />
          Messagerie interne
        </Button>

        {!showForm ? (
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setShowForm(true)}>
            <UserPlus className="w-5 h-5" />
            Ajouter un contact
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Nouveau contact</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marie Dupont"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Lien de parenté</Label>
              <Input
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Ex: Fille, Fils, Petit-fils..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergency"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="emergency" className="text-sm">Contact d'urgence</Label>
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {contacts.length > 0 ? "Mes contacts" : "Aucun contact"}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      {contact.is_emergency_contact && (
                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-full">
                          Urgence
                        </span>
                      )}
                    </div>
                    {contact.relationship && (
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
                {(contact.phone || contact.email) && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                      >
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-accent rounded-xl p-4 flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <p className="text-sm text-foreground">
            Ajoutez vos proches pour rester en contact facilement !
          </p>
        </div>
      </div>
    </div>
  );
}
