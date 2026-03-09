-- Ajouter un code PIN 4 chiffres pour l'authentification senior
-- Ce PIN est fourni au senior lors de la souscription et sert de 2e facteur d'identité

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_pin text;

-- Commentaire pour documenter l'usage
COMMENT ON COLUMN public.profiles.auth_pin IS 'Code PIN 4 chiffres fourni au senior à la souscription, utilisé comme 2e facteur lors de la connexion par téléphone';
