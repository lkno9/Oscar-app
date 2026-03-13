import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, FileText, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RightGuide } from "./TaskTemplates";

interface RightsGuideCardProps {
  guide: RightGuide;
  onAskOscar?: (context: string) => void;
}

export const RightsGuideCard = ({ guide, onAskOscar }: RightsGuideCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">{guide.icon}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-foreground">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                </div>
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {guide.estimatedDelay}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {guide.website}
                </span>
              </div>
            </div>
          </div>

          <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
            {/* Éligibilité */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                ✅ Qui peut en bénéficier ?
              </h4>
              <ul className="space-y-1">
                {guide.eligibility.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Comment faire */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                📝 Comment faire la demande ?
              </h4>
              <ol className="space-y-1">
                {guide.howToApply.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="font-medium text-primary min-w-[20px]">{idx + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            {/* Documents nécessaires */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents à préparer
              </h4>
              <ul className="space-y-1">
                {guide.documents.map((doc, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {onAskOscar && (
                <Button
                  size="sm"
                  onClick={() => onAskOscar(`Comment demander ${guide.title} ?`)}
                  className="text-sm"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Aide personnalisée avec Oscar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://${guide.website}`, '_blank')}
                className="text-sm"
              >
                <Globe className="w-3 h-3 mr-1" />
                Site officiel
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
