import { useState } from "react";
import { ArrowLeft, Plus, X, ListChecks, CalendarDays, Sparkles, AlertCircle } from "lucide-react";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { TaskCard } from "@/components/documents/TaskCard";
import { TASK_CATEGORIES } from "@/components/documents/TaskTemplates";
import { SectionTitle } from "./DemarchesHelpers";

interface DemarchesTasksFlowProps {
  onBack: () => void;
  onAskOscar: (ctx: string) => void;
}

export function DemarchesTasksFlow({ onBack, onAskOscar }: DemarchesTasksFlowProps) {
  const { tasks, loading, createTaskFromTemplate, updateTaskStep, deleteTask, getInProgressTasks, templates } = useAdminTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const inProgressTasks = getInProgressTasks();
  const notStartedTasks = tasks.filter(t => t.status === "not_started");
  const doneTasks = tasks.filter(t => t.status === "done");

  const handleCreateTask = async (templateId: string) => {
    await createTaskFromTemplate(templateId);
    setShowTaskForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Mes démarches</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} démarche{tasks.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="p-2.5 rounded-full transition-colors"
          style={{ background: "#1EB89A", border: "none", cursor: "pointer" }}
          aria-label="Nouvelle démarche"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 36 }}>

          {/* Task creation form */}
          {showTaskForm && (
            <div className="rounded-2xl p-4 bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Nouvelle démarche</p>
                <button onClick={() => setShowTaskForm(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                  <X className="w-5 h-5" style={{ color: "#94A3B8" }} />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {TASK_CATEGORIES.map(cat => {
                  const catTemplates = templates.filter(t => t.category === cat.value);
                  if (catTemplates.length === 0) return null;
                  return (
                    <div key={cat.value}>
                      <p className="text-sm font-semibold sticky top-0 py-1" style={{ color: "#64748B", background: "white", margin: "4px 0" }}>
                        <span>{cat.icon}</span> {cat.label}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {catTemplates.map(tmpl => (
                          <button key={tmpl.id} onClick={() => handleCreateTask(tmpl.id)} className="w-full text-left p-3 rounded-xl transition-all active:scale-[0.98]"
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

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && tasks.length === 0 && !showTaskForm && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                <ListChecks className="w-8 h-8" style={{ color: "#3B82F6" }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Aucune démarche en cours</p>
              <p style={{ fontSize: 14, color: "#64748B", textAlign: "center" }}>Lancez votre première démarche guidée pour suivre vos dossiers administratifs.</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium transition-all active:scale-[0.98]"
                style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
              >
                <Plus className="w-5 h-5" /> Nouvelle démarche
              </button>
            </div>
          )}

          {/* In progress */}
          {!loading && inProgressTasks.length > 0 && (
            <div>
              <SectionTitle icon={<AlertCircle className="w-4 h-4" />} label={`En cours (${inProgressTasks.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} onAskOscar={onAskOscar} />
                ))}
              </div>
            </div>
          )}

          {/* Not started */}
          {!loading && notStartedTasks.length > 0 && (
            <div>
              <SectionTitle icon={<CalendarDays className="w-4 h-4" />} label={`À commencer (${notStartedTasks.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notStartedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} onAskOscar={onAskOscar} />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {!loading && doneTasks.length > 0 && (
            <div>
              <SectionTitle icon={<Sparkles className="w-4 h-4" />} label={`Terminées (${doneTasks.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {doneTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdateStep={updateTaskStep} onDelete={deleteTask} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
