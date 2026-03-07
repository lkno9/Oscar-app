import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, User, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
      const firstContact = isSenior ? contacts[0].family_member_id : contacts[0].senior_id;
      setSelectedContact(firstContact);
    }
  }, [contacts, selectedContact, isSenior]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedContact && messages.length > 0) {
      const unreadIds = messages
        .filter(m => m.receiver_id === user?.id && !m.is_read)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [messages, selectedContact, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    await sendMessage(selectedContact, newMessage.trim());
    setNewMessage('');
  };

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
  };

  const getContactName = (contactId: string) => {
    const link = contacts.find(l =>
      (isSenior ? l.family_member_id : l.senior_id) === contactId
    );
    return isSenior
      ? link?.family_profile?.full_name
      : link?.senior_profile?.full_name || 'Contact';
  };

  const getContactAvatar = (contactId: string) => {
    const link = contacts.find(l =>
      (isSenior ? l.family_member_id : l.senior_id) === contactId
    );
    return isSenior
      ? link?.family_profile?.avatar_url
      : link?.senior_profile?.avatar_url;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return "Aujourd'hui";
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Hier';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const isDifferentDay = (date1: string, date2: string) => {
    return format(new Date(date1), 'yyyy-MM-dd') !== format(new Date(date2), 'yyyy-MM-dd');
  };

  const quickReplies = [
    "Bonjour !",
    "Comment ça va ?",
    "Je pense à toi",
    "À bientôt !",
    "Merci"
  ];

  const backLink = isSenior ? '/settings/family-access' : '/family';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to={backLink}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {selectedContact ? (
            <>
              <div className="relative">
                <Avatar className="w-11 h-11 ring-2 ring-primary/20">
                  <AvatarImage src={getContactAvatar(selectedContact) || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getContactName(selectedContact)?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">
                  {getContactName(selectedContact)}
                </h1>
                <p className="text-xs text-green-600">En ligne</p>
              </div>
            </>
          ) : (
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
          )}
        </div>
      </header>

      {/* Contact Selector */}
      {contacts.length > 1 && (
        <div className="px-4 py-3 bg-muted/30 border-b border-border overflow-x-auto scrollbar-hide">
          <div className="flex gap-3">
            {contacts.map((link) => {
              const contactId = isSenior ? link.family_member_id : link.senior_id;
              const profile = isSenior ? link.family_profile : link.senior_profile;
              const isSelected = selectedContact === contactId;

              return (
                <button
                  key={link.id}
                  onClick={() => setSelectedContact(contactId)}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className={`relative rounded-full transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className={`text-[11px] max-w-[56px] truncate ${isSelected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {profile?.full_name?.split(' ')[0] || 'Contact'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {contacts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Aucun contact</h3>
              <p className="text-sm text-muted-foreground">
                {isSenior
                  ? "Invitez un membre de votre famille depuis les paramètres."
                  : "Entrez le code d'invitation de votre proche pour commencer."}
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Aucun message</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez le premier message à {getContactName(selectedContact!)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showDateSeparator = index === 0 ||
                isDifferentDay(messages[index - 1].created_at, message.created_at);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <Separator className="flex-1" />
                      <span className="text-[11px] text-muted-foreground font-medium bg-background px-2 whitespace-nowrap">
                        {getDateLabel(message.created_at)}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}

                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} msg-fade-up`}>
                    {!isOwn && (
                      <Avatar className="w-8 h-8 mr-2 mt-auto mb-1 flex-shrink-0">
                        <AvatarImage src={getContactAvatar(selectedContact!) || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getContactName(selectedContact!)?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border rounded-bl-md'
                    }`}>
                      <p className="text-[15px] leading-relaxed">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      }`}>
                        <p className="text-[10px]">
                          {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                        </p>
                        {isOwn && message.is_read && (
                          <CheckCheck className="w-3 h-3" />
                        )}
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

      {/* Quick Replies + Message Input */}
      {selectedContact && contacts.length > 0 && (
        <div className="bg-card border-t border-border">
          {/* Quick Replies */}
          {messages.length > 0 && (
            <div className="px-3 pt-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 rounded-full text-xs h-8 px-3 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3">
            <div className="flex items-end gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Votre message..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1 h-12 rounded-2xl border-primary/20 text-[15px] focus:ring-primary/30 bg-muted/50"
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                size="icon"
                className="w-12 h-12 rounded-full shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
