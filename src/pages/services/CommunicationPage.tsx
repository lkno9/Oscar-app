import { ArrowLeft, MessageCircle, Phone, Video, Users, Send, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FamilyContact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean | null;
}

interface Call {
  id: string;
  contact_name: string | null;
  call_type: string | null;
  call_date: string;
  duration: number | null;
}

export function CommunicationPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<FamilyContact | null>(null);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    const [contactsRes, messagesRes, callsRes] = await Promise.all([
      supabase.from('family_contacts').select('id, name, relationship, phone').order('name'),
      supabase.from('family_messages').select('*').or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`).order('created_at', { ascending: false }).limit(50),
      supabase.from('call_history').select('*').order('call_date', { ascending: false }).limit(20),
    ]);
    if (contactsRes.data) setContacts(contactsRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    if (callsRes.data) setCalls(callsRes.data);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    await supabase.from('family_messages').insert({
      sender_id: user.id,
      receiver_id: selectedContact.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    fetchAll();
  };

  const getCallIcon = (type: string | null) => {
    switch (type) {
      case "incoming": return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case "outgoing": return <PhoneOutgoing className="w-5 h-5 text-primary" />;
      case "missed": return <PhoneMissed className="w-5 h-5 text-destructive" />;
      default: return <Phone className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return `Aujourd'hui, ${format(date, 'HH:mm')}`;
    return format(date, "d MMM, HH:mm", { locale: fr });
  };

  const formatDuration = (s: number | null) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    return m < 1 ? `${s} sec` : `${m} min`;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Communication</h1>
          <p className="text-sm text-muted-foreground">Messages & appels famille</p>
        </div>
        <MessageCircle className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="messages" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid grid-cols-2 flex-shrink-0">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Appels
            </TabsTrigger>
          </TabsList>

          {/* MESSAGES TAB */}
          <TabsContent value="messages" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
            {/* Contact selector */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Envoyer un message à
              </p>
              {contacts.length === 0 ? (
                <div className="bg-card rounded-xl p-4 text-center border border-border">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Aucun contact famille</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/services/family')}>
                    Ajouter un contact
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(selectedContact?.id === c.id ? null : c)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[72px] ${
                        selectedContact?.id === c.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">{getInitials(c.name)}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground text-center leading-tight max-w-[64px] truncate">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message input */}
            {selectedContact && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Message pour <span className="text-primary">{selectedContact.name}</span>
                </p>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="w-full bg-secondary rounded-lg px-3 py-3 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="w-full min-h-[48px]">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            )}

            {/* Recent messages */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Messages récents
              </p>
              {loading ? (
                <p className="text-center py-6 text-muted-foreground">Chargement...</p>
              ) : messages.length === 0 ? (
                <div className="bg-card rounded-xl p-6 text-center border border-border">
                  <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun message pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div key={msg.id} className={`rounded-xl p-4 border ${msg.sender_id === user?.id ? 'bg-primary/10 border-primary/20 ml-4' : 'bg-card border-border mr-4'}`}>
                      <p className="text-base text-foreground">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(msg.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* CALLS TAB */}
          <TabsContent value="calls" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
            {/* Quick call buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-auto py-4 flex-col gap-2 min-h-[72px]" size="lg">
                <Phone className="w-6 h-6" />
                <span className="text-base">Appel audio</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex-col gap-2 min-h-[72px]" size="lg">
                <Video className="w-6 h-6" />
                <span className="text-base">Appel vidéo</span>
              </Button>
            </div>

            {/* Contacts to call */}
            {contacts.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Appeler</p>
                <div className="space-y-2">
                  {contacts.filter(c => c.phone).map(c => (
                    <div key={c.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold">{getInitials(c.name)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.relationship || c.phone}</p>
                      </div>
                      <a href={`tel:${c.phone}`} className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Phone className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call history */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historique</p>
              {loading ? (
                <p className="text-center py-6 text-muted-foreground">Chargement...</p>
              ) : calls.length === 0 ? (
                <div className="bg-card rounded-xl p-6 text-center border border-border">
                  <Phone className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun appel pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {calls.map(call => (
                    <div key={call.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {getCallIcon(call.call_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{call.contact_name || 'Inconnu'}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(call.call_date)}</p>
                      </div>
                      {call.duration && <span className="text-sm text-muted-foreground">{formatDuration(call.duration)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
