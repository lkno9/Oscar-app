import { useState, useEffect } from "react";
import { Home, MessageCircle, MessagesSquare } from "lucide-react";
import FamilyDashboard from "./FamilyDashboard";
import FamilyChatPage from "./FamilyChatPage";
import FamilyMessagesPage from "./FamilyMessagesPage";
import { useFamilyMessages } from "@/hooks/useFamilyMessages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type FamilyTab = "accueil" | "oscar" | "messages";

interface FamilyNavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  dot?: boolean;
  onClick: () => void;
}

function FamilyNavButton({ icon, label, active, badge, dot, onClick }: FamilyNavButtonProps) {
  const color = active ? "#48A29E" : "#94a3b8";
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer relative"
      style={{ padding: "4px 0", color }}
    >
      <div className="relative">
        {icon}
        {/* Badge count */}
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-white font-bold px-1"
            style={{ fontSize: 9, lineHeight: 1 }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {/* Dot indicator (no count) */}
        {dot && !badge && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, letterSpacing: "0.1px" }}>{label}</span>
    </button>
  );
}

export default function FamilyIndex() {
  const [activeTab, setActiveTab] = useState<FamilyTab>("accueil");
  const { user } = useAuth();
  const { unreadCount: unreadMessages } = useFamilyMessages();
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("family_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotificationCount(count || 0);
    };
    fetchCount();

    // Realtime subscription for notifications
    const channel = supabase
      .channel("family-index-notif-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "family_notifications", filter: `user_id=eq.${user.id}` },
        () => {
          setNotificationCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "family_notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
          dot={notificationCount > 0}
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
          badge={unreadMessages}
          onClick={() => setActiveTab("messages")}
        />
      </nav>
    </div>
  );
}
