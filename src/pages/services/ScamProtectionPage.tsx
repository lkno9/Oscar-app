import { useState, useEffect } from "react";
import { ArrowLeft, Shield, AlertTriangle, GraduationCap, BookOpen, Phone, ChevronDown, ChevronUp, MessageCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScamChecker } from "@/components/scam-protection/ScamChecker";
import { ScamAlertCard } from "@/components/scam-protection/ScamAlertCard";
import { SecurityQuiz } from "@/components/scam-protection/SecurityQuiz";
import { SafetyTipsAccordion } from "@/components/scam-protection/SafetyTipsAccordion";
import { EmergencyContacts } from "@/components/scam-protection/EmergencyContacts";
import { fallbackAlerts } from "@/components/scam-protection/ScamAlertsData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScamAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  danger_level: string;
  date_detected: string;
  source: string | null;
}

interface ScamCheckHistory {
  id: string;
  content_checked: string;
  risk_level: string;
  created_at: string;
}

export function ScamProtectionPage() {
  const goBack = useBackNavigation();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [checkHistory, setCheckHistory] = useState<ScamCheckHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchAlerts();
    if (user) fetchHistory();
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('scam_alerts')
        .select('*')
        .eq('is_active', true)
        .order('date_detected', { ascending: false });

      if (error) throw error;
      // Utiliser les alertes de la DB, ou les fallback si la DB est vide
      setAlerts(data && data.length > 0 ? data : fallbackAlerts as any);
    } catch (error) {
      // En cas d'erreur, afficher les alertes de fallback
      setAlerts(fallbackAlerts as any);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await supabase
        .from('scam_checks')
        .select('id, content_checked, risk_level, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setCheckHistory(data || []);
    } catch {
      // silently fail
    }
  };

  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Protection Arnaques</h1>
              <p className="text-sm text-muted-foreground">Oscar veille sur votre sécurité</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-6 pb-24">
        {/* Ask Oscar Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/chat")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-base">Un message vous semble suspect ?</h3>
              <p className="text-sm text-muted-foreground">Envoyez-le à Oscar par chat — il l'analysera et vous dira quoi faire.</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-primary rotate-180 shrink-0" />
          </CardContent>
        </Card>

        {/* Scam Checker - Main Feature */}
        <section>
          <ScamChecker />
        </section>

        {/* Check History */}
        {checkHistory.length > 0 && (
          <section>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3 hover:text-foreground transition-colors"
            >
              <History className="w-4 h-4" />
              Mes vérifications récentes ({checkHistory.length})
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showHistory && (
              <div className="space-y-2">
                {checkHistory.map((check) => (
                  <Card key={check.id} className="bg-card">
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-lg">
                        {check.risk_level === 'safe' ? '✅' : check.risk_level === 'suspicious' ? '⚠️' : '🚨'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{check.content_checked}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(check.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

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
