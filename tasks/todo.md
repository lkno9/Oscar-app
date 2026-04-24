# TODO

## En cours

## À faire

### Comptes API à basculer (compte de ton pote → tes comptes)
- [ ] **Twilio** → créer compte + remplacer TWILIO_* dans Supabase Secrets (OTP vocal + SMS famille)
- [ ] **Resend** → créer compte Brevo (RGPD FR) + remplacer RESEND_API_KEY dans Supabase Secrets
- [ ] **TMDB** → créer compte gratuit sur themoviedb.org + remplacer TMDB_API_KEY
- [ ] **Sentry** → créer compte + mettre VITE_SENTRY_DSN dans .env Vercel
- [x] **analyze-scam MISTRAL_API_KEY** → déjà présente dans Supabase Secrets (partagée avec mistral-chat qui fonctionnait)

### Sécurité — OWASP HIGH (avant mise en prod réelle)
- [x] **mistral-chat : vérification JWT** — getUser() en début de handler, 401 si token absent/invalide — déployé v3 (2026-04-24)
- [x] **CORS `*` → domaine restreint** — toutes les Edge Functions : getCorsHeaders(req) whitelist 3 origines + Vary: Origin (2026-04-24)
- [x] **Credentials démo hors code source** — import.meta.env.VITE_DEMO_EMAIL/PASSWORD avec fallback (2026-04-24)
- [x] **OTP en clair en base** — SHA-256 stocké dans voice_otps.otp_code, comparaison hashée dans verify-voice-otp (2026-04-24)

### TTS Voxtral — action requise avant déploiement
- [ ] **Créer une voix Mistral** via `POST https://api.mistral.ai/v1/audio/voices` avec un échantillon audio Oscar → récupérer le `voice_id`
- [ ] **Ajouter `MISTRAL_VOICE_ID`** dans Supabase Secrets (mnkumsmqdmqlpczxabfo)
- [ ] **Redéployer `elevenlabs-tts`** après ajout du secret (code Voxtral prêt en local, version prod encore ancienne)

### Sécurité — divers
- [ ] Tavus : variables VITE_TAVUS_* commentées dans .env — décider activer (HeyGen $29/mois) ou supprimer définitivement
- [ ] Renommer `verifyMFA` → `verifyMFAEnrollment` dans useAuth.tsx (sémantique, pas une duplication)

### Features à venir
- [ ] Avatar vidéo Oscar : HeyGen API pour visage qui parle pendant les appels (optionnel, $29/mois)

### Performance / Qualité (refactoring non urgent)
- [ ] Centraliser la logique STT/TTS (dupliquée dans CallScreen.tsx, HomePage.tsx, hooks, lib)
- [ ] Corriger les dépendances manquantes dans useCallback de useMistralChat.ts (sendMessage manque persistConversation + seniorContext)
- [ ] Corriger useCallback dep dans HomePage.tsx (handleSend manque sendToMistral)
- [ ] Ajouter response.ok check sur les 3 fetch Nominatim dans ToolsPage.tsx
- [ ] Supprimer les 4 jeux sans route : MemoryDuoGame.tsx, QuizDuoGame.tsx, TicTacToeDuoGame.tsx, WordDuelGame.tsx (code mort confirmé)
- [ ] html2canvas (201KB) — évaluer si utilisé ou supprimer du bundle
- [ ] Livekit (50KB+) — vérifier s'il reste des imports ou supprimer

### Monitoring
- [ ] Intégrer Sentry (VITE_SENTRY_DSN dans .env, init dans main.tsx)

### Pages famille (résolu — aucune action nécessaire)
- ✅ FamilyChatPage.tsx — onglet "Oscar" dans FamilyIndex (route /family)
- ✅ FamilyDashboard.tsx — onglet "Accueil" dans FamilyIndex (route /family)
- ✅ FamilyMessagesPage.tsx — onglet "Messages" dans FamilyIndex (route /family)

