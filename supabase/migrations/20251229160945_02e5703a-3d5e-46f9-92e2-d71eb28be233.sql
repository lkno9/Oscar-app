-- Allow anyone to read pending invitations by code (for accepting invitations)
CREATE POLICY "Anyone can find pending invitations by code"
ON public.family_links
FOR SELECT
USING (status = 'pending' AND invitation_code IS NOT NULL);

-- Allow authenticated users to update pending invitations (to accept them)
CREATE POLICY "Authenticated users can accept pending invitations"
ON public.family_links
FOR UPDATE
USING (status = 'pending' AND invitation_code IS NOT NULL)
WITH CHECK (auth.uid() = family_member_id);

-- Allow family members to view linked seniors' profiles
CREATE POLICY "Family can view linked seniors profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = profiles.id
    AND family_links.family_member_id = auth.uid()
  )
);

-- Allow seniors to view linked family members' profiles
CREATE POLICY "Seniors can view linked family profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.family_member_id = profiles.id
    AND family_links.senior_id = auth.uid()
  )
);

-- Allow family members to view linked seniors' wellness data
CREATE POLICY "Family can view linked seniors mood"
ON public.mood_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = mood_entries.user_id
    AND family_links.family_member_id = auth.uid()
  )
);

CREATE POLICY "Family can view linked seniors wellness"
ON public.daily_wellness
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = daily_wellness.user_id
    AND family_links.family_member_id = auth.uid()
  )
);

CREATE POLICY "Family can view linked seniors medications"
ON public.medications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = medications.user_id
    AND family_links.family_member_id = auth.uid()
  )
);

CREATE POLICY "Family can view linked seniors events"
ON public.events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = events.user_id
    AND family_links.family_member_id = auth.uid()
  )
);

CREATE POLICY "Family can view linked seniors activities"
ON public.wellness_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_links
    WHERE family_links.status = 'accepted'
    AND family_links.senior_id = wellness_activities.user_id
    AND family_links.family_member_id = auth.uid()
  )
);