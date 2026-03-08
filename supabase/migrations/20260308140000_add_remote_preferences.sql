-- Ajout des préférences configurables à distance par les proches
-- Stockées en JSONB pour flexibilité (ajout futur de préférences sans migration)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS remote_preferences jsonb DEFAULT '{
  "voice_enabled": true,
  "notifications_enabled": true,
  "dark_mode_enabled": false,
  "font_size": "normal",
  "medication_reminders": true,
  "activity_reminders": true,
  "mood_reminders": true
}'::jsonb;

-- Commentaire descriptif
COMMENT ON COLUMN profiles.remote_preferences IS 'Préférences configurables à distance par les membres famille. Clés: voice_enabled, notifications_enabled, dark_mode_enabled, font_size (small/normal/large/xlarge), medication_reminders, activity_reminders, mood_reminders';

-- RLS : les membres famille liés peuvent lire ET modifier les remote_preferences de leur senior
-- (lecture déjà possible via les policies existantes, on ajoute la mise à jour)
CREATE POLICY "family_can_update_senior_preferences"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM family_links
    WHERE family_links.senior_id = profiles.id
    AND family_links.family_member_id = auth.uid()
    AND family_links.status = 'accepted'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_links
    WHERE family_links.senior_id = profiles.id
    AND family_links.family_member_id = auth.uid()
    AND family_links.status = 'accepted'
  )
);
