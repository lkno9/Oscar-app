import { cn } from "@/lib/utils";

interface OscarAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OscarAvatar({ size = "md", className }: OscarAvatarProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-card",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn(
        "text-primary-foreground font-bold",
        size === "sm" && "text-lg",
        size === "md" && "text-2xl",
        size === "lg" && "text-4xl"
      )}>
        O
      </span>
    </div>
  );
}
