import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileWarning, Building2, FileX2, Heart, ShieldCheck, PenLine,
  FileText, ChevronRight, ArrowLeft, Clock, Mail, Download, Trash2,
  MessageCircle, BookOpen, ListChecks, Send, Plus, X, CalendarDays,
  Sparkles, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DEMARCHE_TEMPLATES, buildPrompt, downloadDocument } from "@/lib/documentService";
import { openMailtoLink } from "@/lib/mailtoHelper";
import { useMistralChat } from "@/hooks/useMistralChat";
import { useAuth } from "@/hooks/useAuth";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { TaskCard } from "@/components/documents/TaskCard";
import { AidCard } from "@/components/documents/AidCard";
import { TASK_CATEGORIES, SOCIAL_AIDS, RIGHTS_GUIDES } from "@/components/documents/TaskTemplates";
import type { DemarcheTemplate, DemarcheFields, SavedDocument, DocumentStatus } from "@/types/demarches";

const ICON_MAP: Record<string, React.ReactNode> = {
  FileWarning: <FileWarning className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  FileX2: <FileX2 className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  PenLine: <PenLine className="w-6 h-6" />,
};

// Contextual admin calendar — what seniors need to think about each month
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

type ViewMode = "dashboard" | "write" | "chat" | "tasks" | "droits";
type WriteView = "list" | "form" | "result";

const OSCAR_SUGGESTIONS = [
  "Quelles aides auxquelles j'ai droit ?",
  "Comment déclarer mes impôts ?",
  "Comment renouveler ma carte vitale ?",
  "Quelles démarches dois-je faire ce mois-ci ?",
];

