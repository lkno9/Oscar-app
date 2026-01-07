-- Table pour les partenaires/bons plans (initialement vide, à remplir au fur et à mesure)
CREATE TABLE public.partner_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sante', 'logement', 'aide', 'transport', 'loisirs', 'finances')),
  description TEXT NOT NULL,
  why_we_recommend TEXT NOT NULL,
  promo_code TEXT,
  promo_value TEXT,
  affiliate_url TEXT NOT NULL,
  info_url TEXT,
  icon TEXT NOT NULL DEFAULT '⭐',
  tags TEXT[] DEFAULT '{}',
  is_partner BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour lecture publique (les partenaires sont visibles par tous)
ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner services are readable by authenticated users"
ON public.partner_services
FOR SELECT
TO authenticated
USING (is_active = true);

-- Index pour la recherche par catégorie
CREATE INDEX idx_partner_services_category ON public.partner_services(category);

-- Trigger pour updated_at
CREATE TRIGGER update_partner_services_updated_at
BEFORE UPDATE ON public.partner_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();