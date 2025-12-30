import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useFamilyMessages(contactId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('family_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (contactId) {
        query = query.or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`
        );
      } else {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          return { ...msg, sender_profile: profile };
        })
      );

      setMessages(messagesWithProfiles);

      // Count unread
      const unread = (data || []).filter(m => m.receiver_id === user.id && !m.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('family-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            newMessage.sender_id === user?.id ||
            newMessage.receiver_id === user?.id
          ) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Get sender name for email notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('family_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content
      })
      .select()
      .single();

    if (!error) {
      await fetchMessages();
      
      // Send email notification via edge function
      try {
        await supabase.functions.invoke('send-family-notification', {
          body: {
            type: 'message',
            recipientId: receiverId,
            senderName: senderProfile?.full_name || 'Un proche',
            content: content
          }
        });
      } catch (emailError) {
        console.log('Email notification failed (non-blocking):', emailError);
      }
    }

    return { data, error };
  };

  const markAsRead = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    await supabase
      .from('family_messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .eq('receiver_id', user.id);

    await fetchMessages();
  };

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
}
