-- ============================================================
-- Migration : index sur les clés étrangères sans index
-- Identifiés par audit : call_history, document_reminders, photos
-- ============================================================

-- call_history.contact_id → contacts
CREATE INDEX IF NOT EXISTS idx_call_history_contact_id
  ON public.call_history (contact_id);

-- document_reminders.document_id → documents
CREATE INDEX IF NOT EXISTS idx_document_reminders_document_id
  ON public.document_reminders (document_id);

-- photos.album_id → photo_albums
CREATE INDEX IF NOT EXISTS idx_photos_album_id
  ON public.photos (album_id);
