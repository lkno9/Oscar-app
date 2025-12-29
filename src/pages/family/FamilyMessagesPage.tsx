import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Get contacts list based on role
  const contacts = isSenior ? linkedFamily : linkedSeniors;

  // Auto-select first contact if none selected
  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      const firstContact = isSenior ? contacts[0].family_member_id : contacts[0].senior_id;
      setSelectedContact(firstContact);
    }
  }, [contacts, selectedContact, isSenior]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
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

  const backLink = isSenior ? '/settings/family-access' : '/family';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={backLink}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {selectedContact ? (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage src={getContactAvatar(selectedContact) || undefined} />
                <AvatarFallback>
                  {getContactName(selectedContact)?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {getContactName(selectedContact)}
                </h1>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </>
          ) : (
            <h1 className="text-lg font-bold text-foreground">Messages</h1>
          )}
        </div>
      </header>

      {/* Contact Selector (if multiple contacts) */}
      {contacts.length > 1 && (
        <div className="p-2 bg-muted/50 border-b border-border overflow-x-auto">
          <div className="flex gap-2">
            {contacts.map((link) => {
              const contactId = isSenior ? link.family_member_id : link.senior_id;
              const profile = isSenior ? link.family_profile : link.senior_profile;
              const isSelected = selectedContact === contactId;

              return (
                <Button
                  key={link.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedContact(contactId)}
                  className="flex-shrink-0"
                >
                  <Avatar className="w-5 h-5 mr-2">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.full_name || 'Contact'}
                </Button>
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
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun contact</h3>
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
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Aucun message</h3>
              <p className="text-sm text-muted-foreground">
                Envoyez le premier message à {getContactName(selectedContact!)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      {selectedContact && contacts.length > 0 && (
        <div className="p-4 bg-card border-t border-border">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
