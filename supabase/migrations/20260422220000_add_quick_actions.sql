ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quick_actions text[] DEFAULT '{}';
