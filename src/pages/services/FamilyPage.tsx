import { ArrowLeft, Users, MessageCircle, UserPlus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FamilyPage() {
  const navigate = useNavigate();

  const contacts = [
    { id: 1, name: "Marie (fille)", avatar: "👩", lastMessage: "À demain maman !", time: "14:30" },
    { id: 2, name: "Pierre (fils)", avatar: "👨", lastMessage: "Je passe ce weekend", time: "Hier" },
    { id: 3, name: "Sophie (petite-fille)", avatar: "👧", lastMessage: "❤️", time: "Lun" },
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
          <h1 className="text-lg font-bold text-foreground">Famille & messages</h1>
          <p className="text-sm text-muted-foreground">Restez en contact</p>
        </div>
        <Users className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Button variant="outline" className="w-full gap-2" size="lg">
          <UserPlus className="w-5 h-5" />
          Ajouter un contact
        </Button>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Conversations récentes
          </h2>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {contact.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{contact.name}</h3>
                  <span className="text-xs text-muted-foreground">{contact.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent rounded-xl p-4 flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <p className="text-sm text-foreground">
            Envoyez un message à votre famille pour prendre des nouvelles !
          </p>
        </div>
      </div>
    </div>
  );
}
