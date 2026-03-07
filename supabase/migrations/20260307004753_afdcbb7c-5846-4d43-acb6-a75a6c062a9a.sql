
-- Create the rss_sources table
CREATE TABLE public.rss_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  source_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📰',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- Policy: everyone can read active sources
CREATE POLICY "Active RSS sources are readable by everyone"
  ON public.rss_sources
  FOR SELECT
  USING (is_active = true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_rss_sources_updated_at
  BEFORE UPDATE ON public.rss_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
