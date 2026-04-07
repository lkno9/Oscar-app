import { ArrowLeft, MessageCircle, Phone, Video, Users, Send, PhoneIncoming, PhoneOutgoing, PhoneMissed, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useFamilyMessages } from "@/hooks/useFamilyMessages";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CallScreen } from "@/components/CallScreen";

interface FamilyContact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Call {
  id: string;
  contact_name: string | null;
  call_type: string | null;
  call_date: string;
  duration: number | null;
}

// Parse photo messages: [photo:URL]
function parsePhotoUrl(content: string): string | null {
  const match = content.match(/^\[photo:(.*)\]$/);
  return match ? match[1] : null;
}

export function CommunicationPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<FamilyContact | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the shared messaging hook for the selected contact
  const { messages, loading: messagesLoading, unreadCount, sendMessage, markAsRead } = useFamilyMessages(selectedContact?.id);

  // Handle prefill from Oscar redirect
  useEffect(() => {
    const state = location.state as { prefill?: string; contactName?: string } | null;
    if (state?.prefill) {
      setNewMessage(state.prefill);
    }
    if (state?.contactName && contacts.length > 0) {
      const match = contacts.find(c =>
        c.name.toLowerCase().includes(state!.contactName!.toLowerCase())
      );
      if (match) setSelectedContact(match);
    }
    // Clear the location state after reading
    if (state?.prefill || state?.contactName) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, contacts]);

  useEffect(() => {
    if (user) fetchContactsAndCalls();
  }, [user]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (selectedContact && messages.length > 0) {
      const unreadIds = messages
        .filter(m => m.receiver_id === user?.id && !m.is_read)
        .map(m => m.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    }
  }, [selectedContact, messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchContactsAndCalls = async () => {
    const [contactsRes, callsRes] = await Promise.all([
      supabase.from('family_contacts').select('id, name, relationship, phone, email, avatar_url').order('name'),
      supabase.from('call_history').select('*').order('call_date', { ascending: false }).limit(20),
    ]);
    if (contactsRes.data) setContacts(contactsRes.data);
    if (callsRes.data) setCalls(callsRes.data);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    const msg = newMessage.trim();
    setNewMessage("");
    const { error } = await sendMessage(selectedContact.id, msg);
    if (error) {
      setNewMessage(msg);
      toast.error("Erreur lors de l'envoi du message");
    } else {
      toast.success("Message envoyé !");
    }
  };

  const getContactById = (id: string) => contacts.find(c => c.id === id);

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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Hier, ${format(date, 'HH:mm')}`;
    return format(date, "d MMM, HH:mm", { locale: fr });
  };

  const formatDuration = (s: number | null) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    return m < 1 ? `${s} sec` : `${m} min`;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Determine sender display info
  const getSenderInfo = (senderId: string) => {
    if (senderId === user?.id) return { name: "Vous", isMe: true };
    const contact = getContactById(senderId);
    if (contact) return { name: contact.name, relationship: contact.relationship, isMe: false };
    // Try from message sender_profile
    const msg = messages.find(m => m.sender_id === senderId);
    if (msg?.sender_profile?.full_name) return { name: msg.sender_profile.full_name, isMe: false };
    return { name: "Inconnu", isMe: false };
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Communication</h1>
          <p className="text-sm text-muted-foreground">Messages & appels avec vos proches</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        <MessageCircle className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="messages" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid grid-cols-2 flex-shrink-0">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ml-1">
                  {unreadCount}
                </span>
              )}
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
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[72px] relative ${
                        selectedContact?.id === c.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">{getInitials(c.name)}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground text-center leading-tight max-w-[64px] truncate">{c.name.split(' ')[0]}</span>
                      {c.relationship && (
                        <span className="text-[10px] text-muted-foreground">{c.relationship}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation with selected contact */}
            {selectedContact ? (
              <div className="flex flex-col gap-3">
                {/* Conversation header */}
                <div className="bg-primary/5 rounded-xl px-4 py-3 flex items-center gap-3 border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold text-xs">{getInitials(selectedContact.name)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{selectedContact.name}</p>
                    {selectedContact.relationship && (
                      <p className="text-xs text-muted-foreground">{selectedContact.relationship}</p>
                    )}
                  </div>
                </div>

                {/* Messages list */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
                    {messagesLoading ? (
                      <p className="text-center py-6 text-muted-foreground text-sm">Chargement...</p>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Commencez la conversation !</p>
                      </div>
                    ) : (
                      <>
                        {messages.map(msg => {
                          const sender = getSenderInfo(msg.sender_id);
                          const photoUrl = parsePhotoUrl(msg.content);

                          return (
                            <div key={msg.id} className={`flex flex-col ${sender.isMe ? 'items-end' : 'items-start'}`}>
                              {!sender.isMe && (
                                <span className="text-[11px] font-medium text-primary ml-1 mb-0.5">
                                  {sender.name}{sender.relationship ? ` — ${sender.relationship}` : ''}
                                </span>
                              )}
                              <div className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                                sender.isMe
                                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                                  : 'bg-secondary text-foreground'
                              }`}>
                                {photoUrl ? (
                                  <button onClick={() => setPreviewImage(photoUrl)} className="block">
                                    <img src={photoUrl} alt="Photo" className="rounded-lg max-w-[200px] max-h-[200px] object-cover" />
                                  </button>
                                ) : (
                                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 mx-1">
                                <span className={`text-[10px] ${sender.isMe ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                                {sender.isMe && (
                                  msg.is_read
                                    ? <CheckCheck className="w-3 h-3 text-primary" />
                                    : <Check className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message input */}
                  <div className="border-t border-border p-3 flex gap-2 items-end">
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="Écrivez votre message..."
                      className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] max-h-[100px]"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-11 w-11 rounded-xl flex-shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Recent messages overview (no contact selected) */
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
                    <p className="text-xs text-muted-foreground mt-1">Sélectionnez un contact ci-dessus pour envoyer un message</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.slice(-20).reverse().map(msg => {
                      const sender = getSenderInfo(msg.sender_id);
                      const photoUrl = parsePhotoUrl(msg.content);
                      return (
                        <div key={msg.id} className={`rounded-xl p-4 border flex gap-3 items-start ${
                          sender.isMe ? 'bg-primary/5 border-primary/15 ml-2' : 'bg-card border-border mr-2'
                        }`}>
                          {!sender.isMe && (
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold text-xs">{getInitials(sender.name)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">
                                {sender.isMe ? 'Vous' : sender.name}
                              </span>
                              {!sender.isMe && sender.relationship && (
                                <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                                  {sender.relationship}
                                </span>
                              )}
                            </div>
                            {photoUrl ? (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <ImageIcon className="w-4 h-4" />
                                <span>Photo</span>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                              {sender.isMe && (
                                msg.is_read
                                  ? <CheckCheck className="w-3 h-3 text-primary" />
                                  : <Check className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* CALLS TAB */}
          <TabsContent value="calls" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
            {/* Quick call buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-auto py-4 flex-col gap-2 min-h-[72px]" size="lg" onClick={() => { setCallType("audio"); setIsCallOpen(true); }}>
                <Phone className="w-6 h-6" />
                <span className="text-base">Appel audio</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex-col gap-2 min-h-[72px]" size="lg" onClick={() => { setCallType("video"); setIsCallOpen(true); }}>
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

      {/* Photo preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

      {/* Oscar Call Screen */}
      <CallScreen
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        initialVideoEnabled={callType === "video"}
      />
    </div>
  );
}
