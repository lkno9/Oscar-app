import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { safetyTips } from "./ScamAlertsData";

export function SafetyTipsAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      {safetyTips.map((tip) => (
        <AccordionItem 
          key={tip.id} 
          value={`tip-${tip.id}`}
          className="border rounded-lg px-4 bg-card"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">{tip.icon}</span>
              <span className="font-medium text-base">{tip.title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pl-11">
            <p className="text-muted-foreground leading-relaxed">
              {tip.description}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