export function DemarchesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>("dashboard");

  // Write flow
  const [writeView, setWriteView] = useState<WriteView>("list");
  const [selectedTemplate, setSelectedTemplate] = useState<DemarcheTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fields, setFields] = useState<DemarcheFields>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

  // Tasks
  const { tasks, loading: tasksLoading, createTaskFromTemplate, updateTaskStep, deleteTask, getInProgressTasks, templates } = useAdminTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const inProgressTasks = getInProgressTasks();

  // Oscar chat
  const [oscarMessages, setOscarMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [oscarInput, setOscarInput] = useState("");
  const [oscarTyping, setOscarTyping] = useState(false);
  const oscarEndRef = useRef<HTMLDivElement>(null);
  const lastOscarIdRef = useRef<string | null>(null);

  const handleOscarDelta = useCallback((token: string) => {
    setOscarTyping(false);
    setOscarMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.id === lastOscarIdRef.current) {
        return prev.map(m => m.id === lastOscarIdRef.current ? { ...m, content: m.content + token } : m);
      }
      const id = Date.now().toString();
      lastOscarIdRef.current = id;
      return [...prev, { id, role: "assistant" as const, content: token }];
    });
  }, []);

  const handleOscarDone = useCallback(() => { setOscarTyping(false); lastOscarIdRef.current = null; }, []);
  const handleOscarError = useCallback((error: string) => { setOscarTyping(false); lastOscarIdRef.current = null; toast.error(error); }, []);
  const { sendMessage: sendToOscar } = useMistralChat({ onDelta: handleOscarDelta, onDone: handleOscarDone, onError: handleOscarError, userId: user?.id });

  const handleOscarSend = (text: string) => {
    if (!text.trim()) return;
    setOscarMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: text.trim() }]);
    setOscarTyping(true);
    setOscarInput("");
    sendToOscar(`[Contexte: senior pose une question administrative dans Oscar. Réponds simplement, clairement, sans jargon, en vouvoyant.]\n\n${text.trim()}`);
  };

  useEffect(() => { oscarEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [oscarMessages, oscarTyping]);

  const handleWriteDelta = useCallback((token: string) => { setGeneratedText(prev => prev + token); }, []);
  const handleWriteDone = useCallback(() => { setIsGenerating(false); setWriteView("result"); toast.success("Votre texte est prêt !"); }, []);
  const handleWriteError = useCallback((error: string) => { setIsGenerating(false); toast.error(error || "Impossible de générer le texte."); }, []);
  const { sendMessage: sendForWrite } = useMistralChat({ onDelta: handleWriteDelta, onDone: handleWriteDone, onError: handleWriteError, userId: user?.id });

  const handleSelectTemplate = (template: DemarcheTemplate) => {
    setSelectedTemplate(template);
    setCurrentQuestionIndex(0);
    setFields({});
    setGeneratedText("");
    setWriteView("form");
    setView("write");
  };

  const currentQuestion = selectedTemplate?.questions[currentQuestionIndex];

  const handleAnswerSubmit = (value: string) => {
    if (!currentQuestion || !selectedTemplate) return;
    const newFields = { ...fields, [currentQuestion.key]: value };
    setFields(newFields);
    if (currentQuestionIndex < selectedTemplate.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsGenerating(true);
      setGeneratedText("");
      sendForWrite(buildPrompt(selectedTemplate, newFields));
    }
  };

  const handleWriteBack = () => {
    if (writeView === "form" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (writeView === "result") {
      setWriteView("list");
    } else {
      setView("dashboard");
      setWriteView("list");
      setSelectedTemplate(null);
    }
  };

  const handleSaveDocument = () => {
    if (!selectedTemplate || !generatedText) return;
    const doc: SavedDocument = {
      id: Date.now().toString(),
      senior_id: user?.id || "",
      type: selectedTemplate.id,
      content: generatedText,
      subject: selectedTemplate.label,
      recipient: fields.destinataire || fields.entreprise || fields.mairie || fields.organisme || "",
      created_at: new Date().toISOString(),
      status: "sauvegarde" as DocumentStatus,
    };
    setSavedDocuments(prev => [doc, ...prev]);
    toast.success("Document sauvegardé !");
  };

  const handleCreateTask = async (templateId: string) => {
    await createTaskFromTemplate(templateId);
    setShowTaskForm(false);
  };

  const handleAskOscar = (context: string) => {
    setView("chat");
    setTimeout(() => handleOscarSend(context), 300);
  };

  const currentMonth = new Date().getMonth() + 1;
  const monthlyAlerts = MONTHLY_CONTEXT[currentMonth] || [];

  const showBack = view !== "dashboard";
  const handleBack = () => {
    if (view === "write") handleWriteBack();
    else setView("dashboard");
  };

  const headerTitle: Record<ViewMode, string> = {
    dashboard: "Démarches",
    write: "Écrire un courrier",
    chat: "Demander à Oscar",
    tasks: "Mes démarches",
    droits: "Mes droits & aides",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#F4F7F5" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 flex-shrink-0"
        style={{ padding: "16px 20px 14px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        {showBack && (
          <button onClick={handleBack} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "6px 8px 6px 0" }} aria-label="Retour">
            <ArrowLeft className="w-5 h-5" style={{ color: "#1A1E35" }} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{headerTitle[view]}</h1>
          {view === "dashboard" && <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Votre assistant administratif</p>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "dashboard" && (
          <Dashboard
            monthlyAlerts={monthlyAlerts}
            inProgressTasks={inProgressTasks}
            tasksLoading={tasksLoading}
            onGoToWrite={() => setView("write")}
            onGoToTasks={() => setView("tasks")}
            onGoToDroits={() => setView("droits")}
            onAskOscar={handleAskOscar}
            onSelectTemplate={handleSelectTemplate}
            onUpdateStep={updateTaskStep}
            onDeleteTask={deleteTask}
          />
        )}
        {view === "write" && (
          <WriteSection
            writeView={writeView}
            selectedTemplate={selectedTemplate}
            currentQuestion={currentQuestion || null}
            currentQuestionIndex={currentQuestionIndex}
            fields={fields}
            generatedText={generatedText}
            isGenerating={isGenerating}
            savedDocuments={savedDocuments}
            onSelectTemplate={handleSelectTemplate}
            onAnswerSubmit={handleAnswerSubmit}
            onSave={handleSaveDocument}
            onDeleteDocument={(id) => setSavedDocuments(prev => prev.filter(d => d.id !== id))}
            onNewDemarche={() => { setWriteView("list"); setSelectedTemplate(null); }}
          />
        )}
        {view === "chat" && (
          <OscarChat messages={oscarMessages} input={oscarInput} typing={oscarTyping} endRef={oscarEndRef} onInputChange={setOscarInput} onSend={handleOscarSend} />
        )}
        {view === "tasks" && (
          <TasksView
            tasks={tasks} loading={tasksLoading} inProgressTasks={inProgressTasks} templates={templates}
            showTaskForm={showTaskForm} onShowTaskForm={setShowTaskForm} onCreateTask={handleCreateTask}
            onUpdateStep={updateTaskStep} onDeleteTask={deleteTask} onAskOscar={handleAskOscar}
          />
        )}
        {view === "droits" && <DroitsView onAskOscar={handleAskOscar} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: "#1EB89A" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.6px", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function ActionCard({ icon, label, sublabel, color, badge, onClick }: { icon: React.ReactNode; label: string; sublabel: string; color: string; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-4 rounded-2xl transition-all active:scale-[0.97] relative"
      style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "left", minHeight: 100, width: "100%" }}
    >
      {badge !== undefined && (
        <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "white", borderRadius: 99, width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
      )}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1E35", margin: 0, lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0", lineHeight: 1.4 }}>{sublabel}</p>
      </div>
    </button>
  );
}

function PillBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{ border: "none", cursor: "pointer", background: active ? "#1A1E35" : "white", color: active ? "white" : "#64748B", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {label}
    </button>
  );
}

function BigBtn({ icon, label, subtitle, onClick, primary }: { icon: React.ReactNode; label: string; subtitle?: string; onClick: () => void; primary: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] flex-1"
      style={{ border: "none", cursor: "pointer", textAlign: "left", minHeight: 52, fontSize: 14, fontWeight: 600, background: primary ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white", color: primary ? "white" : "#1A1E35", boxShadow: primary ? "0 4px 16px rgba(30,184,154,0.3)" : "0 1px 4px rgba(0,0,0,0.08)" }}>
      {icon}
      <div><span>{label}</span>{subtitle && <p style={{ fontSize: 11, opacity: 0.8, margin: "2px 0 0", fontWeight: 400 }}>{subtitle}</p>}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

function Dashboard({ monthlyAlerts, inProgressTasks, tasksLoading, onGoToWrite, onGoToTasks, onGoToDroits, onAskOscar, onSelectTemplate, onUpdateStep, onDeleteTask }: {
  monthlyAlerts: { title: string; description: string; icon: string; urgency: "high" | "medium" | "low" }[];
  inProgressTasks: { id: string; title: string; description: string | null; category: string; status: string; due_date: string | null; steps: { id: number; title: string; description: string; completed: boolean }[]; current_step: number; created_at: string }[];
  tasksLoading: boolean;
  onGoToWrite: () => void;
  onGoToTasks: () => void;
  onGoToDroits: () => void;
  onAskOscar: (ctx: string) => void;
  onSelectTemplate: (t: DemarcheTemplate) => void;
  onUpdateStep: (taskId: string, stepId: number, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const monthNames = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const currentMonthName = monthNames[new Date().getMonth()];

  return (
    <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 36 }}>

      {/* Fil d'actualité — Ce mois-ci */}
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
                  <button onClick={() => onAskOscar(`${alert.title} : ${alert.description}. Explique-moi les étapes à suivre.`)}
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

      {/* Actions rapides */}
      <div>
        <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Que voulez-vous faire ?" />
        <div className="grid grid-cols-2 gap-2.5">
          <ActionCard icon={<PenLine className="w-6 h-6" />} label="Écrire un courrier" sublabel="Réclamation, demande, résiliation..." color="#1EB89A" onClick={onGoToWrite} />
          <ActionCard icon={<ListChecks className="w-6 h-6" />} label="Mes démarches" sublabel="Suivre mes dossiers en cours" color="#3B82F6" badge={inProgressTasks.length > 0 ? inProgressTasks.length : undefined} onClick={onGoToTasks} />
          <ActionCard icon={<BookOpen className="w-6 h-6" />} label="Mes droits & aides" sublabel="APL, retraite, APA, allocations..." color="#8B5CF6" onClick={onGoToDroits} />
        </div>
        <button
          onClick={() => onAskOscar("Bonjour Oscar, j'ai une question administrative.")}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl transition-all active:scale-[0.98]"
          style={{ border: "1px solid rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.04)", cursor: "pointer" }}
        >
          <MessageCircle className="w-4 h-4" style={{ color: "#2DD4BF" }} />
          <span style={{ fontSize: 13, color: "#64748B" }}>Oscar peut aussi vous aider sur vos démarches</span>
          <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />
        </button>

      {/* Démarches en cours */}
      {!tasksLoading && inProgressTasks.length > 0 && (
        <div>
          <SectionTitle icon={<AlertCircle className="w-4 h-4" />} label="En cours" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inProgressTasks.slice(0, 2).map(task => (
              <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} onAskOscar={onAskOscar} />
            ))}
            {inProgressTasks.length > 2 && (
              <button onClick={onGoToTasks} className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                style={{ border: "1.5px dashed rgba(30,184,154,0.3)", background: "transparent", cursor: "pointer", color: "#1EB89A", fontSize: 14, fontWeight: 600 }}>
                Voir toutes les démarches ({inProgressTasks.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modèles de courriers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle icon={<FileText className="w-4 h-4" />} label="Modèles de courriers" />
          <button onClick={onGoToWrite} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#1EB89A", fontWeight: 600, padding: 0, marginBottom: 12 }}>
            Tous voir
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DEMARCHE_TEMPLATES.slice(0, 4).map(template => (
            <button key={template.id} onClick={() => onSelectTemplate(template)}
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

      {/* Aides disponibles */}
      <div>
        <SectionTitle icon={<BookOpen className="w-4 h-4" />} label="Aides disponibles" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SOCIAL_AIDS.slice(0, 3).map(aid => <AidCard key={aid.id} aid={aid} onAskOscar={onAskOscar} />)}
          <button onClick={onGoToDroits} className="flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ border: "1.5px dashed rgba(30,184,154,0.3)", background: "transparent", cursor: "pointer", color: "#1EB89A", fontSize: 14, fontWeight: 600 }}>
            Voir toutes les aides <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WRITE SECTION
// ═══════════════════════════════════════════════════════════

function WriteSection({ writeView, selectedTemplate, currentQuestion, currentQuestionIndex, fields, generatedText, isGenerating, savedDocuments, onSelectTemplate, onAnswerSubmit, onSave, onDeleteDocument, onNewDemarche }: {
  writeView: WriteView; selectedTemplate: DemarcheTemplate | null; currentQuestion: DemarcheTemplate["questions"][number] | null;
  currentQuestionIndex: number; fields: DemarcheFields; generatedText: string; isGenerating: boolean; savedDocuments: SavedDocument[];
  onSelectTemplate: (t: DemarcheTemplate) => void; onAnswerSubmit: (v: string) => void; onSave: () => void; onDeleteDocument: (id: string) => void; onNewDemarche: () => void;
}) {
  const [showSaved, setShowSaved] = useState(false);

  if (writeView === "list") return (
    <div className="px-4 py-4">
      <div className="flex gap-2 mb-4">
        <PillBtn label="Nouveau courrier" active={!showSaved} onClick={() => setShowSaved(false)} />
        <PillBtn label={`Sauvegardés (${savedDocuments.length})`} active={showSaved} onClick={() => setShowSaved(true)} />
      </div>
      {showSaved ? <DocumentsList documents={savedDocuments} onDelete={onDeleteDocument} /> : <TemplateList onSelect={onSelectTemplate} />}
    </div>
  );

  if (writeView === "form" && selectedTemplate && currentQuestion) return (
    <div className="px-4 py-4">
      <QuestionForm template={selectedTemplate} question={currentQuestion} questionIndex={currentQuestionIndex} totalQuestions={selectedTemplate.questions.length} onSubmit={onAnswerSubmit} isGenerating={isGenerating} />
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="flex gap-1.5 items-center">
            {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
          </div>
          <p style={{ fontSize: 16, color: "#1A1E35", fontWeight: 500 }}>Oscar rédige votre texte...</p>
          {generatedText && <div className="w-full rounded-2xl p-4 mt-2" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}><p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{generatedText}</p></div>}
        </div>
      )}
    </div>
  );

  if (writeView === "result" && selectedTemplate) return (
    <div className="px-4 py-4"><ResultView text={generatedText} template={selectedTemplate} fields={fields} onSave={onSave} onNewDemarche={onNewDemarche} /></div>
  );

  return null;
}

function TemplateList({ onSelect }: { onSelect: (t: DemarcheTemplate) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {DEMARCHE_TEMPLATES.map(template => (
        <button key={template.id} onClick={() => onSelect(template)} className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left", width: "100%" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,184,154,0.1)", color: "#1EB89A" }}>
            {ICON_MAP[template.icon] || <FileText className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{template.label}</p>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>{template.description}</p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "#CBD5E1" }} />
        </button>
      ))}
    </div>
  );
}

function QuestionForm({ template, question, questionIndex, totalQuestions, onSubmit, isGenerating }: { template: DemarcheTemplate; question: DemarcheTemplate["questions"][number]; questionIndex: number; totalQuestions: number; onSubmit: (v: string) => void; isGenerating: boolean }) {
  const [value, setValue] = useState("");
  const handleSubmit = () => { if (!value.trim()) { toast.error("Veuillez répondre à la question"); return; } onSubmit(value.trim()); setValue(""); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey && question.type !== "textarea") { e.preventDefault(); handleSubmit(); } };
  if (isGenerating) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 8, paddingBottom: 8 }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((questionIndex+1)/totalQuestions)*100}%`, background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" }} />
        </div>
        <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{questionIndex+1}/{totalQuestions}</span>
      </div>
      <p style={{ fontSize: 13, color: "#1EB89A", fontWeight: 600, margin: 0 }}>{template.label}</p>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1A1E35", lineHeight: 1.3, margin: 0 }}>{question.label}</h2>
      {question.type === "textarea" ? (
        <textarea value={value} onChange={e => setValue(e.target.value)} placeholder={question.placeholder} rows={4} autoFocus className="w-full rounded-2xl p-4 text-base outline-none resize-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, lineHeight: 1.6, color: "#1A1E35", background: "white" }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }} onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }} />
      ) : question.type === "date" ? (
        <input type="date" value={value} onChange={e => setValue(e.target.value)} autoFocus className="w-full rounded-2xl p-4 text-base outline-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, color: "#1A1E35", background: "white", minHeight: 52 }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }} onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }} />
      ) : (
        <input type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={question.placeholder} autoFocus className="w-full rounded-2xl p-4 text-base outline-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, color: "#1A1E35", background: "white", minHeight: 52 }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }} onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }} />
      )}
      <button onClick={handleSubmit} disabled={!value.trim()} className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ border: "none", cursor: value.trim() ? "pointer" : "default", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)", boxShadow: "0 4px 16px rgba(30,184,154,0.3)", fontSize: 16, minHeight: 52 }}>
        {questionIndex < totalQuestions-1 ? "Continuer" : "Générer le texte"}
      </button>
    </div>
  );
}

function ResultView({ text, template, fields, onSave, onNewDemarche }: { text: string; template: DemarcheTemplate; fields: DemarcheFields; onSave: () => void; onNewDemarche: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Texte copié !"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Impossible de copier"); } };
  const recipient = fields.destinataire || fields.entreprise || fields.mairie || fields.organisme || "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.1)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1EB89A" }}><FileText className="w-5 h-5 text-white" /></div>
        <div><p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Votre texte est prêt !</p><p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{template.label}{recipient ? ` — ${recipient}` : ""}</p></div>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
      <BigBtn icon={<Mail className="w-5 h-5" />} label="Ouvrir dans mes emails" subtitle="Le texte sera pré-rempli" onClick={() => openMailtoLink({ subject: template.label, body: text })} primary />
      <div className="flex gap-3">
        <BigBtn icon={<FileText className="w-5 h-5" />} label={copied ? "Copié !" : "Copier"} onClick={handleCopy} primary={false} />
        <BigBtn icon={<Download className="w-5 h-5" />} label="PDF" onClick={() => downloadDocument(template.id, text, template.label)} primary={false} />
        <BigBtn icon={<FileText className="w-5 h-5" />} label="Sauvegarder" onClick={onSave} primary={false} />
      </div>
      <button onClick={onNewDemarche} className="w-full py-3 rounded-2xl text-sm font-medium"
        style={{ border: "2px solid #E2E8F0", background: "transparent", color: "#64748B", cursor: "pointer" }}>
        Écrire un autre courrier
      </button>
    </div>
  );
}

function DocumentsList({ documents, onDelete }: { documents: SavedDocument[]; onDelete: (id: string) => void }) {
  if (documents.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}><FileText className="w-8 h-8" style={{ color: "#1EB89A" }} /></div>
      <p style={{ fontSize: 16, color: "#64748B", textAlign: "center" }}>Aucun courrier sauvegardé.<br />Vos courriers apparaîtront ici.</p>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {documents.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,184,154,0.1)", color: "#1EB89A" }}><FileText className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }} className="truncate">{doc.subject}</p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }} className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => openMailtoLink({ subject: doc.subject, body: doc.content })} className="p-2 rounded-xl" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1EB89A" }}><Mail className="w-4 h-4" /></button>
            <button onClick={() => downloadDocument(doc.type, doc.content, doc.subject)} className="p-2 rounded-xl" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }}><Download className="w-4 h-4" /></button>
            <button onClick={() => onDelete(doc.id)} className="p-2 rounded-xl" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASKS VIEW
// ═══════════════════════════════════════════════════════════

function TasksView({ tasks, loading, inProgressTasks, templates, showTaskForm, onShowTaskForm, onCreateTask, onUpdateStep, onDeleteTask, onAskOscar }: {
  tasks: { id: string; title: string; description: string | null; category: string; status: string; due_date: string | null; steps: { id: number; title: string; description: string; completed: boolean }[]; current_step: number; created_at: string }[];
  loading: boolean;
  inProgressTasks: typeof tasks;
  templates: { id: string; title: string; description: string; category: string; steps: { id: number; title: string; description: string; completed: boolean }[]; estimatedDays: number }[];
  showTaskForm: boolean;
  onShowTaskForm: (v: boolean) => void;
  onCreateTask: (id: string) => void;
  onUpdateStep: (taskId: string, stepId: number, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onAskOscar: (ctx: string) => void;
}) {
  return (
    <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      {!showTaskForm ? (
        <button onClick={() => onShowTaskForm(true)} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98]"
          style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)", color: "white", boxShadow: "0 4px 16px rgba(30,184,154,0.3)", minHeight: 52 }}>
          <Plus className="w-5 h-5" /> Nouvelle démarche
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Choisir une démarche</p>
            <button onClick={() => onShowTaskForm(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#94A3B8" }} /></button>
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
                      <button key={tmpl.id} onClick={() => onCreateTask(tmpl.id)} className="w-full text-left p-3 rounded-xl"
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

      {loading ? (
        <div className="text-center py-8" style={{ color: "#94A3B8" }}>Chargement...</div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}><ListChecks className="w-8 h-8" style={{ color: "#1EB89A" }} /></div>
          <p style={{ fontSize: 16, color: "#64748B", textAlign: "center" }}>Aucune démarche en cours.<br />Lancez votre première démarche !</p>
        </div>
      ) : (
        <>
          {inProgressTasks.length > 0 && (
            <div><SectionTitle icon={<AlertCircle className="w-4 h-4" />} label="En cours" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inProgressTasks.map(task => <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} onAskOscar={onAskOscar} />)}
              </div>
            </div>
          )}
          {tasks.filter(t => t.status === "not_started").length > 0 && (
            <div><SectionTitle icon={<CalendarDays className="w-4 h-4" />} label="À commencer" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.filter(t => t.status === "not_started").map(task => <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} onAskOscar={onAskOscar} />)}
              </div>
            </div>
          )}
          {tasks.filter(t => t.status === "done").length > 0 && (
            <div><SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Terminées" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.filter(t => t.status === "done").map(task => <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DROITS VIEW
// ═══════════════════════════════════════════════════════════

function DroitsView({ onAskOscar }: { onAskOscar: (ctx: string) => void }) {
  return (
    <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 32 }}>
      <div className="p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.08)", border: "1px solid rgba(30,184,154,0.15)" }}>
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 flex-shrink-0" style={{ color: "#1EB89A" }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Oscar vérifie vos droits</p>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 12px" }}>Oscar peut analyser votre situation et vous indiquer les aides auxquelles vous avez droit.</p>
            <button onClick={() => onAskOscar("Quelles aides sociales sont disponibles pour les seniors ? Vérifie mon éligibilité et explique-moi comment les demander.")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white", boxShadow: "0 2px 8px rgba(30,184,154,0.3)" }}>
              <MessageCircle className="w-4 h-4" /> Vérifier mes droits avec Oscar
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle icon={<BookOpen className="w-4 h-4" />} label="Guides thématiques" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RIGHTS_GUIDES.map(guide => (
            <button key={guide.id}
              onClick={() => onAskOscar(`Explique-moi en détail : ${guide.title}. Comment en bénéficier, qui peut y prétendre, et quels documents préparer ?`)}
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

      <div>
        <SectionTitle icon={<Sparkles className="w-4 h-4" />} label="Toutes les aides disponibles" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SOCIAL_AIDS.map(aid => <AidCard key={aid.id} aid={aid} onAskOscar={onAskOscar} />)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OSCAR CHAT
// ═══════════════════════════════════════════════════════════

function OscarChat({ messages, input, typing, endRef, onInputChange, onSend }: {
  messages: { id: string; role: "user" | "assistant"; content: string }[];
  input: string; typing: boolean; endRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void; onSend: (text: string) => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); } };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}><MessageCircle className="w-7 h-7" style={{ color: "#1EB89A" }} /></div>
            <p style={{ fontSize: 15, color: "#64748B", textAlign: "center" }}>Posez une question à Oscar sur vos démarches administratives</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              {OSCAR_SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => onSend(s)} className="w-full p-3 rounded-xl text-left text-sm transition-all active:scale-[0.98]"
                  style={{ border: "1px solid rgba(30,184,154,0.2)", background: "white", cursor: "pointer", color: "#1A1E35" }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%] px-3.5 py-2.5"
              style={{ borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", background: msg.role === "user" ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white", color: msg.role === "user" ? "white" : "#1A1E35", boxShadow: msg.role === "user" ? "0 2px 8px rgba(30,184,154,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5" style={{ borderRadius: "18px 18px 18px 4px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex gap-1.5 items-center py-0.5">
                {[0,1,2].map(i => <div key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={e => onInputChange(e.target.value)} onKeyDown={handleKey} placeholder="Posez votre question..."
            className="flex-1 rounded-2xl px-4 py-3 outline-none"
            style={{ border: "2px solid #E2E8F0", fontSize: 15, color: "#1A1E35", background: "white", minHeight: 48 }}
            onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }} onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }} />
          <button onClick={() => onSend(input)} disabled={!input.trim()} className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
            style={{ border: "none", cursor: input.trim() ? "pointer" : "default", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" }}>
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
