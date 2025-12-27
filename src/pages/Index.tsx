import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { ServicesPage } from "@/pages/ServicesPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"home" | "services">("home");

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-lg">
      <main className="flex-1 overflow-hidden">
        {activeTab === "home" ? <HomePage /> : <ServicesPage />}
      </main>
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
