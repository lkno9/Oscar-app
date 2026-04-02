import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RecapPage } from "@/pages/RecapPage";
import { ServicesPage } from "@/pages/ServicesPage";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"oscar" | "accueil" | "services">(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "services") return "services";
    if (state?.tab === "accueil") return "accueil";
    return "oscar";
  });

  // Listen for navigation state changes (e.g. back from service pages)
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "services") setActiveTab("services");
    else if (state?.tab === "oscar") setActiveTab("oscar");
  }, [location.state]);

  const renderTab = () => {
    switch (activeTab) {
      case "oscar":
        return <HomePage />;
      case "accueil":
        return <RecapPage onGoToOscar={() => setActiveTab("oscar")} />;
      case "services":
        return <ServicesPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-lg relative" style={{ background: "white" }}>
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      {/* Bouton SOS permanent */}
      <button
        onClick={() => navigate("/services/emergency")}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg"
        style={{
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          background: "#ef4444",
          border: "3px solid #fff",
          boxShadow: "0 4px 14px rgba(239,68,68,0.4)",
        }}
        aria-label="SOS Urgence"
      >
        <Phone className="w-6 h-6 text-white" />
      </button>
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
