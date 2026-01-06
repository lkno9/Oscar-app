import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink } from "lucide-react";
import { emergencyContacts } from "./ScamAlertsData";

export function EmergencyContacts() {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/\s/g, '')}`;
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {emergencyContacts.map((contact) => (
        <Card key={contact.id} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{contact.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {contact.description}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {contact.hours}
                </p>
              </div>
              
              {contact.number ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCall(contact.number!)}
                  className="shrink-0"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {contact.number}
                </Button>
              ) : contact.url ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenUrl(contact.url!)}
                  className="shrink-0"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
