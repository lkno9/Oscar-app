import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { CallsPage } from "./pages/services/CallsPage";
import { PhotosPage } from "./pages/services/PhotosPage";
import { HealthPage } from "./pages/services/HealthPage";
import { PrescriptionsPage } from "./pages/services/PrescriptionsPage";
import { WellnessPage } from "./pages/services/WellnessPage";
import { MusicPage } from "./pages/services/MusicPage";
import { LibraryPage } from "./pages/services/LibraryPage";
import { GamesPage } from "./pages/services/GamesPage";
import { VaultPage } from "./pages/services/VaultPage";
import { EmergencyPage } from "./pages/services/EmergencyPage";
import { HelpPage } from "./pages/services/HelpPage";
import { MemoryGame } from "./pages/services/games/MemoryGame";

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
            <Route path="/services/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/services/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/services/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/services/storage" element={<ProtectedRoute><StoragePage /></ProtectedRoute>} />
            <Route path="/services/family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />
            <Route path="/services/calls" element={<ProtectedRoute><CallsPage /></ProtectedRoute>} />
            <Route path="/services/photos" element={<ProtectedRoute><PhotosPage /></ProtectedRoute>} />
            <Route path="/services/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
            <Route path="/services/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
            <Route path="/services/wellness" element={<ProtectedRoute><WellnessPage /></ProtectedRoute>} />
            <Route path="/services/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
            <Route path="/services/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
            <Route path="/services/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
            <Route path="/services/games/memory" element={<ProtectedRoute><MemoryGame /></ProtectedRoute>} />
            <Route path="/services/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
            <Route path="/services/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
            <Route path="/services/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
