import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RecapPage } from "@/pages/RecapPage";
import { ServicesPage } from "@/pages/ServicesPage";

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"oscar" | "accueil" | "services">(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === "services") return "services";
    if (state?.tab === "oscar") return "oscar";
    return "accueil";
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-lg relative">
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
