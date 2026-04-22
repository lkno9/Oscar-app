# Leçons apprises
<!-- Format : - [DATE] Leçon courte et actionnable -->

- [2026-04-22] La table `conversations` utilisée dans useMistralChat.ts est castée en `as any` car elle n'existe ni dans les migrations ni dans types.ts — créer la migration ou supprimer la persistance.
- [2026-04-22] La migration `20260308120000` référence `NEW.related_senior_id` alors que la colonne s'appelle `senior_id` — le trigger `dispatch_notification_email_sms` est cassé silencieusement.
- [2026-04-22] `remote_preferences` est ajouté par migration mais absent de types.ts — régénérer les types après chaque migration ALTER TABLE.
- [2026-04-22] `VITE_TAVUS_*` et `VITE_DEV_BYPASS_*` étaient dans .env mais jamais importés dans src/ — toujours vérifier qu'une var .env est réellement utilisée avant de la committer.
- [2026-04-22] `quiz_history.category` et `quiz_history.completed_at` existent en base mais manquent dans types.ts — les types sont désynchronisés.
- [2026-04-22] L'ordre des arguments de `has_role` est inversé entre la migration SQL (_user_id, _role) et types.ts (_role, _user_id) — ne pas appeler cette RPC sans vérifier.
- [2026-04-22] Un fichier dans public/ (oscar-db-schema.sql) exposait le schéma complet de la base — ne jamais mettre de fichiers sensibles dans public/.
- [2026-04-22] React.lazy() + Suspense réduit le bundle initial de façon drastique sur une app avec 40+ pages — toujours lazy-loader les routes dès le départ.
- [2026-04-22] Les noms `elevenLabsTTS.ts` / `elevenLabsSTT.ts` sont trompeurs : ces fichiers utilisent la Web Speech API du navigateur, pas ElevenLabs — nommer les fichiers d'après ce qu'ils font vraiment.
- [2026-04-22] `auth_pin` stocké en clair dans Supabase détecté par audit sécurité — toujours hasher les secrets avec bcrypt (pgcrypto) même pour des PINs courts, une fuite de la table profiles exposerait tout.
- [2026-04-22] Les agents de test UI (browser) ne sont pas fiables pour distinguer "redirect" vs "page crash + retour" — vérifier le code source avant de conclure à un bug de navigation.
- [2026-04-22] Lancer 6 agents haiku/sonnet en parallèle (2 browser, 2 code scan, 2 security) est le bon ratio — les agents haiku sont 6x moins chers pour le scan statique, réserver sonnet pour les interactions browser.
