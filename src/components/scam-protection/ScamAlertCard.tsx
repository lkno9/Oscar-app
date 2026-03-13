import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryIcon, getCategoryLabel, getDangerColor, getDangerLabel } from "./ScamAlertsData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScamAlertCardProps {
  title: string;
  description: string;
  category: string;
  dangerLevel: string;
  dateDetected: string;
  source?: string;
}

export function ScamAlertCard({
  title,
  description,
  category,
  dangerLevel,
  dateDetected,
  source
}: ScamAlertCardProps) {
  return (
    <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
          </div>
          <Badge className={`${getDangerColor(dangerLevel)} shrink-0 text-sm`}>
            {getDangerLabel(dangerLevel)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {getCategoryLabel(category)}
            </Badge>
            {source && (
              <span className="text-muted-foreground/70">
                Source: {source}
              </span>
            )}
          </div>
          <span>
            {format(new Date(dateDetected), "d MMM yyyy", { locale: fr })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
