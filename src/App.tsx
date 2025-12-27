import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services/agenda" element={<AgendaPage />} />
          <Route path="/services/documents" element={<DocumentsPage />} />
          <Route path="/services/payments" element={<PaymentsPage />} />
          <Route path="/services/storage" element={<StoragePage />} />
          <Route path="/services/family" element={<FamilyPage />} />
          <Route path="/services/calls" element={<CallsPage />} />
          <Route path="/services/photos" element={<PhotosPage />} />
          <Route path="/services/health" element={<HealthPage />} />
          <Route path="/services/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/services/wellness" element={<WellnessPage />} />
          <Route path="/services/music" element={<MusicPage />} />
          <Route path="/services/library" element={<LibraryPage />} />
          <Route path="/services/games" element={<GamesPage />} />
          <Route path="/services/vault" element={<VaultPage />} />
          <Route path="/services/emergency" element={<EmergencyPage />} />
          <Route path="/services/help" element={<HelpPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
