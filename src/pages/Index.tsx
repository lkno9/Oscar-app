import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RecapPage } from "@/pages/RecapPage";
import { ServicesPage } from "@/pages/ServicesPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "recap" | "services">("home");

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "recap":
        return <RecapPage />;
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
