-- Table pour stocker les sources RSS configurables
-- Les admins peuvent ajouter/modifier/supprimer des sources sans toucher au code
CREATE TABLE IF NOT EXISTS public.rss_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  source_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📰',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permettre la lecture publique (les sources RSS ne sont pas des données sensibles)
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire les sources RSS actives"
  ON public.rss_sources
  FOR SELECT
  USING (is_active = true);

-- Insérer les sources par défaut
INSERT INTO public.rss_sources (url, category, source_name, emoji, is_active, display_order) VALUES
  -- Droits & Retraite
  ('https://www.capretraite.fr/feed/', 'Droits', 'Cap Retraite', '📋', true, 1),
  ('https://www.pour-les-personnes-agees.gouv.fr/rss.xml', 'Droits', 'Pour les personnes âgées', '🏛️', true, 2),
  -- Santé
  ('https://www.senioractu.com/xml/syndication.rss', 'Santé', 'Senior Actu', '🏥', true, 3),
  ('https://www.santemagazine.fr/feeds/rss', 'Santé', 'Santé Magazine', '💊', true, 4),
  -- Loisirs
  ('https://www.notretemps.com/feed', 'Loisirs', 'Notre Temps', '🎭', true, 5),
  ('https://www.pleinevie.fr/feed', 'Loisirs', 'Pleine Vie', '🌸', true, 6),
  -- Sécurité
  ('https://www.60millions-mag.com/feed', 'Sécurité', '60 Millions', '🛡️', true, 7),
  ('https://www.cybermalveillance.gouv.fr/feed', 'Sécurité', 'Cybermalveillance', '🔒', true, 8),
  -- Actualité
  ('https://www.francetvinfo.fr/economie.rss', 'Actualité', 'France Info', '📰', true, 9),
  ('https://www.silvereco.fr/feed', 'Actualité', 'Silver Eco', '🏠', true, 10),
  -- Bien-être
  ('https://www.psychologies.com/feed', 'Bien-être', 'Psychologies', '🧘', true, 11),
  ('https://www.femmeactuelle.fr/sante/feed', 'Bien-être', 'Femme Actuelle Santé', '🌿', true, 12);
