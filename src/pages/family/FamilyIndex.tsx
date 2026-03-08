import { useState } from "react";
import { Home, MessageCircle, MessagesSquare } from "lucide-react";
import FamilyDashboard from "./FamilyDashboard";
import FamilyChatPage from "./FamilyChatPage";
import FamilyMessagesPage from "./FamilyMessagesPage";

type FamilyTab = "accueil" | "oscar" | "messages";

interface FamilyNavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function FamilyNavButton({ icon, label, active, onClick }: FamilyNavButtonProps) {
  const color = active ? "#48A29E" : "#94a3b8";
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer"
      style={{ padding: "4px 0", color }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, letterSpacing: "0.1px" }}>{label}</span>
    </button>
  );
}

export default function FamilyIndex() {
  const [activeTab, setActiveTab] = useState<FamilyTab>("accueil");

  const renderTab = () => {
    switch (activeTab) {
      case "accueil":
        return <FamilyDashboard onNavigate={setActiveTab} />;
      case "oscar":
        return <FamilyChatPage />;
      case "messages":
        return <FamilyMessagesPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-lg relative">
      <main className="flex-1 overflow-hidden">
        {renderTab()}
      </main>
      <nav
        className="flex items-center flex-shrink-0 bg-white dark:bg-card border-t border-border"
        style={{ padding: "10px 0 16px" }}
      >
        <FamilyNavButton
          icon={<Home className="w-5 h-5" />}
          label="Accueil"
          active={activeTab === "accueil"}
          onClick={() => setActiveTab("accueil")}
        />
        <FamilyNavButton
          icon={<MessageCircle className="w-5 h-5" />}
          label="Oscar"
          active={activeTab === "oscar"}
          onClick={() => setActiveTab("oscar")}
        />
        <FamilyNavButton
          icon={<MessagesSquare className="w-5 h-5" />}
          label="Messages"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />
      </nav>
    </div>
  );
}
