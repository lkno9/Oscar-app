CREATE OR REPLACE FUNCTION public.accept_family_invitation(
  _invitation_code TEXT,
  _family_member_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  SELECT * INTO _invitation
  FROM public.family_links
  WHERE invitation_code = _invitation_code
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Code d''invitation invalide');
  END IF;

  IF _invitation.senior_id = _family_member_id THEN
    RETURN json_build_object('error', 'Vous ne pouvez pas accepter votre propre invitation');
  END IF;

  UPDATE public.family_links
  SET family_member_id = _family_member_id,
      status = 'accepted',
      accepted_at = now()
  WHERE id = _invitation.id;

  RETURN json_build_object('success', true, 'link_id', _invitation.id);
END;
$$;