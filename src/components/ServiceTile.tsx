import { cn } from "@/lib/utils";

interface ServiceTileProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  intent?: "default" | "danger";
  onClick?: () => void;
}

export function ServiceTile({ icon, label, sublabel, intent = "default", onClick }: ServiceTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 flex flex-col items-center gap-3 text-sm font-normal text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        intent === "danger"
          ? "bg-danger text-danger-foreground"
          : "bg-white text-foreground"
      )}
      style={{
        borderRadius: 20,
        border: intent === "danger"
          ? "1px solid rgba(239,68,68,0.2)"
          : "1px solid rgba(45,212,191,0.15)",
        boxShadow: intent === "danger"
          ? "0 4px 16px rgba(239,68,68,0.08)"
          : "0 4px 20px rgba(45,212,191,0.08), 0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: intent === "danger"
            ? "rgba(239,68,68,0.1)"
            : "rgba(45,212,191,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: intent === "danger" ? "#ef4444" : "#2DD4BF",
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
