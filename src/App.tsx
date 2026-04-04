import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { AgendaPage } from "./pages/services/AgendaPage";
import { DocumentsPage } from "./pages/services/DocumentsPage";
import { PaymentsPage } from "./pages/services/PaymentsPage";
import { StoragePage } from "./pages/services/StoragePage";
import { FamilyPage } from "./pages/services/FamilyPage";
import { PhotosPage } from "./pages/services/PhotosPage";
import { HealthPage } from "./pages/services/HealthPage";
import { PrescriptionsPage } from "./pages/services/PrescriptionsPage";
import { WellnessPage } from "./pages/services/WellnessPage";
import { LibraryPage } from "./pages/services/LibraryPage";
import { GamesPage } from "./pages/services/GamesPage";
import { VaultPage } from "./pages/services/VaultPage";
import { EmergencyPage } from "./pages/services/EmergencyPage";
import { HelpPage } from "./pages/services/HelpPage";
import { PartnersPage } from "./pages/services/PartnersPage";
import { ScamProtectionPage } from "./pages/services/ScamProtectionPage";
import { CommunicationPage } from "./pages/services/CommunicationPage";
import { MemoryGame } from "./pages/services/games/MemoryGame";
import { SudokuGame } from "./pages/services/games/SudokuGame";
import { QuizGame } from "./pages/services/games/QuizGame";
import { Game2048 } from "./pages/services/games/Game2048";
import { HangmanGame } from "./pages/services/games/HangmanGame";
import { MathGame } from "./pages/services/games/MathGame";
import { WordSearchGame } from "./pages/services/games/WordSearchGame";
import { TicTacToeGame } from "./pages/services/games/TicTacToeGame";
import { ColorsGame } from "./pages/services/games/ColorsGame";
import { SequenceGame } from "./pages/services/games/SequenceGame";
import { WordSearchGridGame } from "./pages/services/games/WordSearchGridGame";
import { CandyGame } from "./pages/services/games/CandyGame";
import { TicTacToeOnlineGame } from "./pages/services/games/TicTacToeOnlineGame";
import { QuizOnlineGame } from "./pages/services/games/QuizOnlineGame";
import { MemoryOnlineGame } from "./pages/services/games/MemoryOnlineGame";
import { WordDuelOnlineGame } from "./pages/services/games/WordDuelOnlineGame";
import { SettingsPage } from "./pages/SettingsPage";
import FamilyIndex from "./pages/family/FamilyIndex";
import SeniorDetailPage from "./pages/family/SeniorDetailPage";
import FamilyNotificationsPage from "./pages/family/FamilyNotificationsPage";
import FamilySettingsPage from "./pages/family/FamilySettingsPage";
import FamilyAccessPage from "./pages/settings/FamilyAccessPage";
import { SubPageLayout } from "./components/SubPageLayout";
import { OscarAcademyPage } from "./pages/services/OscarAcademyPage";
import { TransportPage } from "./pages/services/TransportPage";
import { EntertainmentPage } from "./pages/services/EntertainmentPage";
import { ToolsPage } from "./pages/services/ToolsPage";
import { KnowledgePage } from "./pages/services/KnowledgePage";
import { RadioPage } from "./pages/services/RadioPage";
import { RecipesPage } from "./pages/services/RecipesPage";
import { DailyQuizPage } from "./pages/DailyQuizPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DemarchesPage } from "./pages/DemarchesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/services/agenda" element={<ProtectedRoute><SubPageLayout><AgendaPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/documents" element={<ProtectedRoute><SubPageLayout><DocumentsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/payments" element={<ProtectedRoute><SubPageLayout><PaymentsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/storage" element={<ProtectedRoute><SubPageLayout><StoragePage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/family" element={<ProtectedRoute><SubPageLayout><FamilyPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/photos" element={<ProtectedRoute><SubPageLayout><PhotosPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/health" element={<ProtectedRoute><SubPageLayout><HealthPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/prescriptions" element={<ProtectedRoute><SubPageLayout><PrescriptionsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/wellness" element={<ProtectedRoute><SubPageLayout><WellnessPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/music" element={<Navigate to="/services/radio" replace />} />
            <Route path="/services/library" element={<ProtectedRoute><SubPageLayout><LibraryPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games" element={<ProtectedRoute><SubPageLayout><GamesPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/memory" element={<ProtectedRoute><SubPageLayout><MemoryGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/sudoku" element={<ProtectedRoute><SubPageLayout><SudokuGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/quiz" element={<ProtectedRoute><SubPageLayout><QuizGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/2048" element={<ProtectedRoute><SubPageLayout><Game2048 /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/hangman" element={<ProtectedRoute><SubPageLayout><HangmanGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/math" element={<ProtectedRoute><SubPageLayout><MathGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/intruder" element={<ProtectedRoute><SubPageLayout><WordSearchGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/tictactoe" element={<ProtectedRoute><SubPageLayout><TicTacToeGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/colors" element={<ProtectedRoute><SubPageLayout><ColorsGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/sequence" element={<ProtectedRoute><SubPageLayout><SequenceGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/wordsearch" element={<ProtectedRoute><SubPageLayout><WordSearchGridGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/candy" element={<ProtectedRoute><SubPageLayout><CandyGame /></SubPageLayout></ProtectedRoute>} />

            <Route path="/services/games/tictactoe-online" element={<ProtectedRoute><SubPageLayout><TicTacToeOnlineGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/quiz-online" element={<ProtectedRoute><SubPageLayout><QuizOnlineGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/memory-online" element={<ProtectedRoute><SubPageLayout><MemoryOnlineGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/games/word-duel-online" element={<ProtectedRoute><SubPageLayout><WordDuelOnlineGame /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/vault" element={<ProtectedRoute><SubPageLayout><VaultPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/emergency" element={<ProtectedRoute><SubPageLayout><EmergencyPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/help" element={<ProtectedRoute><SubPageLayout><HelpPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/partners" element={<ProtectedRoute><SubPageLayout><PartnersPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/scam-protection" element={<ProtectedRoute><SubPageLayout><ScamProtectionPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/communication" element={<ProtectedRoute><SubPageLayout><CommunicationPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/oscar-academy" element={<ProtectedRoute><SubPageLayout><OscarAcademyPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/transport" element={<ProtectedRoute><SubPageLayout><TransportPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/entertainment" element={<ProtectedRoute><SubPageLayout><EntertainmentPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/tools" element={<ProtectedRoute><SubPageLayout><ToolsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/demarches" element={<ProtectedRoute><SubPageLayout><DemarchesPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/knowledge" element={<ProtectedRoute><SubPageLayout><KnowledgePage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/radio" element={<ProtectedRoute><SubPageLayout><RadioPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services/recipes" element={<ProtectedRoute><SubPageLayout><RecipesPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/daily-quiz" element={<ProtectedRoute><DailyQuizPage /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SubPageLayout><SettingsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/settings/family-access" element={<ProtectedRoute><SubPageLayout><FamilyAccessPage /></SubPageLayout></ProtectedRoute>} />
            {/* Family Interface Routes */}
            <Route path="/family" element={<ProtectedRoute><FamilyIndex /></ProtectedRoute>} />
            <Route path="/family/senior/:seniorId" element={<ProtectedRoute><SubPageLayout><SeniorDetailPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/family/notifications" element={<ProtectedRoute><SubPageLayout><FamilyNotificationsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/family/settings" element={<ProtectedRoute><SubPageLayout><FamilySettingsPage /></SubPageLayout></ProtectedRoute>} />
            <Route path="/services" element={<Navigate to="/" state={{ tab: "services" }} replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
