-- ============================================
-- OSCAR - Database Schema
-- Generated: 2026-02-10
-- ============================================

-- ===================
-- ENUMS
-- ===================
CREATE TYPE public.app_role AS ENUM ('senior', 'family_member');

-- ===================
-- PROFILES
-- ===================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  sms_notifications_enabled BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- USER ROLES
-- ===================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- FAMILY LINKS
-- ===================
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL,
  family_member_id UUID NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_code TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- FAMILY CONTACTS
-- ===================
CREATE TABLE public.family_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_emergency_contact BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- FAMILY MESSAGES
-- ===================
CREATE TABLE public.family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- FAMILY NOTIFICATIONS
-- ===================
CREATE TABLE public.family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  senior_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- MEDICATIONS
-- ===================
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date TEXT,
  end_date TEXT,
  is_active BOOLEAN DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- HEALTH RECORDS
-- ===================
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_date TEXT NOT NULL DEFAULT now(),
  value TEXT,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- DAILY WELLNESS
-- ===================
CREATE TABLE public.daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date TEXT NOT NULL DEFAULT now(),
  steps INTEGER,
  steps_goal INTEGER,
  activity_minutes INTEGER,
  activity_goal_minutes INTEGER,
  sleep_minutes INTEGER,
  sleep_goal_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- WELLNESS ACTIVITIES
-- ===================
CREATE TABLE public.wellness_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date TEXT NOT NULL DEFAULT now(),
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- MOOD ENTRIES
-- ===================
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_level INTEGER NOT NULL,
  entry_date TEXT NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- DOCUMENTS
-- ===================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  document_type TEXT,
  file_url TEXT,
  file_size TEXT,
  expiration_date TEXT,
  reminder_enabled BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- DOCUMENT REMINDERS
-- ===================
CREATE TABLE public.document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id),
  reminder_date TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- EVENTS
-- ===================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  event_time TEXT,
  event_type TEXT,
  reminder BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PAYMENTS
-- ===================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TEXT NOT NULL DEFAULT now(),
  payment_type TEXT,
  category TEXT,
  is_recurring BOOLEAN DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- ADMINISTRATIVE TASKS
-- ===================
CREATE TABLE public.administrative_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT NULL,
  template_id TEXT,
  steps JSONB,
  current_step INTEGER,
  due_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- SECURE NOTES
-- ===================
CREATE TABLE public.secure_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  is_pinned BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PHOTOS
-- ===================
CREATE TABLE public.photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  album TEXT,
  album_id UUID REFERENCES public.photo_albums(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- CALL HISTORY
-- ===================
CREATE TABLE public.call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.family_contacts(id),
  contact_name TEXT,
  call_type TEXT,
  call_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration INTEGER
);

-- ===================
-- GAME SESSIONS
-- ===================
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER,
  success BOOLEAN DEFAULT NULL,
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- PARTNER SERVICES (public read)
-- ===================
CREATE TABLE public.partner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🔗',
  affiliate_url TEXT NOT NULL,
  info_url TEXT,
  why_we_recommend TEXT NOT NULL,
  promo_code TEXT,
  promo_value TEXT,
  tags TEXT[],
  is_partner BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- SCAM ALERTS (public read)
-- ===================
CREATE TABLE public.scam_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  danger_level TEXT NOT NULL,
  date_detected TEXT NOT NULL DEFAULT now(),
  source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- SCAM CHECKS
-- ===================
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

-- ===================
-- SECURITY QUIZ SCORES
-- ===================
CREATE TABLE public.security_quiz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 5,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================
-- FUNCTIONS
-- ===================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
