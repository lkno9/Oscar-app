import { cn } from "@/lib/utils";

interface ServiceTileProps {
  icon: React.ReactNode;
  label: string;
  intent?: "default" | "danger";
  onClick?: () => void;
}

export function ServiceTile({ icon, label, intent = "default", onClick }: ServiceTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 rounded-xl flex flex-col items-center gap-3 text-sm font-medium text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-tile",
        intent === "danger"
          ? "bg-danger text-danger-foreground ring-1 ring-danger-foreground/20"
          : "bg-card text-foreground ring-1 ring-border hover:ring-primary/30"
      )}
    >
      <div className={cn(
        "text-primary",
        intent === "danger" && "text-danger-foreground"
      )}>
        {icon}
      </div>
      <span className="leading-tight">{label}</span>
    </button>
  );
}
