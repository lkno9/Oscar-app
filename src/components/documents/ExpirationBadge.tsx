import { differenceInDays, isPast, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ExpirationBadgeProps {
  expirationDate: string | null;
  showText?: boolean;
  size?: "sm" | "md";
}

export const ExpirationBadge = ({ 
  expirationDate, 
  showText = true,
  size = "md" 
}: ExpirationBadgeProps) => {
  if (!expirationDate) {
    return null;
  }

  const expDate = parseISO(expirationDate);
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expDate, today);
  const isExpired = isPast(expDate);

  let variant: "default" | "destructive" | "secondary" | "outline" = "default";
  let icon = <CheckCircle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
  let text = "";
  let bgClass = "bg-green-100 text-green-800 border-green-200";

  if (isExpired) {
    variant = "destructive";
    icon = <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
    text = `Expiré depuis ${Math.abs(daysUntilExpiry)} jour${Math.abs(daysUntilExpiry) > 1 ? 's' : ''}`;
    bgClass = "bg-red-100 text-red-800 border-red-200";
  } else if (daysUntilExpiry <= 30) {
    variant = "destructive";
    icon = <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
    text = `Expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`;
    bgClass = "bg-orange-100 text-orange-800 border-orange-200";
  } else if (daysUntilExpiry <= 90) {
    icon = <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
    text = `Expire dans ${daysUntilExpiry} jours`;
    bgClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else {
    text = `Valide encore ${daysUntilExpiry} jours`;
  }

  return (
    <Badge 
      variant="outline" 
      className={`${bgClass} ${size === "sm" ? "text-sm px-1.5 py-0.5" : "text-sm px-2 py-1"} flex items-center gap-1`}
    >
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
};

export const getExpirationStatus = (expirationDate: string | null): 'ok' | 'warning' | 'urgent' | 'expired' | null => {
  if (!expirationDate) return null;
  
  const expDate = parseISO(expirationDate);
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expDate, today);
  
  if (isPast(expDate)) return 'expired';
  if (daysUntilExpiry <= 30) return 'urgent';
  if (daysUntilExpiry <= 90) return 'warning';
  return 'ok';
};
