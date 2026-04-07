import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PenLine,
  FileText,
  ChevronRight,
  ListChecks,
  BookOpen,
  CalendarDays,
  Sparkles,
  AlertCircle,
  X,
  ClipboardList,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { DEMARCHE_TEMPLATES } from "@/lib/documentService";
import { TaskCard } from "@/components/documents/TaskCard";
import { AidCard } from "@/components/documents/AidCard";
import { TASK_CATEGORIES, SOCIAL_AIDS, RIGHTS_GUIDES } from "@/components/documents/TaskTemplates";
import { SectionTitle, ActionCard, ICON_MAP } from "@/components/demarches/DemarchesHelpers";
import { DemarchesWriteFlow } from "@/components/demarches/DemarchesWriteFlow";

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

export function DemarchesPage() {
  const navigate = useNavigate();
  const goBack = useBackNavigation();
  const { tasks, loading: tasksLoading, createTaskFromTemplate, updateTaskStep, deleteTask, getInProgressTasks, templates } = useAdminTasks();
  const [showWriteFlow, setShowWriteFlow] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAllAids, setShowAllAids] = useState(false);

  const inProgressTasks = getInProgressTasks();
  const currentMonth = new Date().getMonth() + 1;
  const monthlyAlerts = MONTHLY_CONTEXT[currentMonth] || [];
  const monthNames = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const currentMonthName = monthNames[new Date().getMonth()];

  // Navigate to Oscar main tab with a contextual question
  const handleAskOscar = (context: string) => {
    navigate("/", { state: { tab: "oscar" } });
  };

  const handleCreateTask = async (templateId: string) => {
    await createTaskFromTemplate(templateId);
    setShowTaskForm(false);
  };

  // If user entered the write flow, show it fullscreen
  if (showWriteFlow) {
    return <DemarchesWriteFlow onBack={() => setShowWriteFlow(false)} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Header — standard pattern ── */}
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

      {/* ── Single scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 36 }}>

          {/* 1. Alertes du mois */}
          {monthlyAlerts.length > 0 && (
            <div>
              <SectionTitle icon={<CalendarDays className="w-4 h-4" />} label={`En ${currentMonthName}`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {monthlyAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{
                      background: alert.urgency === "high" ? "rgba(239,68,68,0.06)" : "white",
                      border: alert.urgency === "high" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(45,212,191,0.12)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    }}>
                    <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{alert.title}</p>
                        {alert.urgency === "high" && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 7px", borderRadius: 99 }}>URGENT</span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 10px", lineHeight: 1.5 }}>{alert.description}</p>
                      <button onClick={() => handleAskOscar(`${alert.title} : ${alert.description}`)}
                        className="flex items-center gap-1.5"
                        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 600, color: "#1EB89A" }}>
                        <MessageCircle className="w-3.5 h-3.5" />
                        Demander à Oscar
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Actions rapides */}
          <div>
            <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Que voulez-vous faire ?" />
            <div className="grid grid-cols-2 gap-2.5">
              <ActionCard icon={<PenLine className="w-6 h-6" />} label="Écrire un courrier" sublabel="Réclamation, demande, résiliation..." color="#1EB89A" onClick={() => setShowWriteFlow(true)} />
              <ActionCard icon={<ListChecks className="w-6 h-6" />} label="Nouvelle démarche" sublabel="Lancer un dossier guidé" color="#3B82F6" badge={inProgressTasks.length > 0 ? inProgressTasks.length : undefined} onClick={() => setShowTaskForm(true)} />
            </div>
            <button
              onClick={() => handleAskOscar("Bonjour Oscar, j'ai une question administrative.")}
              className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-2xl transition-all active:scale-[0.98]"
              style={{ border: "1px solid rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.04)", cursor: "pointer" }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "#2DD4BF" }} />
              <span style={{ fontSize: 13, color: "#64748B" }}>Oscar peut aussi vous aider sur vos démarches</span>
              <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />
            </button>
          </div>

          {/* 3. Démarches en cours (inline) */}
          {!tasksLoading && inProgressTasks.length > 0 && (
            <div>
              <SectionTitle icon={<AlertCircle className="w-4 h-4" />} label={`En cours (${inProgressTasks.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} onAskOscar={handleAskOscar} />
                ))}
              </div>
            </div>
          )}

          {/* Inline task creation form */}
          {showTaskForm && (
            <div className="rounded-2xl p-4 bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Choisir une démarche</p>
                <button onClick={() => setShowTaskForm(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#94A3B8" }} /></button>
              </div>
              <div className="max-h-80 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {TASK_CATEGORIES.map(cat => {
                  const catTemplates = templates.filter(t => t.category === cat.value);
                  if (catTemplates.length === 0) return null;
                  return (
                    <div key={cat.value}>
                      <p className="text-sm font-semibold sticky top-0 py-1" style={{ color: "#64748B", background: "white", margin: "4px 0" }}><span>{cat.icon}</span> {cat.label}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {catTemplates.map(tmpl => (
                          <button key={tmpl.id} onClick={() => handleCreateTask(tmpl.id)} className="w-full text-left p-3 rounded-xl"
                            style={{ border: "1px solid #E2E8F0", background: "white", cursor: "pointer" }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: "#1A1E35", margin: 0 }}>{tmpl.title}</p>
                            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{tmpl.steps.length} étapes • ~{tmpl.estimatedDays} jours</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Not started tasks */}
          {!tasksLoading && tasks.filter(t => t.status === "not_started").length > 0 && (
            <div>
              <SectionTitle icon={<CalendarDays className="w-4 h-4" />} label="À commencer" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.filter(t => t.status === "not_started").map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} onAskOscar={handleAskOscar} />
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {!tasksLoading && tasks.filter(t => t.status === "done").length > 0 && (
            <div>
              <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Terminées" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.filter(t => t.status === "done").map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Modèles de courriers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={<FileText className="w-4 h-4" />} label="Modèles de courriers" />
              <button onClick={() => setShowWriteFlow(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#1EB89A", fontWeight: 600, padding: 0, marginBottom: 12 }}>
                Tous voir
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMARCHE_TEMPLATES.slice(0, 4).map(template => (
                <button key={template.id} onClick={() => setShowWriteFlow(true)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left", width: "100%" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,184,154,0.1)", color: "#1EB89A" }}>
                    {ICON_MAP[template.icon] || <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{template.label}</p>
                    <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{template.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#CBD5E1" }} />
                </button>
              ))}
            </div>
          </div>

          {/* 5. Droits & aides (collapsible) */}
          <div>
            <div className="p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.08)", border: "1px solid rgba(30,184,154,0.15)" }}>
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 flex-shrink-0" style={{ color: "#1EB89A" }} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Oscar vérifie vos droits</p>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 12px" }}>Oscar peut analyser votre situation et vous indiquer les aides auxquelles vous avez droit.</p>
                  <button onClick={() => handleAskOscar("Quelles aides sociales sont disponibles pour les seniors ?")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                    style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white", boxShadow: "0 2px 8px rgba(30,184,154,0.3)" }}>
                    <MessageCircle className="w-4 h-4" /> Vérifier mes droits avec Oscar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guides thématiques */}
          <div>
            <SectionTitle icon={<BookOpen className="w-4 h-4" />} label="Guides thématiques" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RIGHTS_GUIDES.map(guide => (
                <button key={guide.id}
                  onClick={() => handleAskOscar(`Explique-moi en détail : ${guide.title}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left", width: "100%" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6", fontSize: 20 }}>{guide.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{guide.title}</p>
                    <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{guide.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#CBD5E1" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Aides disponibles (collapsible) */}
          <div>
            <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Aides disponibles" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(showAllAids ? SOCIAL_AIDS : SOCIAL_AIDS.slice(0, 3)).map(aid => (
                <AidCard key={aid.id} aid={aid} onAskOscar={handleAskOscar} />
              ))}
              {SOCIAL_AIDS.length > 3 && (
                <button onClick={() => setShowAllAids(!showAllAids)} className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                  style={{ border: "1.5px dashed rgba(30,184,154,0.3)", background: "transparent", cursor: "pointer", color: "#1EB89A", fontSize: 14, fontWeight: 600 }}>
                  {showAllAids ? "Voir moins" : `Voir toutes les aides (${SOCIAL_AIDS.length})`}
                  <ChevronDown className="w-4 h-4" style={{ transform: showAllAids ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
