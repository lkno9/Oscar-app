-- ============================================
-- OSCAR - Schema complet Supabase
-- Prêt à exécuter sur un projet Supabase vierge
-- Généré : 2026-02-10
-- ============================================

-- ===================
-- EXTENSIONS
-- ===================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- ENUMS
-- ===================
CREATE TYPE public.app_role AS ENUM ('senior', 'family_member');

-- ===================
-- FONCTIONS UTILITAIRES
-- ===================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ===================
-- FONCTIONS TRIGGERS AUTH
-- ===================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'senior'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================
-- FONCTIONS NOTIFICATIONS
-- ===================
CREATE OR REPLACE FUNCTION public.notify_on_family_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.family_notifications (user_id, type, title, message, senior_id)
  VALUES (
    NEW.receiver_id, 'message', 'Nouveau message',
    'Message de ' || COALESCE(sender_name, 'Un proche'), NEW.sender_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_family_on_mood()
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
      family_record.family_member_id, 'mood', 'Nouvelle humeur enregistrée',
      COALESCE(senior_name, 'Votre proche') || ' a enregistré son humeur du jour', NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
      family_record.family_member_id, 'medication', 'Médicament ajouté',
      COALESCE(senior_name, 'Votre proche') || ' a ajouté un nouveau médicament: ' || NEW.name, NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- TABLES
-- =============================================

-- --- PROFILES ---
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Family can view linked seniors profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = profiles.id AND family_member_id = auth.uid()));
CREATE POLICY "Seniors can view linked family profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND family_member_id = profiles.id AND senior_id = auth.uid()));

-- --- USER ROLES ---
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- --- FAMILY LINKS ---
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL,
  family_member_id UUID NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'family',
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_code TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seniors can manage their family links" ON public.family_links FOR ALL
  USING (auth.uid() = senior_id OR auth.uid() = family_member_id)
  WITH CHECK (auth.uid() = senior_id OR auth.uid() = family_member_id);
CREATE POLICY "Anyone can find pending invitations by code" ON public.family_links FOR SELECT
  USING (status = 'pending' AND invitation_code IS NOT NULL);
CREATE POLICY "Authenticated users can accept pending invitations" ON public.family_links FOR UPDATE
  USING (status = 'pending' AND invitation_code IS NOT NULL)
  WITH CHECK (auth.uid() = family_member_id);

-- --- FAMILY CONTACTS ---
CREATE TABLE public.family_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_emergency_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own contacts" ON public.family_contacts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- FAMILY MESSAGES ---
CREATE TABLE public.family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.family_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages to linked family" ON public.family_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM family_links WHERE status = 'accepted'
    AND ((senior_id = auth.uid() AND family_member_id = family_messages.receiver_id)
      OR (family_member_id = auth.uid() AND senior_id = family_messages.receiver_id))
  ));
CREATE POLICY "Users can update their received messages" ON public.family_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- --- FAMILY NOTIFICATIONS ---
CREATE TABLE public.family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  senior_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notifications" ON public.family_notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.family_notifications FOR INSERT
  WITH CHECK (true);

-- --- MEDICATIONS ---
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own medications" ON public.medications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors medications" ON public.medications FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = medications.user_id AND family_member_id = auth.uid()));

-- --- HEALTH RECORDS ---
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value TEXT,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own health records" ON public.health_records FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- DAILY WELLNESS ---
CREATE TABLE public.daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  steps_goal INTEGER DEFAULT 6000,
  activity_minutes INTEGER DEFAULT 0,
  activity_goal_minutes INTEGER DEFAULT 30,
  sleep_minutes INTEGER DEFAULT 0,
  sleep_goal_minutes INTEGER DEFAULT 480,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_wellness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own wellness" ON public.daily_wellness FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors wellness" ON public.daily_wellness FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = daily_wellness.user_id AND family_member_id = auth.uid()));

-- --- WELLNESS ACTIVITIES ---
CREATE TABLE public.wellness_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activities" ON public.wellness_activities FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors activities" ON public.wellness_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = wellness_activities.user_id AND family_member_id = auth.uid()));

