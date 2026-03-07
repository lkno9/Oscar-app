import { Home, MessageCircle, Menu } from "lucide-react";

interface BottomNavProps {
  active: "oscar" | "accueil" | "services";
  onNavigate: (tab: "oscar" | "accueil" | "services") => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="flex items-center flex-shrink-0 bg-white dark:bg-card border-t border-border"
      style={{ padding: "10px 0 16px" }}
    >
      <NavButton
        icon={<Home className="w-5 h-5" />}
        label="Accueil"
        active={active === "accueil"}
        onClick={() => onNavigate("accueil")}
      />
      <NavButton
        icon={<MessageCircle className="w-5 h-5" />}
        label="Oscar"
        active={active === "oscar"}
        onClick={() => onNavigate("oscar")}
      />
      <NavButton
        icon={<Menu className="w-5 h-5" />}
        label="Menu"
        active={active === "services"}
        onClick={() => onNavigate("services")}
      />
    </nav>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, active, onClick }: NavButtonProps) {
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
