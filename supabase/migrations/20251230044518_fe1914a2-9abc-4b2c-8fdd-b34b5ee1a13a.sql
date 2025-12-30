-- Fix: Update triggers to use correct column name (senior_id instead of related_senior_id)

-- Function to create notification for family members on mood
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
    INSERT INTO public.family_notifications (user_id, type, title, message, senior_id)
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
    INSERT INTO public.family_notifications (user_id, type, title, message, senior_id)
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

-- Function to notify on new family message
CREATE OR REPLACE FUNCTION public.notify_on_family_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Create in-app notification
  INSERT INTO public.family_notifications (user_id, type, title, message, senior_id)
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

-- Allow system to insert notifications (for triggers)
DROP POLICY IF EXISTS "System can insert notifications" ON public.family_notifications;
CREATE POLICY "System can insert notifications"
ON public.family_notifications
FOR INSERT
WITH CHECK (true);