## Terminé
- [2026-04-24] ✅ Chat Oscar 401 JWT corrigé : useMistralChat.ts utilise désormais getSession() frais + Bearer user JWT (était la clé anon)
- [2026-04-24] ✅ Settings profil bouton corrigé : div → button couvrant toute la rangée
- [2026-04-24] ✅ /services/news 404 — faux positif : les actualités sont sur /services/knowledge (KnowledgePage)
- [2026-04-24] ✅ OWASP HIGH — 4 fixes déployés : JWT mistral-chat v3, CORS whitelist toutes Edge Functions, creds démo via env, OTP SHA-256
- [2026-04-23] ✅ PWA implémentée : vite-plugin-pwa + manifest.json + SW workbox + cache offline /services/emergency (7j CacheFirst) + icônes Oscar SVG 192/512
- [2026-04-23] ✅ analyze-scam migré Lovable/Gemini → Mistral direct (mistral-large-latest) — déployé v3 (attendre MISTRAL_API_KEY dans Supabase Secrets)
- [2026-04-23] ✅ A11y OnboardingPage : aria-pressed sur 3 groupes de boutons (intérêts, tech level, créneaux) + role="progressbar" aria-valuenow/min/max sur la barre de progression
- [2026-04-23] ✅ A11y EmergencyPage : AlertDialog de confirmation avant "Appeler le 15" (protection touch accidentel)
- [2026-04-23] ✅ types.ts synchronisé : quiz_history (category + completed_at), profiles (remote_preferences jsonb)
- [2026-04-23] ✅ Family pages confirmées fonctionnelles (tabs dans FamilyIndex, route /family) — aucune modification nécessaire
- [2026-04-22] ✅ auth_pin hashé bcrypt (pgcrypto) — migration + RPC check_user_pin + redéploiement verify-voice-otp
- [2026-04-22] ✅ Migration otp_security appliquée sur Supabase cloud (mnkumsmqdmqlpczxabfo)
- [2026-04-22] ✅ Déploiement Vercel réussi (https://oscar-ia-mvp.vercel.app) sous OscarIA-Admin
- [2026-04-22] ✅ Bouton démo "Tester Oscar sans compte" fonctionnel (demo@oscar-ia.app)
- [2026-04-22] ✅ Chat Oscar opérationnel (<2s, widget météo, streaming SSE)
- [2026-04-22] ✅ Bypass auth DEV (ProtectedRoute + bouton Fouquet direct sans Supabase)
- [2026-04-22] ✅ Supprimé oscar-db-schema.sql du dossier public/ (schéma exposé publiquement)
- [2026-04-22] ✅ console.log du hashed_token conditionné à DEV uniquement
- [2026-04-22] ✅ Lazy loading sur toutes les routes App.tsx + ErrorBoundary + PageLoader
- [2026-04-22] ✅ Nettoyage code mort : DemoPreview, CallsPage, MusicPage, oscarChat.ts, VideoCallOscar.tsx
- [2026-04-22] ✅ Nettoyage .env : supprimé variables orphelines, Tavus/LiveKit/bypass commentés
- [2026-04-22] ✅ Supprimé Toaster Radix doublon dans App.tsx (gardé Sonner uniquement)
- [2026-04-22] ✅ Sentry intégré (main.tsx + ErrorBoundary, prod uniquement, VITE_SENTRY_DSN à remplir)
- [2026-04-22] ✅ Math.random() → crypto.getRandomValues() dans send-voice-otp
- [2026-04-22] ✅ Rate limiting send-voice-otp (max 3/10min, table otp_rate_limits)
- [2026-04-22] ✅ Protection brute-force PIN dans verify-voice-otp (max 5 tentatives, puis OTP invalidé)
- [2026-04-22] ✅ Migration 20260422100000_otp_security.sql créée (à appliquer sur Supabase cloud)
- [2026-04-22] ✅ Colonne quick_actions ajoutée à profiles (migration + types.ts + RecapPage sans as any)
- [2026-04-22] ✅ as any supprimés pour medications et events dans useSeniorContext.ts (tables présentes dans types.ts)
- [2026-04-22] ✅ useDocuments et useAdminTasks migrés vers sonner (suppression useToast Radix)
- [2026-04-22] ✅ Table `conversations` créée (migration + RLS + types.ts + suppression des `as any` dans useMistralChat.ts)
- [2026-04-22] ✅ A11y : PhotosPage boutons p-2→p-3 + aria-label ; OnboardingPage fontSize 13/14→16 (8 occurrences) ; HomePage aria-live sur chat ; ChatMessage padding TTS 4→8
- [2026-04-23] ✅ Trigger `dispatch_notification_email_sms` corrigé : NEW.related_senior_id → NEW.senior_id (migration 20260423010000 appliquée)
- [2026-04-23] ✅ Rôle `senior` garanti après voice OTP : upsert sur user_roles (user_id,role) ajouté en step 5b de verify-voice-otp v4
- [2026-04-23] ✅ types.ts synchronisé manuellement : quiz_history (category + completed_at), profiles (remote_preferences) ajoutés
