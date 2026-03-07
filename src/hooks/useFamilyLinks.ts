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

      // Fetch profiles for both senior and family member
      const linksWithProfiles = await Promise.all(
        (data || []).map(async (link) => {
          // Get senior profile
          const { data: seniorProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', link.senior_id)
            .single();

          // Get family member profile (only if different from senior)
          let familyProfile = null;
          if (link.family_member_id !== link.senior_id) {
            const { data: fProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', link.family_member_id)
              .single();
            familyProfile = fProfile;
          }

          return {
            ...link,
            senior_profile: seniorProfile,
            family_profile: familyProfile
          };
        })
      );

      setLinks(linksWithProfiles);
    } catch (err) {
      // Error fetching family links
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const createInvitation = async (relationship: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Use crypto API for secure random code generation
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const invitationCode = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').substring(0, 8).toUpperCase();

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

    const { data, error } = await supabase.rpc('accept_family_invitation', {
      _invitation_code: code,
      _family_member_id: user.id,
    });

    if (error) return { error };

    if (data?.error) {
      return { error: new Error(data.error) };
    }

    await fetchLinks();
    return { error: null };
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
