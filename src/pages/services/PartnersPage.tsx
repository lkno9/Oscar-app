import { useState } from "react";
import { ArrowLeft, Sparkles, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartnerServiceCard } from "@/components/partners/PartnerServiceCard";
import {
  partnerServices,
  categoryLabels,
  getAllCategories,
  getServicesByCategory,
  type PartnerCategory,
} from "@/components/partners/PartnersData";

export function PartnersPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | "all">("all");
  const categories = getAllCategories();

  const filteredServices = selectedCategory === "all" 
    ? partnerServices 
    : getServicesByCategory(selectedCategory);

  const handleAffiliateClick = (serviceId: string) => {
    // On pourrait tracker les clics ici si besoin
    console.log("Affiliate click:", serviceId);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Bons Plans Seniors</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Services sélectionnés pour vous simplifier la vie
            </p>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap shrink-0 px-3 py-1.5"
            onClick={() => setSelectedCategory("all")}
          >
            Tout voir
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap shrink-0 px-3 py-1.5"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category].emoji} {categoryLabels[category].label}
            </Badge>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        {selectedCategory === "all" ? (
          // Vue par catégories
          categories.map((category) => {
            const services = getServicesByCategory(category);
            if (services.length === 0) return null;
            
            return (
              <section key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{categoryLabels[category].emoji}</span>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {categoryLabels[category].label}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[category].description}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {services.map((service) => (
                    <PartnerServiceCard
                      key={service.id}
                      service={service}
                      onClickAffiliate={handleAffiliateClick}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          // Vue filtrée
          <div className="grid gap-3">
            {filteredServices.map((service) => (
              <PartnerServiceCard
                key={service.id}
                service={service}
                onClickAffiliate={handleAffiliateClick}
              />
            ))}
          </div>
        )}

        {/* Message de transparence */}
        <div className="bg-muted/50 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Notre engagement</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Oscar sélectionne ces services pour leur qualité et leur utilité. 
                Certains sont des partenaires qui nous versent une commission — 
                c'est indiqué clairement. Cela ne change jamais le prix pour vous 
                et nous permet de rester gratuit. Nous recommandons aussi des services 
                publics et gratuits sans aucune contrepartie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
