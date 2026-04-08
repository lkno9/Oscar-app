import { cn } from "@/lib/utils";

interface ServiceTileProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  intent?: "default" | "danger";
  badge?: number;
  color?: string;
  bgColor?: string;
  onClick?: () => void;
}

export function ServiceTile({ icon, label, sublabel, intent = "default", badge, color, bgColor, onClick }: ServiceTileProps) {
  const iconColor = intent === "danger" ? "#ef4444" : (color || "#2DD4BF");
  const iconBg = intent === "danger" ? "rgba(239,68,68,0.1)" : (bgColor || "rgba(45,212,191,0.12)");
  const borderColor = intent === "danger" ? "rgba(239,68,68,0.2)" : (color ? `${color}26` : "rgba(45,212,191,0.15)");
  const shadowColor = intent === "danger" ? "rgba(239,68,68,0.08)" : (color ? `${color}14` : "rgba(45,212,191,0.08)");

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 flex flex-col items-center gap-3 text-sm font-normal text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative",
        intent === "danger"
          ? "bg-danger text-danger-foreground"
          : "bg-white text-foreground"
      )}
      style={{
        borderRadius: 20,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 4px 20px ${shadowColor}, 0 2px 8px rgba(0,0,0,0.04)`,
      }}
    >
      {badge != null && badge > 0 && (
        <span
          className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 500 }}>{label}</span>
        {sublabel && <span style={{ fontSize: 11, lineHeight: 1.3, color: "#94a3b8" }}>{sublabel}</span>}
      </div>
    </button>
  );
}
