import { ExternalLink, Gift, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PartnerService } from "./PartnersData";

interface PartnerServiceCardProps {
  service: PartnerService;
  onClickAffiliate?: (serviceId: string) => void;
}

export function PartnerServiceCard({ service, onClickAffiliate }: PartnerServiceCardProps) {
  const handleClick = () => {
    onClickAffiliate?.(service.id);
    window.open(service.affiliateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardContent className="p-4">
        {/* Header avec icône et nom */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl" role="img" aria-label={service.name}>
            {service.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {service.name}
              </h3>
              {service.isPartner && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  Partenaire
                </Badge>
              )}
            </div>
            {/* Promo badge */}
            {service.promoValue && (
              <div className="flex items-center gap-1 mt-1">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                  {service.promoValue}
                  {service.promoCode && (
                    <span className="text-muted-foreground font-normal"> — code : </span>
                  )}
                  {service.promoCode && (
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                      {service.promoCode}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {service.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {service.tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleClick}
            className="flex-1"
            size="sm"
          >
            Découvrir
            <ExternalLink className="w-4 h-4 ml-1.5" />
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Info className="w-4 h-4" />
                <span className="sr-only">Pourquoi ce choix ?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{service.icon}</span>
                  Pourquoi on recommande {service.name}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription asChild>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    {service.whyWeRecommend}
                  </p>
                  {service.isPartner && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      💡 Oscar perçoit une petite commission si vous souscrivez via ce lien. 
                      Cela ne change pas le prix pour vous et nous aide à rester gratuit.
                    </p>
                  )}
                  {!service.isPartner && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      ✨ Ce service est recommandé sans aucune contrepartie commerciale. 
                      On le trouve simplement utile !
                    </p>
                  )}
                </div>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
