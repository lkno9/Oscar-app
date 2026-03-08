import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFamilyMessages } from '@/hooks/useFamilyMessages';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FamilyMessagesPage() {
  const [searchParams] = useSearchParams();
  const contactIdParam = searchParams.get('contact');
  const { user } = useAuth();
  const { isSenior } = useUserRole();
  const { linkedSeniors, linkedFamily } = useFamilyLinks();
  const [selectedContact, setSelectedContact] = useState<string | null>(contactIdParam);
  const [newMessage, setNewMessage] = useState('');
  const { messages, loading, sendMessage, markAsRead } = useFamilyMessages(selectedContact || undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = isSenior ? linkedFamily : linkedSeniors;

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(isSenior ? contacts[0].family_member_id : contacts[0].senior_id);
    }
  }, [contacts, selectedContact, isSenior]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (selectedContact && messages.length > 0) {
      const unreadIds = messages.filter(m => m.receiver_id === user?.id && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    }
  }, [messages, selectedContact, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    await sendMessage(selectedContact, newMessage.trim());
    setNewMessage('');
  };

  const getContactName = (contactId: string) => {
    const link = contacts.find(l => (isSenior ? l.family_member_id : l.senior_id) === contactId);
    return isSenior ? link?.family_profile?.full_name : link?.senior_profile?.full_name || 'Contact';
  };

  const getContactAvatar = (contactId: string) => {
    const link = contacts.find(l => (isSenior ? l.family_member_id : l.senior_id) === contactId);
    return isSenior ? link?.family_profile?.avatar_url : link?.senior_profile?.avatar_url;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return "Aujourd'hui";
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Hier';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const isDifferentDay = (d1: string, d2: string) => format(new Date(d1), 'yyyy-MM-dd') !== format(new Date(d2), 'yyyy-MM-dd');
  const quickReplies = ["Bonjour !", "Comment ça va ?", "Je pense à toi", "À bientôt !", "Merci"];
  const backLink = isSenior ? '/settings/family-access' : '/family';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 sticky top-0 z-10">
        <Link to={backLink}>
          <button className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
        {selectedContact ? (
          <>
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
              <AvatarImage src={getContactAvatar(selectedContact) || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{getContactName(selectedContact)?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{getContactName(selectedContact)}</h1>
              <p className="text-xs text-primary font-medium">En ligne</p>
            </div>
          </>
        ) : (
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
        )}
      </header>

      {/* Contact Selector (si > 1) */}
      {contacts.length > 1 && (
        <div className="px-4 py-3 bg-card border-b border-border overflow-x-auto scrollbar-hide">
          <div className="flex gap-3">
            {contacts.map((link) => {
              const contactId = isSenior ? link.family_member_id : link.senior_id;
              const profile = isSenior ? link.family_profile : link.senior_profile;
              const isSelected = selectedContact === contactId;
              return (
                <button key={link.id} onClick={() => setSelectedContact(contactId)} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`rounded-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className={`text-[10px] max-w-[50px] truncate ${isSelected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{profile?.full_name?.split(' ')[0] || 'Contact'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {contacts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center py-12 px-8">
            <div>
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-bold text-foreground mb-2">Aucun contact</h3>
              <p className="text-sm text-muted-foreground">{isSenior ? "Invitez un membre de votre famille depuis les paramètres." : "Entrez le code d'invitation de votre proche pour commencer."}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center py-12 px-8">
            <div>
              <div className="text-5xl mb-4">👋</div>
              <h3 className="font-bold text-foreground mb-2">Dites bonjour !</h3>
              <p className="text-sm text-muted-foreground">Envoyez le premier message à {getContactName(selectedContact!)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showDate = index === 0 || isDifferentDay(messages[index - 1].created_at, message.created_at);
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[10px] text-muted-foreground font-medium bg-secondary px-3 py-1 rounded-full">{getDateLabel(message.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && (
                      <Avatar className="w-7 h-7 mr-2 mt-auto mb-1 flex-shrink-0">
                        <AvatarImage src={getContactAvatar(selectedContact!) || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getContactName(selectedContact!)?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-lg'
                        : 'bg-card border border-border rounded-bl-lg text-foreground'
                    }`}>
                      <p className="text-[15px] leading-relaxed">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/50' : 'text-muted-foreground'}`}>
                        <p className="text-[10px]">{format(new Date(message.created_at), 'HH:mm')}</p>
                        {isOwn && message.is_read && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {selectedContact && contacts.length > 0 && (
        <div className="bg-card border-t border-border">
          {messages.length > 0 && (
            <div className="px-3 pt-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                {quickReplies.map((r) => (
                  <button key={r} onClick={() => setNewMessage(r)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors">{r}</button>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 flex items-end gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1 h-12 rounded-2xl border border-border bg-secondary px-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon" className="w-12 h-12 rounded-full shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
