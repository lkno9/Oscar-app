import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, GraduationCap, BookOpen, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScamChecker } from "@/components/scam-protection/ScamChecker";
import { ScamAlertCard } from "@/components/scam-protection/ScamAlertCard";
import { SecurityQuiz } from "@/components/scam-protection/SecurityQuiz";
import { SafetyTipsAccordion } from "@/components/scam-protection/SafetyTipsAccordion";
import { EmergencyContacts } from "@/components/scam-protection/EmergencyContacts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ScamAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  danger_level: string;
  date_detected: string;
  source: string | null;
}

export default function ScamProtectionPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('scam_alerts')
        .select('*')
        .eq('is_active', true)
        .order('date_detected', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/services")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Protection Arnaques</h1>
              <p className="text-sm text-muted-foreground">Oscar veille sur votre sécurité</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-6 pb-24">
        {/* Scam Checker - Main Feature */}
        <section>
          <ScamChecker />
        </section>

        {/* Tabs for other sections */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="alerts" className="flex flex-col items-center gap-1 py-2 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Alertes</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex flex-col items-center gap-1 py-2 text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex flex-col items-center gap-1 py-2 text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Conseils</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex flex-col items-center gap-1 py-2 text-xs">
              <Phone className="w-4 h-4" />
              <span>Urgence</span>
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Arnaques en cours
              </h2>
              <span className="text-sm text-muted-foreground">{alerts.length} alertes actives</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {displayedAlerts.map((alert) => (
                    <ScamAlertCard
                      key={alert.id}
                      title={alert.title}
                      description={alert.description}
                      category={alert.category}
                      dangerLevel={alert.danger_level}
                      dateDetected={alert.date_detected}
                      source={alert.source || undefined}
                    />
                  ))}
                </div>

                {alerts.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                  >
                    {showAllAlerts ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Voir moins
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Voir les {alerts.length - 3} autres alertes
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="mt-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Testez vos réflexes
              </h2>
              <p className="text-sm text-muted-foreground">
                5 questions pour apprendre à reconnaître les arnaques
              </p>
            </div>
            <SecurityQuiz />
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="mt-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Les règles d'or
              </h2>
              <p className="text-sm text-muted-foreground">
                7 conseils essentiels pour vous protéger
              </p>
            </div>
            <SafetyTipsAccordion />
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="help" className="mt-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Numéros utiles
              </h2>
              <p className="text-sm text-muted-foreground">
                En cas d'arnaque, contactez ces organismes
              </p>
            </div>
            <EmergencyContacts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
