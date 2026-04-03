import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import type { TabId } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RecapPage } from "@/pages/RecapPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { DemarchesPage } from "@/pages/DemarchesPage";

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "services") return "services";
    if (state?.tab === "accueil") return "accueil";
    if (state?.tab === "demarches") return "demarches";
    return "oscar";
  });

  // Listen for navigation state changes (e.g. back from service pages)
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "services") setActiveTab("services");
    else if (state?.tab === "oscar") setActiveTab("oscar");
    else if (state?.tab === "demarches") setActiveTab("demarches");
  }, [location.state]);

  const renderTab = () => {
    switch (activeTab) {
      case "oscar":
        return <HomePage />;
      case "accueil":
        return <RecapPage onGoToOscar={() => setActiveTab("oscar")} />;
      case "services":
        return <ServicesPage />;
      case "demarches":
        return <DemarchesPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-lg relative" style={{ background: "white" }}>
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