-- --- MOOD ENTRIES ---
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_level INTEGER NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own mood" ON public.mood_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors mood" ON public.mood_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = mood_entries.user_id AND family_member_id = auth.uid()));

-- --- DOCUMENTS ---
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  document_type TEXT DEFAULT 'autre',
  file_url TEXT,
  file_size TEXT,
  expiration_date DATE,
  reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own documents" ON public.documents FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- DOCUMENT REMINDERS ---
CREATE TABLE public.document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id),
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reminders" ON public.document_reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can insert reminders" ON public.document_reminders FOR INSERT
  WITH CHECK (true);

-- --- EVENTS ---
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT DEFAULT 'general',
  reminder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own events" ON public.events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors events" ON public.events FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = events.user_id AND family_member_id = auth.uid()));

-- --- PAYMENTS ---
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT DEFAULT 'expense',
  category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own payments" ON public.payments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- ADMINISTRATIVE TASKS ---
CREATE TABLE public.administrative_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'todo',
  template_id TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.administrative_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tasks" ON public.administrative_tasks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Family can view linked seniors tasks" ON public.administrative_tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM family_links WHERE status = 'accepted' AND senior_id = administrative_tasks.user_id AND family_member_id = auth.uid()));

-- --- SECURE NOTES ---
CREATE TABLE public.secure_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.secure_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own notes" ON public.secure_notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- PHOTO ALBUMS ---
CREATE TABLE public.photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📷',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own albums" ON public.photo_albums FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- PHOTOS ---
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  album TEXT DEFAULT 'general',
  album_id UUID REFERENCES public.photo_albums(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own photos" ON public.photos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- CALL HISTORY ---
CREATE TABLE public.call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.family_contacts(id),
  contact_name TEXT,
  call_type TEXT DEFAULT 'outgoing',
  call_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration INTEGER DEFAULT 0
);
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own calls" ON public.call_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- GAME SESSIONS ---
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own games" ON public.game_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- PARTNER SERVICES (lecture publique) ---
CREATE TABLE public.partner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  affiliate_url TEXT NOT NULL,
  info_url TEXT,
  why_we_recommend TEXT NOT NULL,
  promo_code TEXT,
  promo_value TEXT,
  tags TEXT[] DEFAULT '{}',
  is_partner BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner services are readable by authenticated users" ON public.partner_services FOR SELECT
  USING (is_active = true);

-- --- SCAM ALERTS (lecture publique) ---
CREATE TABLE public.scam_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  danger_level TEXT NOT NULL,
  date_detected TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scam_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scam alerts are viewable by everyone" ON public.scam_alerts FOR SELECT
  USING (is_active = true);

-- --- SCAM CHECKS ---
CREATE TABLE public.scam_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_checked TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  explanation TEXT NOT NULL,
  red_flags TEXT[],
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scam_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scam checks" ON public.scam_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scam checks" ON public.scam_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scam checks" ON public.scam_checks FOR DELETE USING (auth.uid() = user_id);

-- --- SECURITY QUIZ SCORES ---
CREATE TABLE public.security_quiz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 5,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.security_quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz scores" ON public.security_quiz_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz scores" ON public.security_quiz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-création profil + rôle à l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Sync email
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- Timestamps automatiques
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_administrative_tasks_updated_at
  BEFORE UPDATE ON public.administrative_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secure_notes_updated_at
  BEFORE UPDATE ON public.secure_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_services_updated_at
  BEFORE UPDATE ON public.partner_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications automatiques
CREATE TRIGGER on_family_message_notify
  AFTER INSERT ON public.family_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_family_message();

CREATE TRIGGER on_mood_entry_notify
  AFTER INSERT ON public.mood_entries
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_on_mood();

CREATE TRIGGER on_medication_notify
  AFTER INSERT ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_on_medication();

-- =============================================
-- STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', true);

-- =============================================
-- REALTIME (optionnel, activer si besoin)
-- =============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.family_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.family_notifications;
