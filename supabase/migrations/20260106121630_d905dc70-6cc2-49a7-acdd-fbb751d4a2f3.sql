-- Table des alertes arnaques (données statiques/administrateur)
CREATE TABLE public.scam_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  danger_level TEXT NOT NULL CHECK (danger_level IN ('low', 'medium', 'high')),
  date_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des vérifications utilisateur
CREATE TABLE public.scam_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_checked TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'suspicious', 'dangerous')),
  explanation TEXT NOT NULL,
  red_flags TEXT[],
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des scores quiz sécurité
CREATE TABLE public.security_quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 5,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scam_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_quiz_scores ENABLE ROW LEVEL SECURITY;

-- Policies for scam_alerts (public read, admin write)
CREATE POLICY "Scam alerts are viewable by everyone" 
ON public.scam_alerts 
FOR SELECT 
USING (is_active = true);

-- Policies for scam_checks (user-specific)
CREATE POLICY "Users can view their own scam checks" 
ON public.scam_checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scam checks" 
ON public.scam_checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scam checks" 
ON public.scam_checks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for security_quiz_scores (user-specific)
CREATE POLICY "Users can view their own quiz scores" 
ON public.security_quiz_scores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz scores" 
ON public.security_quiz_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert initial scam alerts data (arnaques courantes 2024-2025)
INSERT INTO public.scam_alerts (title, description, category, danger_level, source) VALUES
('SMS Carte Vitale expirée', 'Faux SMS prétendant que votre carte vitale arrive à expiration et vous demandant de mettre à jour vos informations via un lien. Ameli ne demande jamais cela par SMS.', 'sms', 'high', 'Signal-Arnaques'),
('Appels CPF frauduleux', 'Appels téléphoniques insistants vous proposant d''utiliser votre Compte Personnel de Formation. Les vrais organismes ne démarchent jamais par téléphone.', 'telephone', 'high', 'DGCCRF'),
('Faux colis Colissimo/Chronopost', 'SMS indiquant qu''un colis vous attend et demandant de payer des frais de livraison via un lien. La Poste ne demande jamais de paiement par SMS.', 'sms', 'high', 'Cybermalveillance.gouv.fr'),
('Faux remboursement des impôts', 'Email prétendant que vous avez droit à un remboursement d''impôts. Le site des impôts ne demande jamais vos coordonnées bancaires par email.', 'email', 'high', 'DGFiP'),
('Activité suspecte sur votre compte bancaire', 'SMS ou email de votre "banque" signalant une activité suspecte. Votre banque ne vous demandera jamais vos identifiants par ces moyens.', 'sms', 'high', 'Banque de France'),
('Arnaque au faux conseiller bancaire', 'Un faux conseiller vous appelle en prétendant que votre compte est piraté et vous demande vos codes. Ne donnez jamais vos codes par téléphone.', 'telephone', 'high', 'UFC-Que Choisir'),
('Renouvellement Netflix/Amazon Prime', 'Email vous demandant de renouveler votre abonnement via un lien. Vérifiez toujours sur l''application officielle.', 'email', 'medium', 'Signal-Arnaques'),
('Arnaque sentimentale en ligne', 'Personne rencontrée sur internet qui finit par demander de l''argent pour une urgence. Ne jamais envoyer d''argent à quelqu''un que vous n''avez pas rencontré.', 'social', 'high', 'Police Nationale'),
('Faux support technique Microsoft', 'Pop-up ou appel prétendant que votre ordinateur est infecté. Microsoft ne vous contacte jamais de cette façon.', 'telephone', 'high', 'Microsoft'),
('Arnaque à la loterie', 'Email ou SMS vous annonçant que vous avez gagné à une loterie à laquelle vous n''avez pas participé. Il n''existe pas de loterie gratuite.', 'email', 'medium', 'DGCCRF');