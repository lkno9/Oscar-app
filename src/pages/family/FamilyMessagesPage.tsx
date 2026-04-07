import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCheck, Camera, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFamilyMessages } from '@/hooks/useFamilyMessages';
import { useFamilyLinks } from '@/hooks/useFamilyLinks';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { compressForUpload, IMAGE_ACCEPT } from '@/lib/fileUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// Parse photo messages: [photo:URL]
function parsePhotoUrl(content: string): string | null {
  const match = content.match(/^\[photo:(.*)\]$/);
  return match ? match[1] : null;
}

// Parse mixed content (text + photo)
function parseMessageContent(content: string): { text: string | null; photoUrl: string | null } {
  const photoMatch = content.match(/\[photo:(.*?)\]/);
  if (photoMatch) {
    const text = content.replace(/\[photo:.*?\]/, '').trim() || null;
    return { text, photoUrl: photoMatch[1] };
  }
  return { text: content, photoUrl: null };
}

export default function FamilyMessagesPage() {
  const [searchParams] = useSearchParams();
  const contactIdParam = searchParams.get('contact');
  const { user } = useAuth();
  const { isSenior } = useUserRole();
  const { linkedSeniors, linkedFamily } = useFamilyLinks();
  const [selectedContact, setSelectedContact] = useState<string | null>(contactIdParam);
  const [newMessage, setNewMessage] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isSendingPhoto, setIsSendingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { messages, loading, sendMessage, markAsRead } = useFamilyMessages(selectedContact || undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!newMessage.trim() && !pendingPhoto) || !selectedContact) return;

    if (pendingPhoto) {
      setIsSendingPhoto(true);
      try {
        // Compress and upload photo
        const compressed = await compressForUpload(pendingPhoto.file);
        const fileName = `family-photos/${user!.id}/${Date.now()}-${pendingPhoto.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(fileName, compressed, { contentType: compressed.type || 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('user-files').getPublicUrl(fileName);
        const photoUrl = urlData.publicUrl;

        // Build message content
        const messageContent = newMessage.trim()
          ? `${newMessage.trim()} [photo:${photoUrl}]`
          : `[photo:${photoUrl}]`;

        // Send message
        await sendMessage(selectedContact, messageContent);

        // Also save to photos table for the recipient (so it shows in their Photos & Souvenirs)
        const recipientId = selectedContact;
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user!.id)
          .single();

        await supabase.from('photos').insert({
          user_id: recipientId,
          url: photoUrl,
          title: `De ${senderProfile?.full_name || 'la famille'}`,
          album: 'family_received',
        });

        toast.success('Photo envoyée !');
      } catch (err) {
        toast.error("Erreur lors de l'envoi de la photo");
      } finally {
        URL.revokeObjectURL(pendingPhoto.previewUrl);
        setPendingPhoto(null);
        setIsSendingPhoto(false);
      }
    } else {
      await sendMessage(selectedContact, newMessage.trim());
    }
    setNewMessage('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo trop volumineuse (max 10 Mo)');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingPhoto({ file, previewUrl });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelPhoto = () => {
    if (pendingPhoto) {
      URL.revokeObjectURL(pendingPhoto.previewUrl);
      setPendingPhoto(null);
    }
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
  const quickReplies = isSenior
    ? ["Bonjour !", "Comment ça va ?", "Je pense à toi", "À bientôt !", "Merci"]
    : ["Bonjour !", "Comment tu vas ?", "Je pense à toi", "Appelle-moi quand tu peux", "Bisous !"];

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        {selectedContact ? (
          <>
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
              <AvatarImage src={getContactAvatar(selectedContact) || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{getContactName(selectedContact)?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{getContactName(selectedContact)}</h1>
              <p className="text-sm text-primary font-medium">En ligne</p>
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
              const { text, photoUrl } = parseMessageContent(message.content);

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
                    <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-lg'
                        : 'bg-card border border-border rounded-bl-lg text-foreground'
                    }`}>
                      {/* Photo */}
                      {photoUrl && (
                        <button onClick={() => setPreviewImage(photoUrl)} className="block w-full">
                          <img
                            src={photoUrl}
                            alt="Photo"
                            className="w-full max-h-[250px] object-cover"
                            loading="lazy"
                          />
                        </button>
                      )}
                      {/* Text */}
                      {text && (
                        <div className="px-4 py-2.5">
                          <p className="text-[15px] leading-relaxed">{text}</p>
                        </div>
                      )}
                      {/* Timestamp */}
                      <div className={`flex items-center justify-end gap-1 px-3 pb-2 ${!text && photoUrl ? 'pt-1' : ''} ${isOwn ? 'text-white/50' : 'text-muted-foreground'}`}>
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
          {/* Quick replies */}
          {messages.length > 0 && !pendingPhoto && (
            <div className="px-3 pt-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                {quickReplies.map((r) => (
                  <button key={r} onClick={() => setNewMessage(r)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 transition-colors">{r}</button>
                ))}
              </div>
            </div>
          )}

          {/* Photo preview */}
          {pendingPhoto && (
            <div className="px-3 pt-3 relative">
              <div className="relative inline-block">
                <img src={pendingPhoto.previewUrl} alt="Preview" className="h-24 rounded-xl object-cover border border-border" />
                <button
                  onClick={cancelPhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div className="p-3 flex items-end gap-2">
            {/* Photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors flex-shrink-0"
              aria-label="Envoyer une photo"
            >
              <Camera className="w-5 h-5 text-primary" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={pendingPhoto ? "Ajouter un message..." : "Votre message..."}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1 h-12 rounded-2xl border border-border bg-secondary px-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !pendingPhoto) || isSendingPhoto}
              size="icon"
              className="w-12 h-12 rounded-full shrink-0"
            >
              {isSendingPhoto ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Photo fullscreen preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={previewImage} alt="Photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
