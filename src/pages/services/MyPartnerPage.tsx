import { PartnerPage } from "@/components/partner/PartnerCard";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export function MyPartnerPage() {
  const goBack = useBackNavigation();
  return <PartnerPage onBack={goBack} />;
}
