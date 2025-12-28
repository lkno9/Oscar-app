import { cn } from "@/lib/utils";
import oscarImage from "@/assets/oscar-avatar.png";

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
        "rounded-full overflow-hidden flex items-center justify-center shadow-card bg-gradient-to-br from-primary/20 to-primary/5",
        sizeClasses[size],
        className
      )}
    >
      <img 
        src={oscarImage} 
        alt="Oscar" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
