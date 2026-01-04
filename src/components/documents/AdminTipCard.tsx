import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminTip } from "./TaskTemplates";

interface AdminTipCardProps {
  tip: AdminTip;
  onAskOscar?: (context: string) => void;
}

export const AdminTipCard = ({ tip, onAskOscar }: AdminTipCardProps) => {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{tip.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm">{tip.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
            
            <div className="flex items-center gap-2 mt-3">
              {tip.actionLabel && onAskOscar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAskOscar(tip.title)}
                  className="text-xs h-8"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {tip.actionLabel}
                </Button>
              )}
              {onAskOscar && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAskOscar(tip.title)}
                  className="text-xs h-8"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Demander à Oscar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
