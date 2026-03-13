import { ExternalLink, MessageCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SocialAid {
  id: string;
  name: string;
  shortDescription: string;
  whoCanApply: string;
  whereToApply: string;
  website: string;
}

interface AidCardProps {
  aid: SocialAid;
  onAskOscar: (aidName: string) => void;
}

export const AidCard = ({ aid, onAskOscar }: AidCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2">{aid.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{aid.shortDescription}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Qui peut en bénéficier ?</p>
              <p className="text-sm text-muted-foreground">{aid.whoCanApply}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Où faire la demande ?</p>
              <p className="text-sm text-muted-foreground">{aid.whereToApply}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onAskOscar(aid.name)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            En savoir plus avec Oscar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://${aid.website}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
