import { useState, useEffect } from "react";
import { ArrowLeft, Gift, Shield, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { PartnerServiceCard } from "@/components/partners/PartnerServiceCard";
import { supabase } from "@/integrations/supabase/client";
import {
  categoryLabels,
  getAllCategories,
  type PartnerCategory,
  type PartnerService,
} from "@/components/partners/PartnersData";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { toast } from "sonner";

export function PartnersPage() {
  const navigate = useNavigate();
  const goBack = useBackNavigation();
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | "all">("all");
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = getAllCategories();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('partner_services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setServices(data as PartnerService[]);
    }
    setLoading(false);
  };

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const getServicesByCategory = (category: PartnerCategory) => {
    return services.filter(s => s.category === category);
  };

  const handleAffiliateClick = (serviceId: string) => {
    toast.info("Redirection en cours...");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Bons Plans Seniors</h1>
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
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">
              Aucun partenaire pour le moment
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Nous sélectionnons soigneusement nos partenaires. 
              De nouvelles offres seront bientôt disponibles !
            </p>
          </div>
        ) : selectedCategory === "all" ? (
          // Vue par catégories
          categories.map((category) => {
            const categoryServices = getServicesByCategory(category);
            if (categoryServices.length === 0) return null;
            
            return (
              <section key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{categoryLabels[category].emoji}</span>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {categoryLabels[category].label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabels[category].description}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {categoryServices.map((service) => (
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

        {/* Message de transparence - seulement si on a des partenaires */}
        {services.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 mt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Notre engagement</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Oscar sélectionne ces services pour leur qualité et leur utilité. 
                  Certains sont des partenaires qui nous versent une commission — 
                  c'est indiqué clairement. Cela ne change jamais le prix pour vous 
                  et nous permet de rester gratuit. Nous recommandons aussi des services 
                  publics et gratuits sans aucune contrepartie.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
