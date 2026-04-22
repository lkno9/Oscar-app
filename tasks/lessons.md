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
- [2026-04-22] Quand on ajoute une colonne via migration, mettre à jour types.ts manuellement en attendant la régénération — sinon les `as any` se propagent dans tout le code.
- [2026-04-22] Pour supprimer un `as any` sur `.from("table")`, vérifier d'abord que la table existe dans types.ts — souvent elle y est déjà et le cast est inutile.
- [2026-04-22] Sur mobile seniors, 10px est totalement illisible — minimum absolu 12px (text-xs Tailwind), préférer 14-16px pour les labels d'onglets même si ça force des textes courts.
- [2026-04-22] En situation d'urgence, text-muted-foreground sur les descriptions d'action est un bug d'accessibilité critique — utiliser text-foreground ou text-foreground/70 sur tout contenu actionnable.
- [2026-04-22] Toujours chercher toutes les occurrences de `fontSize: 1[34]` dans un fichier avant de valider les corrections de taille — les instructions de ligne exacte peuvent être décalées et des cas supplémentaires existent.
- [2026-04-23] Pour un upsert Supabase sur contrainte composite, passer `onConflict: 'col1,col2'` (virgule sans espace, noms de colonnes) — pas le nom de la contrainte PostgreSQL.
- [2026-04-23] Un trigger avec `EXCEPTION WHEN OTHERS` avale silencieusement les erreurs de noms de colonnes — vérifier les colonnes via information_schema avant toute correction de trigger.
- [2026-04-23] Voxtral TTS (Mistral) bat ElevenLabs Flash v2.5 en qualité voix française selon benchmarks 2025 — pas besoin d'ajouter ElevenLabs, l'app a déjà le meilleur.
- [2026-04-23] Le bouton téléphone d'Oscar ouvre CallScreen : voix ↔ voix + caméra utilisateur → pixtral (Oscar "voit"). L'avatar vidéo Oscar n'existe pas encore (Tavus/HeyGen à faire si voulu).
- [2026-04-23] Vonage Verify fait de l'auth silencieuse (pas de SMS à lire) — meilleur pour seniors que Twilio OTP classique. 40% moins cher sur numéros FR.
- [2026-04-23] Brevo (français, RGPD natif) est préférable à Resend pour une app avec données seniors — hébergement EU garanti.
