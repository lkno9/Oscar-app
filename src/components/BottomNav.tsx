import { Home, MessageCircle, Menu, FileText } from "lucide-react";

export type TabId = "oscar" | "accueil" | "services" | "demarches";

interface BottomNavProps {
  active: TabId;
  onNavigate: (tab: TabId) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="flex items-center flex-shrink-0"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: 10,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "0.5px solid rgba(0,0,0,0.1)",
      }}
    >
      <NavButton icon={<Home   className="w-[22px] h-[22px]" />} label="Accueil"    active={active === "accueil"}    onClick={() => onNavigate("accueil")} />
      <NavButton icon={<MessageCircle className="w-[22px] h-[22px]" />} label="Oscar"      active={active === "oscar"}      onClick={() => onNavigate("oscar")} />
      <NavButton icon={<FileText className="w-[22px] h-[22px]" />} label="Démarches"  active={active === "demarches"}  onClick={() => onNavigate("demarches")} />
      <NavButton icon={<Menu   className="w-[22px] h-[22px]" />} label="Menu"       active={active === "services"}   onClick={() => onNavigate("services")} />
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
      className="flex-1 flex flex-col items-center justify-center gap-[3px] border-none bg-transparent cursor-pointer"
      style={{ paddingBottom: 4, minHeight: 56 }}
    >
      {/* Icon */}
      <span style={{ color: active ? "#2DD4BF" : "#6B7280", transition: "color 0.18s ease" }}>
        {icon}
      </span>

      {/* Label */}
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        color: active ? "#2DD4BF" : "#6B7280",
        letterSpacing: "0.2px",
        transition: "color 0.18s ease",
      }}>
        {label}
      </span>

      {/* Active dot indicator */}
      <span style={{
        width: active ? 4 : 0,
        height: 4,
        borderRadius: 99,
        background: "#2DD4BF",
        marginTop: 1,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }} />
    </button>
  );
}
