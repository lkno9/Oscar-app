import { Home, LayoutDashboard, Grid2x2 } from "lucide-react";

interface BottomNavProps {
  active: "home" | "recap" | "services";
  onNavigate: (tab: "home" | "recap" | "services") => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="h-16 bg-card border-t border-border flex shadow-soft">
      <NavButton
        icon={<Home className="w-6 h-6" />}
        label="Accueil"
        active={active === "home"}
        onClick={() => onNavigate("home")}
      />
      <NavButton
        icon={<LayoutDashboard className="w-6 h-6" />}
        label="Récap"
        active={active === "recap"}
        onClick={() => onNavigate("recap")}
      />
      <NavButton
        icon={<Grid2x2 className="w-6 h-6" />}
        label="Services"
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
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
