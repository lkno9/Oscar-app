import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PenLine,
  ChevronRight,
  ListChecks,
  BookOpen,
  CalendarDays,
  Sparkles,
  AlertCircle,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { TaskCard } from "@/components/documents/TaskCard";
import { SectionTitle, ActionCard } from "@/components/demarches/DemarchesHelpers";
import { DemarchesWriteFlow } from "@/components/demarches/DemarchesWriteFlow";
import { DemarchesTasksFlow } from "@/components/demarches/DemarchesTasksFlow";
import { DemarchesDroitsFlow } from "@/components/demarches/DemarchesDroitsFlow";

// ─── Monthly context alerts ─────────────────────────────
const MONTHLY_CONTEXT: Record<number, { title: string; description: string; icon: string; urgency: "high" | "medium" | "low" }[]> = {
  1: [{ title: "Vœux & renouvellements", description: "Vérifiez vos contrats d'assurance et mutuelles annuels.", icon: "📋", urgency: "medium" }],
  2: [{ title: "Préparer sa déclaration d'impôts", description: "Rassemblez vos justificatifs : revenus, dépenses de santé, dons...", icon: "📊", urgency: "medium" }],
  3: [{ title: "Déclaration d'impôts : J-1 mois", description: "La campagne ouvre en avril. Préparez vos documents maintenant.", icon: "⏰", urgency: "high" }],
  4: [{ title: "Déclaration d'impôts", description: "La campagne est ouverte. Deadline papier fin mai, en ligne mi-juin.", icon: "📊", urgency: "high" }],
  5: [{ title: "Dernière ligne droite des impôts", description: "Pensez aux déductions retraite, dépenses de santé, dons aux associations.", icon: "📊", urgency: "high" }, { title: "Renouvellement ordonnances", description: "Vérifiez vos ordonnances de longue durée avant l'été.", icon: "💊", urgency: "medium" }],
  6: [{ title: "Préparer les vacances", description: "Pensez à la demande d'aide vacances (ANCV, CAF) et à vos papiers d'identité.", icon: "✈️", urgency: "low" }],
  7: [{ title: "Renouvellement carte Vitale", description: "Signalez tout changement de situation à votre CPAM.", icon: "💳", urgency: "low" }],
  8: [{ title: "Rentrée à préparer", description: "Allocations rentrée, mutuelles, assurances habitation...", icon: "📚", urgency: "medium" }],
  9: [{ title: "Avis d'imposition reçu", description: "Vérifiez votre avis et signalez toute erreur sous 60 jours.", icon: "📬", urgency: "medium" }],
  10: [{ title: "Renouvellement chauffage", description: "Vérifiez vos aides énergie (chèque énergie, MaPrimeRénov).", icon: "🔥", urgency: "medium" }],
  11: [{ title: "Taxe foncière", description: "Date limite de paiement en ligne : 20 novembre.", icon: "🏠", urgency: "high" }],
  12: [{ title: "Dons & défiscalisation", description: "Les dons faits avant le 31/12 sont déductibles de vos impôts 2025.", icon: "🎁", urgency: "medium" }],
};

type ActiveFlow = "none" | "write" | "tasks" | "droits";

export function DemarchesPage() {
  const navigate = useNavigate();
  const goBack = useBackNavigation();
  const { tasks, loading: tasksLoading, updateTaskStep, deleteTask, getInProgressTasks } = useAdminTasks();
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>("none");

  const inProgressTasks = getInProgressTasks();
  const currentMonth = new Date().getMonth() + 1;
  const monthlyAlerts = MONTHLY_CONTEXT[currentMonth] || [];
  const monthNames = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const currentMonthName = monthNames[new Date().getMonth()];

  const handleAskOscar = (context: string) => {
    navigate("/", { state: { tab: "oscar" } });
  };

  // Full-screen flows
  if (activeFlow === "write") {
    return <DemarchesWriteFlow onBack={() => setActiveFlow("none")} />;
  }
  if (activeFlow === "tasks") {
    return <DemarchesTasksFlow onBack={() => setActiveFlow("none")} onAskOscar={handleAskOscar} />;
  }
  if (activeFlow === "droits") {
    return <DemarchesDroitsFlow onBack={() => setActiveFlow("none")} onAskOscar={handleAskOscar} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={goBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Démarches admin</h1>
          <p className="text-sm text-muted-foreground">Votre assistant administratif</p>
        </div>
        <ClipboardList className="w-6 h-6 text-primary" />
      </header>

      {/* Dashboard */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 36 }}>

          {/* Actions rapides — grille 2×2 */}
          <div>
            <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Que voulez-vous faire ?" />
            <div className="grid grid-cols-2 gap-2.5">
              <ActionCard icon={<PenLine className="w-6 h-6" />} label="Écrire un courrier" sublabel="Réclamation, demande, résiliation..." color="#1EB89A" onClick={() => setActiveFlow("write")} />
              <ActionCard icon={<ListChecks className="w-6 h-6" />} label="Mes démarches" sublabel="Suivre mes dossiers en cours" color="#3B82F6" badge={inProgressTasks.length > 0 ? inProgressTasks.length : undefined} onClick={() => setActiveFlow("tasks")} />
              <ActionCard icon={<BookOpen className="w-6 h-6" />} label="Mes droits & aides" sublabel="APL, retraite, APA, allocations..." color="#8B5CF6" onClick={() => setActiveFlow("droits")} />
              <ActionCard icon={<MessageCircle className="w-6 h-6" />} label="Demander à Oscar" sublabel="Une question administrative ?" color="#2DD4BF" onClick={() => handleAskOscar("Bonjour Oscar, j'ai une question administrative.")} />
            </div>
          </div>

          {/* Alertes du mois — compact, max 2 */}
          {monthlyAlerts.length > 0 && (
            <div>
              <SectionTitle icon={<CalendarDays className="w-4 h-4" />} label={`En ${currentMonthName}`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {monthlyAlerts.slice(0, 2).map((alert, i) => (
                  <button key={i} onClick={() => handleAskOscar(`${alert.title} : ${alert.description}. Explique-moi les étapes à suivre.`)}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98]"
                    style={{
                      border: alert.urgency === "high" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(45,212,191,0.12)",
                      background: alert.urgency === "high" ? "rgba(239,68,68,0.04)" : "white",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", textAlign: "left", width: "100%",
                    }}>
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{alert.title}</p>
                      <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0", lineHeight: 1.4 }}>{alert.description}</p>
                    </div>
                    {alert.urgency === "high" && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}>URGENT</span>
                    )}
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#CBD5E1" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Démarches en cours — aperçu max 3 */}
          {!tasksLoading && inProgressTasks.length > 0 && (
            <div>
              <SectionTitle icon={<AlertCircle className="w-4 h-4" />} label={`En cours (${inProgressTasks.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inProgressTasks.slice(0, 3).map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} onAskOscar={handleAskOscar} />
                ))}
                {inProgressTasks.length > 3 && (
                  <button onClick={() => setActiveFlow("tasks")} className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                    style={{ border: "1.5px dashed rgba(59,130,246,0.3)", background: "transparent", cursor: "pointer", color: "#3B82F6", fontSize: 14, fontWeight: 600 }}>
                    Voir toutes les démarches ({inProgressTasks.length})
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
