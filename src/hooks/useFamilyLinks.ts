import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FamilyLink {
  id: string;
  senior_id: string;
  family_member_id: string;
  relationship: string;
  status: string;
  invitation_code: string | null;
  created_at: string;
  accepted_at: string | null;
  senior_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  family_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useFamilyLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_links')
        .select('*')
        .or(`senior_id.eq.${user.id},family_member_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch profiles for linked users
      const linksWithProfiles = await Promise.all(
        (data || []).map(async (link) => {
          const otherUserId = link.senior_id === user.id ? link.family_member_id : link.senior_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          return {
            ...link,
            [link.senior_id === user.id ? 'family_profile' : 'senior_profile']: profile
          };
        })
      );

      setLinks(linksWithProfiles);
    } catch (err) {
      console.error('Error fetching family links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const createInvitation = async (relationship: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('family_links')
      .insert({
        senior_id: user.id,
        family_member_id: user.id, // Temporary, will be updated when accepted
        relationship,
        status: 'pending',
        invitation_code: invitationCode
      })
      .select()
      .single();

    if (!error) {
      await fetchLinks();
    }

    return { data, error, invitationCode };
  };

  const acceptInvitation = async (code: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Find the invitation
    const { data: invitation, error: findError } = await supabase
      .from('family_links')
      .select('*')
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single();

    if (findError || !invitation) {
      return { error: new Error('Code d\'invitation invalide') };
    }

    // Update the invitation
    const { error } = await supabase
      .from('family_links')
      .update({
        family_member_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (!error) {
      await fetchLinks();
    }

    return { error };
  };

  const removeLink = async (linkId: string) => {
    const { error } = await supabase
      .from('family_links')
      .delete()
      .eq('id', linkId);

    if (!error) {
      await fetchLinks();
    }

    return { error };
  };

  const linkedSeniors = links.filter(l => l.family_member_id === user?.id && l.status === 'accepted');
  const linkedFamily = links.filter(l => l.senior_id === user?.id && l.status === 'accepted');
  const pendingInvitations = links.filter(l => l.senior_id === user?.id && l.status === 'pending');

  return {
    links,
    linkedSeniors,
    linkedFamily,
    pendingInvitations,
    loading,
    createInvitation,
    acceptInvitation,
    removeLink,
    refetch: fetchLinks
  };
}
