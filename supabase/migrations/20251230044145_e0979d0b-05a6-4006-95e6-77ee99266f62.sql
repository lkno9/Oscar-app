-- Add email column to profiles and sync from auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to sync email on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Update existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Function to create notification for family members
CREATE OR REPLACE FUNCTION public.notify_family_on_mood()
RETURNS TRIGGER AS $$
DECLARE
  family_record RECORD;
  senior_name TEXT;
BEGIN
  -- Get senior name
  SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification for each linked family member
  FOR family_record IN 
    SELECT family_member_id FROM public.family_links 
    WHERE senior_id = NEW.user_id AND status = 'accepted'
  LOOP
    INSERT INTO public.family_notifications (user_id, type, title, message, related_senior_id)
    VALUES (
      family_record.family_member_id,
      'mood',
      'Nouvelle humeur enregistrée',
      COALESCE(senior_name, 'Votre proche') || ' a enregistré son humeur du jour',
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for mood notifications
DROP TRIGGER IF EXISTS notify_family_mood ON public.mood_entries;
CREATE TRIGGER notify_family_mood
  AFTER INSERT ON public.mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_family_on_mood();

-- Function to notify family on medication changes
CREATE OR REPLACE FUNCTION public.notify_family_on_medication()
RETURNS TRIGGER AS $$
DECLARE
  family_record RECORD;
  senior_name TEXT;
BEGIN
  SELECT full_name INTO senior_name FROM public.profiles WHERE id = NEW.user_id;
  
  FOR family_record IN 
    SELECT family_member_id FROM public.family_links 
    WHERE senior_id = NEW.user_id AND status = 'accepted'
  LOOP
    INSERT INTO public.family_notifications (user_id, type, title, message, related_senior_id)
    VALUES (
      family_record.family_member_id,
      'medication',
      'Médicament ajouté',
      COALESCE(senior_name, 'Votre proche') || ' a ajouté un nouveau médicament: ' || NEW.name,
      NEW.user_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for medication notifications
DROP TRIGGER IF EXISTS notify_family_medication ON public.medications;
CREATE TRIGGER notify_family_medication
  AFTER INSERT ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_family_on_medication();

-- Function to notify on new family message and trigger email
CREATE OR REPLACE FUNCTION public.notify_on_family_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Create in-app notification
  INSERT INTO public.family_notifications (user_id, type, title, message, related_senior_id)
  VALUES (
    NEW.receiver_id,
    'message',
    'Nouveau message',
    'Message de ' || COALESCE(sender_name, 'Un proche'),
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS notify_on_message ON public.family_messages;
CREATE TRIGGER notify_on_message
  AFTER INSERT ON public.family_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_family_message();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_entries;