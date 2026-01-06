import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AnalysisResult {
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  explanation: string;
  redFlags: string[];
  recommendation: string;
  scamType?: string;
}

export function ScamChecker() {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { user } = useAuth();

  const analyzeMessage = async () => {
    if (!content.trim()) {
      toast.error("Veuillez coller un message à analyser");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-scam', {
        body: { content: content.trim() }
      });

      if (error) throw error;

      setResult(data);

      // Save to history if user is logged in
      if (user) {
        await supabase.from('scam_checks').insert({
          user_id: user.id,
          content_checked: content.trim().substring(0, 500),
          risk_level: data.riskLevel,
          explanation: data.explanation,
          red_flags: data.redFlags,
          recommendation: data.recommendation
        });
      }
    } catch (error: any) {
      console.error("Error analyzing message:", error);
      toast.error("Erreur lors de l'analyse. Réessayez.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe': return <ShieldCheck className="w-12 h-12 text-green-500" />;
      case 'suspicious': return <ShieldAlert className="w-12 h-12 text-amber-500" />;
      case 'dangerous': return <ShieldX className="w-12 h-12 text-destructive" />;
      default: return <Shield className="w-12 h-12 text-muted-foreground" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
      case 'suspicious': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
      case 'dangerous': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      default: return 'bg-muted';
    }
  };

  const getRiskTitle = (level: string) => {
    switch (level) {
      case 'safe': return '✅ Message sûr';
      case 'suspicious': return '⚠️ Prudence recommandée';
      case 'dangerous': return '🚨 Arnaque probable !';
      default: return 'Analyse';
    }
  };

  const clearAnalysis = () => {
    setContent("");
    setResult(null);
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Shield className="w-6 h-6 text-primary" />
          Vérifier un message suspect
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Collez ici un SMS, email ou message suspect. Oscar l'analysera pour vous.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Copiez-collez ici le message que vous avez reçu...

Exemple : « Votre carte vitale arrive à expiration. Mettez à jour vos informations sur ameli-renouvellement.fr »"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] text-base"
          disabled={isAnalyzing}
        />

        <div className="flex gap-3">
          <Button 
            onClick={analyzeMessage} 
            disabled={isAnalyzing || !content.trim()}
            className="flex-1 text-lg py-6"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Oscar analyse...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Vérifier ce message
              </>
            )}
          </Button>
          
          {(content || result) && (
            <Button 
              variant="outline" 
              onClick={clearAnalysis}
              disabled={isAnalyzing}
              size="lg"
            >
              Effacer
            </Button>
          )}
        </div>

        {result && (
          <div className={`p-5 rounded-xl border-2 ${getRiskColor(result.riskLevel)} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className="flex items-start gap-4">
              {getRiskIcon(result.riskLevel)}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-bold">
                  {getRiskTitle(result.riskLevel)}
                </h3>
                
                {result.scamType && (
                  <p className="text-sm font-medium text-muted-foreground">
                    Type détecté : {result.scamType}
                  </p>
                )}

                <p className="text-base leading-relaxed">
                  {result.explanation}
                </p>

                {result.redFlags && result.redFlags.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Signaux d'alerte détectés :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.redFlags.map((flag, index) => (
                        <li key={index}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="font-semibold text-sm mb-1">💡 Conseil d'Oscar :</p>
                  <p className="text-base">{result.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
