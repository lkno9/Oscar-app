import { Suspense, lazy, Component, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubPageLayout } from "./components/SubPageLayout";

// ─── Chargement immédiat (chemin critique) ────────────────────────────────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";

// ─── Chargement différé (lazy) ────────────────────────────────────────────────
// Pages principales
const OnboardingPage      = lazy(() => import("./pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const SettingsPage        = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const DailyQuizPage       = lazy(() => import("./pages/DailyQuizPage").then(m => ({ default: m.DailyQuizPage })));
const DemarchesPage       = lazy(() => import("./pages/DemarchesPage").then(m => ({ default: m.DemarchesPage })));

// Services
const AgendaPage          = lazy(() => import("./pages/services/AgendaPage").then(m => ({ default: m.AgendaPage })));
const DocumentsPage       = lazy(() => import("./pages/services/DocumentsPage").then(m => ({ default: m.DocumentsPage })));
const PaymentsPage        = lazy(() => import("./pages/services/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const StoragePage         = lazy(() => import("./pages/services/StoragePage").then(m => ({ default: m.StoragePage })));
const FamilyPage          = lazy(() => import("./pages/services/FamilyPage").then(m => ({ default: m.FamilyPage })));
const PhotosPage          = lazy(() => import("./pages/services/PhotosPage").then(m => ({ default: m.PhotosPage })));
const HealthPage          = lazy(() => import("./pages/services/HealthPage").then(m => ({ default: m.HealthPage })));
const PrescriptionsPage   = lazy(() => import("./pages/services/PrescriptionsPage").then(m => ({ default: m.PrescriptionsPage })));
const WellnessPage        = lazy(() => import("./pages/services/WellnessPage").then(m => ({ default: m.WellnessPage })));
const LibraryPage         = lazy(() => import("./pages/services/LibraryPage").then(m => ({ default: m.LibraryPage })));
const GamesPage           = lazy(() => import("./pages/services/GamesPage").then(m => ({ default: m.GamesPage })));
const VaultPage           = lazy(() => import("./pages/services/VaultPage").then(m => ({ default: m.VaultPage })));
const EmergencyPage       = lazy(() => import("./pages/services/EmergencyPage").then(m => ({ default: m.EmergencyPage })));
const HelpPage            = lazy(() => import("./pages/services/HelpPage").then(m => ({ default: m.HelpPage })));
const PartnersPage        = lazy(() => import("./pages/services/PartnersPage").then(m => ({ default: m.PartnersPage })));
const MyPartnerPage       = lazy(() => import("./pages/services/MyPartnerPage").then(m => ({ default: m.MyPartnerPage })));
const ScamProtectionPage  = lazy(() => import("./pages/services/ScamProtectionPage").then(m => ({ default: m.ScamProtectionPage })));
const CommunicationPage   = lazy(() => import("./pages/services/CommunicationPage").then(m => ({ default: m.CommunicationPage })));
const TransportPage       = lazy(() => import("./pages/services/TransportPage").then(m => ({ default: m.TransportPage })));
const EntertainmentPage   = lazy(() => import("./pages/services/EntertainmentPage").then(m => ({ default: m.EntertainmentPage })));
const ToolsPage           = lazy(() => import("./pages/services/ToolsPage").then(m => ({ default: m.ToolsPage })));
const KnowledgePage       = lazy(() => import("./pages/services/KnowledgePage").then(m => ({ default: m.KnowledgePage })));
const RadioPage           = lazy(() => import("./pages/services/RadioPage").then(m => ({ default: m.RadioPage })));
const RecipesPage         = lazy(() => import("./pages/services/RecipesPage").then(m => ({ default: m.RecipesPage })));

// Jeux (chunk séparé — lourds)
const MemoryGame          = lazy(() => import("./pages/services/games/MemoryGame").then(m => ({ default: m.MemoryGame })));
const SudokuGame          = lazy(() => import("./pages/services/games/SudokuGame").then(m => ({ default: m.SudokuGame })));
const QuizGame            = lazy(() => import("./pages/services/games/QuizGame").then(m => ({ default: m.QuizGame })));
const Game2048            = lazy(() => import("./pages/services/games/Game2048").then(m => ({ default: m.Game2048 })));
const HangmanGame         = lazy(() => import("./pages/services/games/HangmanGame").then(m => ({ default: m.HangmanGame })));
const MathGame            = lazy(() => import("./pages/services/games/MathGame").then(m => ({ default: m.MathGame })));
const WordSearchGame      = lazy(() => import("./pages/services/games/WordSearchGame").then(m => ({ default: m.WordSearchGame })));
const TicTacToeGame       = lazy(() => import("./pages/services/games/TicTacToeGame").then(m => ({ default: m.TicTacToeGame })));
const ColorsGame          = lazy(() => import("./pages/services/games/ColorsGame").then(m => ({ default: m.ColorsGame })));
const SequenceGame        = lazy(() => import("./pages/services/games/SequenceGame").then(m => ({ default: m.SequenceGame })));
const WordSearchGridGame   = lazy(() => import("./pages/services/games/WordSearchGridGame").then(m => ({ default: m.WordSearchGridGame })));
const CandyGame           = lazy(() => import("./pages/services/games/CandyGame").then(m => ({ default: m.CandyGame })));
const TicTacToeOnlineGame = lazy(() => import("./pages/services/games/TicTacToeOnlineGame").then(m => ({ default: m.TicTacToeOnlineGame })));
const QuizOnlineGame      = lazy(() => import("./pages/services/games/QuizOnlineGame").then(m => ({ default: m.QuizOnlineGame })));
const MemoryOnlineGame    = lazy(() => import("./pages/services/games/MemoryOnlineGame").then(m => ({ default: m.MemoryOnlineGame })));
const WordDuelOnlineGame  = lazy(() => import("./pages/services/games/WordDuelOnlineGame").then(m => ({ default: m.WordDuelOnlineGame })));

// Famille
const FamilyIndex              = lazy(() => import("./pages/family/FamilyIndex"));
const SeniorDetailPage         = lazy(() => import("./pages/family/SeniorDetailPage"));
const FamilyNotificationsPage  = lazy(() => import("./pages/family/FamilyNotificationsPage"));
const FamilySettingsPage       = lazy(() => import("./pages/family/FamilySettingsPage"));

// Paramètres
const FamilyAccessPage = lazy(() => import("./pages/settings/FamilyAccessPage"));

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-4xl">😕</p>
          <p className="text-xl font-semibold">Une erreur s'est produite</p>
          <p className="text-muted-foreground">Rechargez la page ou revenez en arrière.</p>
          <button
            className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
          >
            Retour
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Fallback de chargement ───────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Protected = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const ProtectedSub = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute><SubPageLayout>{children}</SubPageLayout></ProtectedRoute>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Chemin critique — chargé immédiatement */}
                <Route path="/" element={<Protected><Index /></Protected>} />

                {/* Pages principales */}
                <Route path="/onboarding"             element={<Protected><OnboardingPage /></Protected>} />
                <Route path="/daily-quiz"             element={<Protected><DailyQuizPage /></Protected>} />
                <Route path="/settings"               element={<ProtectedSub><SettingsPage /></ProtectedSub>} />
                <Route path="/settings/family-access" element={<ProtectedSub><FamilyAccessPage /></ProtectedSub>} />

                {/* Services */}
                <Route path="/services/agenda"         element={<ProtectedSub><AgendaPage /></ProtectedSub>} />
                <Route path="/services/documents"      element={<ProtectedSub><DocumentsPage /></ProtectedSub>} />
                <Route path="/services/payments"       element={<ProtectedSub><PaymentsPage /></ProtectedSub>} />
                <Route path="/services/storage"        element={<ProtectedSub><StoragePage /></ProtectedSub>} />
                <Route path="/services/family"         element={<ProtectedSub><FamilyPage /></ProtectedSub>} />
                <Route path="/services/photos"         element={<ProtectedSub><PhotosPage /></ProtectedSub>} />
                <Route path="/services/health"         element={<ProtectedSub><HealthPage /></ProtectedSub>} />
                <Route path="/services/prescriptions"  element={<ProtectedSub><PrescriptionsPage /></ProtectedSub>} />
                <Route path="/services/wellness"       element={<ProtectedSub><WellnessPage /></ProtectedSub>} />
                <Route path="/services/library"        element={<ProtectedSub><LibraryPage /></ProtectedSub>} />
                <Route path="/services/games"          element={<ProtectedSub><GamesPage /></ProtectedSub>} />
                <Route path="/services/vault"          element={<ProtectedSub><VaultPage /></ProtectedSub>} />
                <Route path="/services/emergency"      element={<ProtectedSub><EmergencyPage /></ProtectedSub>} />
                <Route path="/services/help"           element={<ProtectedSub><HelpPage /></ProtectedSub>} />
                <Route path="/services/partners"       element={<ProtectedSub><PartnersPage /></ProtectedSub>} />
                <Route path="/services/partner"        element={<ProtectedSub><MyPartnerPage /></ProtectedSub>} />
                <Route path="/services/scam-protection" element={<ProtectedSub><ScamProtectionPage /></ProtectedSub>} />
                <Route path="/services/communication"  element={<ProtectedSub><CommunicationPage /></ProtectedSub>} />
                <Route path="/services/transport"      element={<ProtectedSub><TransportPage /></ProtectedSub>} />
                <Route path="/services/entertainment"  element={<ProtectedSub><EntertainmentPage /></ProtectedSub>} />
                <Route path="/services/tools"          element={<ProtectedSub><ToolsPage /></ProtectedSub>} />
                <Route path="/services/demarches"      element={<ProtectedSub><DemarchesPage /></ProtectedSub>} />
                <Route path="/services/knowledge"      element={<ProtectedSub><KnowledgePage /></ProtectedSub>} />
                <Route path="/services/radio"          element={<ProtectedSub><RadioPage /></ProtectedSub>} />
                <Route path="/services/recipes"        element={<ProtectedSub><RecipesPage /></ProtectedSub>} />
                <Route path="/services/music"          element={<Navigate to="/services/radio" replace />} />
                <Route path="/services"                element={<Navigate to="/" state={{ tab: "services" }} replace />} />

                {/* Jeux */}
                <Route path="/services/games/memory"        element={<ProtectedSub><MemoryGame /></ProtectedSub>} />
                <Route path="/services/games/sudoku"        element={<ProtectedSub><SudokuGame /></ProtectedSub>} />
                <Route path="/services/games/quiz"          element={<ProtectedSub><QuizGame /></ProtectedSub>} />
                <Route path="/services/games/2048"          element={<ProtectedSub><Game2048 /></ProtectedSub>} />
                <Route path="/services/games/hangman"       element={<ProtectedSub><HangmanGame /></ProtectedSub>} />
                <Route path="/services/games/math"          element={<ProtectedSub><MathGame /></ProtectedSub>} />
                <Route path="/services/games/intruder"      element={<ProtectedSub><WordSearchGame /></ProtectedSub>} />
                <Route path="/services/games/tictactoe"     element={<ProtectedSub><TicTacToeGame /></ProtectedSub>} />
                <Route path="/services/games/colors"        element={<ProtectedSub><ColorsGame /></ProtectedSub>} />
                <Route path="/services/games/sequence"      element={<ProtectedSub><SequenceGame /></ProtectedSub>} />
                <Route path="/services/games/wordsearch"    element={<ProtectedSub><WordSearchGridGame /></ProtectedSub>} />
                <Route path="/services/games/candy"         element={<ProtectedSub><CandyGame /></ProtectedSub>} />
                <Route path="/services/games/tictactoe-online" element={<ProtectedSub><TicTacToeOnlineGame /></ProtectedSub>} />
                <Route path="/services/games/quiz-online"   element={<ProtectedSub><QuizOnlineGame /></ProtectedSub>} />
                <Route path="/services/games/memory-online" element={<ProtectedSub><MemoryOnlineGame /></ProtectedSub>} />
                <Route path="/services/games/word-duel-online" element={<ProtectedSub><WordDuelOnlineGame /></ProtectedSub>} />

                {/* Famille */}
                <Route path="/family"                        element={<Protected><FamilyIndex /></Protected>} />
                <Route path="/family/senior/:seniorId"       element={<ProtectedSub><SeniorDetailPage /></ProtectedSub>} />
                <Route path="/family/notifications"          element={<ProtectedSub><FamilyNotificationsPage /></ProtectedSub>} />
                <Route path="/family/settings"               element={<ProtectedSub><FamilySettingsPage /></ProtectedSub>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
