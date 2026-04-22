# TODO

## En cours

## À faire

### Sécurité
- [ ] Déplacer les appels Tavus vers une Edge Function (clé côté serveur uniquement)

### Backend / Supabase
- [ ] Corriger le trigger `dispatch_notification_email_sms` : remplacer `NEW.related_senior_id` par `NEW.senior_id`
- [ ] Régénérer types.ts via `supabase gen types typescript` (remote_preferences, quiz_history.category/completed_at manquants)
- [ ] Garantir insertion du rôle `senior` lors du parcours voice OTP (actuellement non garanti)

### Performance / Qualité
- [ ] Centraliser la logique STT/TTS (dupliquée dans CallScreen.tsx, HomePage.tsx, hooks, lib)
- [ ] Corriger les dépendances manquantes dans useCallback de useMistralChat.ts
- [ ] Fusionner `verifyMFA` et `verifyMFAChallenge` dans useAuth.tsx (identiques)

### Accessibilité (a11y)
- [ ] Passer toutes les tailles de police en `rem` (plus de `fontSize: 13` hardcodé)
- [ ] Ajouter `aria-live="polite"` sur le chat Oscar (réponses non annoncées aux screen readers)
- [ ] Ajouter `aria-pressed` sur les boutons de sélection (onboarding, jeux)
- [ ] Ajouter `role="progressbar"` sur la barre de progression onboarding
- [ ] Ajouter dialog de confirmation avant "Appeler le 15" (touch accidentel)

### Monitoring
- [ ] Intégrer Sentry (VITE_SENTRY_DSN dans .env, init dans main.tsx)

### PWA
- [ ] Ajouter manifest.json + vite-plugin-pwa + cache offline pour EmergencyPage

### Pages famille (à décider : activer ou supprimer ?)
- [ ] FamilyChatPage.tsx — aucune route dans App.tsx
- [ ] FamilyDashboard.tsx — aucune route dans App.tsx
- [ ] FamilyMessagesPage.tsx — aucune route dans App.tsx

### Jeux sans route (à décider : activer ou supprimer ?)
- [ ] MemoryDuoGame.tsx, QuizDuoGame.tsx, TicTacToeDuoGame.tsx, WordDuelGame.tsx

## Terminé
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
