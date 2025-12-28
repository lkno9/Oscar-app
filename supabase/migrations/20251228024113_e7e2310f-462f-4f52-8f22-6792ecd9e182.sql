-- Table pour les entrées d'humeur quotidienne
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_level INTEGER NOT NULL CHECK (mood_level BETWEEN 1 AND 5),
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les statistiques quotidiennes de bien-être
CREATE TABLE public.daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  sleep_minutes INTEGER DEFAULT 0,
  activity_minutes INTEGER DEFAULT 0,
  steps_goal INTEGER DEFAULT 6000,
  sleep_goal_minutes INTEGER DEFAULT 480,
  activity_goal_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Table pour les sessions de jeux
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT false,
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les albums photos
CREATE TABLE public.photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📷',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter album_id à la table photos existante
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.photo_albums(id) ON DELETE SET NULL;

-- RLS pour toutes les nouvelles tables
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users CRUD own mood" ON public.mood_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own wellness" ON public.daily_wellness FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own games" ON public.game_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own albums" ON public.photo_albums FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);