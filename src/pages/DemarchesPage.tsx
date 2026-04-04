import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  FileWarning, Building2, FileX2, Heart, ShieldCheck, PenLine,
  FileText, ChevronRight, ArrowLeft, Clock, Mail, Download, Trash2,
  MessageCircle, Lightbulb, BookOpen, ListChecks, Send, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DEMARCHE_TEMPLATES, buildPrompt, downloadDocument } from "@/lib/documentService";
import { openMailtoLink } from "@/lib/mailtoHelper";
import { useMistralChat } from "@/hooks/useMistralChat";
import { useAuth } from "@/hooks/useAuth";
import { useAdminTasks } from "@/hooks/useAdminTasks";
import { TaskCard } from "@/components/documents/TaskCard";
import { RightsGuideCard } from "@/components/documents/RightsGuideCard";
import { AidCard } from "@/components/documents/AidCard";
import { AdminTipCard } from "@/components/documents/AdminTipCard";
import { TASK_CATEGORIES, SOCIAL_AIDS, RIGHTS_GUIDES, ADMIN_TIPS } from "@/components/documents/TaskTemplates";
import type { DemarcheTemplate, DemarcheFields, SavedDocument, DocumentStatus } from "@/types/demarches";

// Icon mapping for letter templates
const ICON_MAP: Record<string, React.ReactNode> = {
  FileWarning: <FileWarning className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  FileX2: <FileX2 className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  PenLine: <PenLine className="w-6 h-6" />,
};

type SectionId = "accueil" | "ecrire" | "demarches" | "droits" | "oscar";
type WriteView = "list" | "form" | "result";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "accueil", label: "Accueil", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "ecrire", label: "Écrire", icon: <PenLine className="w-4 h-4" /> },
  { id: "demarches", label: "Démarches", icon: <ListChecks className="w-4 h-4" /> },
  { id: "droits", label: "Mes droits", icon: <BookOpen className="w-4 h-4" /> },
  { id: "oscar", label: "Oscar", icon: <MessageCircle className="w-4 h-4" /> },
];

const OSCAR_SUGGESTIONS = [
  "Quelles aides pour moi ?",
  "Comment déclarer mes impôts ?",
  "Comment renouveler ma carte vitale ?",
];

export function DemarchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>("accueil");

  // ─── Write section state ───
  const [writeView, setWriteView] = useState<WriteView>("list");
  const [selectedTemplate, setSelectedTemplate] = useState<DemarcheTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fields, setFields] = useState<DemarcheFields>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

  // ─── Démarches (tasks) ───
  const { tasks, loading: tasksLoading, createTaskFromTemplate, updateTaskStep, deleteTask, getInProgressTasks, templates } = useAdminTasks();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const inProgressTasks = getInProgressTasks();

  // ─── Oscar mini chat ───
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

  const handleOscarDone = useCallback(() => {
    setOscarTyping(false);
    lastOscarIdRef.current = null;
  }, []);

  const handleOscarError = useCallback((error: string) => {
    setOscarTyping(false);
    lastOscarIdRef.current = null;
    toast.error(error);
  }, []);

  const { sendMessage: sendToOscar } = useMistralChat({
    onDelta: handleOscarDelta,
    onDone: handleOscarDone,
    onError: handleOscarError,
    userId: user?.id,
  });

  const handleOscarSend = (text: string) => {
    if (!text.trim()) return;
    setOscarMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: text.trim() }]);
    setOscarTyping(true);
    setOscarInput("");
    sendToOscar(`[Contexte: le senior pose une question administrative depuis l'onglet Démarches d'Oscar. Réponds de façon simple et claire, sans jargon.]\n\n${text.trim()}`);
  };

  useEffect(() => {
    oscarEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [oscarMessages, oscarTyping]);

  // ─── Write section: text generation ───
  const handleWriteDelta = useCallback((token: string) => {
    setGeneratedText(prev => prev + token);
  }, []);

  const handleWriteDone = useCallback(() => {
    setIsGenerating(false);
    setWriteView("result");
    toast.success("Votre texte est prêt !");
  }, []);

  const handleWriteError = useCallback((error: string) => {
    setIsGenerating(false);
    toast.error(error || "Impossible de générer le texte.");
  }, []);

  const { sendMessage: sendForWrite } = useMistralChat({
    onDelta: handleWriteDelta,
    onDone: handleWriteDone,
    onError: handleWriteError,
    userId: user?.id,
  });

  // ─── Write handlers ───
  const handleSelectTemplate = (template: DemarcheTemplate) => {
    setSelectedTemplate(template);
    setCurrentQuestionIndex(0);
    setFields({});
    setGeneratedText("");
    setWriteView("form");
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
    } else {
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
    // Xano: POST /saved_documents { senior_id, type, content, subject, recipient, status }
  };

  const handleDeleteDocument = (docId: string) => {
    setSavedDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success("Document supprimé");
  };

  const handleCreateTask = async (templateId: string) => {
    await createTaskFromTemplate(templateId);
    setShowTaskForm(false);
  };

  const handleAskOscar = (context: string) => {
    setActiveSection("oscar");
    setTimeout(() => handleOscarSend(context), 300);
  };

  // Tips for current month
  const currentMonth = new Date().getMonth() + 1;
  const relevantTips = useMemo(() => {
    return ADMIN_TIPS.filter(tip => tip.month === currentMonth || tip.season === "all").slice(0, 4);
  }, [currentMonth]);

  const showBackButton = activeSection === "ecrire" && (writeView === "form" || writeView === "result");

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#F4F7F5" }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          padding: "16px 20px 14px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        {showBackButton && (
          <button onClick={handleWriteBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer" }} aria-label="Retour">
            <ArrowLeft className="w-5 h-5" style={{ color: "#1A1E35" }} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Démarches</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Votre assistant administratif</p>
        </div>
      </header>

      {/* Tab pills — horizontally scrollable */}
      {!(activeSection === "ecrire" && writeView !== "list") && (
        <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap"
              style={{
                border: "none",
                cursor: "pointer",
                background: activeSection === s.id ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white",
                color: activeSection === s.id ? "white" : "#64748B",
                boxShadow: activeSection === s.id ? "0 2px 8px rgba(30, 184, 154, 0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
                fontSize: 13,
              }}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "accueil" && (
          <AccueilSection
            inProgressCount={inProgressTasks.length}
            savedDocsCount={savedDocuments.length}
            tips={relevantTips}
            onAskOscar={handleAskOscar}
            onGoToWrite={() => setActiveSection("ecrire")}
            onGoToDemarches={() => setActiveSection("demarches")}
          />
        )}

        {activeSection === "ecrire" && (
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
            onDeleteDocument={handleDeleteDocument}
            onNewDemarche={() => { setWriteView("list"); setSelectedTemplate(null); }}
          />
        )}

        {activeSection === "demarches" && (
          <DemarchesSection
            tasks={tasks}
            loading={tasksLoading}
            inProgressTasks={inProgressTasks}
            templates={templates}
            showTaskForm={showTaskForm}
            onShowTaskForm={setShowTaskForm}
            onCreateTask={handleCreateTask}
            onUpdateStep={updateTaskStep}
            onDeleteTask={deleteTask}
            onAskOscar={handleAskOscar}
          />
        )}

        {activeSection === "droits" && (
          <DroitsSection onAskOscar={handleAskOscar} />
        )}

        {activeSection === "oscar" && (
          <OscarMiniChat
            messages={oscarMessages}
            input={oscarInput}
            typing={oscarTyping}
            endRef={oscarEndRef}
            onInputChange={setOscarInput}
            onSend={handleOscarSend}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ACCUEIL SECTION
// ═══════════════════════════════════════════════════════════

function AccueilSection({
  inProgressCount,
  savedDocsCount,
  tips,
  onAskOscar,
  onGoToWrite,
  onGoToDemarches,
}: {
  inProgressCount: number;
  savedDocsCount: number;
  tips: { id: string; title: string; description: string; icon: string; category: string; season?: string; month?: number; actionLabel?: string; actionUrl?: string }[];
  onAskOscar: (ctx: string) => void;
  onGoToWrite: () => void;
  onGoToDemarches: () => void;
}) {
  return (
    <div className="px-5 py-4 space-y-5">
      {/* Welcome */}
      <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(30,184,154,0.12) 0%, rgba(15,118,110,0.08) 100%)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1EB89A" }}>
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Bienvenue dans vos démarches</p>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>Oscar vous accompagne dans toutes vos questions administratives.</p>
            <button
              onClick={() => onAskOscar("Quelles démarches administratives dois-je faire en ce moment ?")}
              className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white", boxShadow: "0 2px 8px rgba(30,184,154,0.3)" }}
            >
              <MessageCircle className="w-4 h-4" />
              Demander à Oscar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={inProgressCount} label="En cours" color="#1EB89A" />
        <StatCard value={savedDocsCount} label="Courriers" color="#3B82F6" />
        <StatCard value={tips.length} label="Conseils" color="#F59E0B" />
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Actions rapides</p>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickAction icon={<PenLine className="w-5 h-5" />} label="Écrire un courrier" onClick={onGoToWrite} />
          <QuickAction icon={<ListChecks className="w-5 h-5" />} label="Mes démarches" onClick={onGoToDemarches} />
          <QuickAction icon={<BookOpen className="w-5 h-5" />} label="Mes droits" onClick={() => onAskOscar("Quelles aides sociales sont disponibles pour les seniors ?")} />
          <QuickAction icon={<FileText className="w-5 h-5" />} label="Impôts" onClick={() => onAskOscar("Comment faire ma déclaration d'impôts ?")} />
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>À savoir ce mois-ci</p>
          <div className="space-y-3">
            {tips.map(tip => (
              <AdminTipCard key={tip.id} tip={tip} onAskOscar={onAskOscar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="p-3 rounded-2xl text-center" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98]"
      style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left", width: "100%", color: "#1EB89A" }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1E35" }}>{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// WRITE SECTION (letters)
// ═══════════════════════════════════════════════════════════

function WriteSection({
  writeView, selectedTemplate, currentQuestion, currentQuestionIndex, fields,
  generatedText, isGenerating, savedDocuments,
  onSelectTemplate, onAnswerSubmit, onSave, onDeleteDocument, onNewDemarche,
}: {
  writeView: WriteView;
  selectedTemplate: DemarcheTemplate | null;
  currentQuestion: DemarcheTemplate["questions"][number] | null;
  currentQuestionIndex: number;
  fields: DemarcheFields;
  generatedText: string;
  isGenerating: boolean;
  savedDocuments: SavedDocument[];
  onSelectTemplate: (t: DemarcheTemplate) => void;
  onAnswerSubmit: (v: string) => void;
  onSave: () => void;
  onDeleteDocument: (id: string) => void;
  onNewDemarche: () => void;
}) {
  const [showSaved, setShowSaved] = useState(false);

  if (writeView === "list") {
    return (
      <div className="px-5 py-4">
        {/* Toggle: templates vs saved */}
        <div className="flex gap-2 mb-4">
          <PillButton label="Nouveau courrier" active={!showSaved} onClick={() => setShowSaved(false)} />
          <PillButton label={`Sauvegardés (${savedDocuments.length})`} active={showSaved} onClick={() => setShowSaved(true)} />
        </div>
        {showSaved ? (
          <DocumentsList documents={savedDocuments} onDelete={onDeleteDocument} />
        ) : (
          <TemplateList onSelect={onSelectTemplate} />
        )}
      </div>
    );
  }

  if (writeView === "form" && selectedTemplate && currentQuestion) {
    return (
      <div className="px-5 py-4">
        <QuestionForm
          template={selectedTemplate}
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={selectedTemplate.questions.length}
          onSubmit={onAnswerSubmit}
          isGenerating={isGenerating}
        />
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p style={{ fontSize: 16, color: "#1A1E35", fontWeight: 500 }}>Oscar rédige votre texte...</p>
            {generatedText && (
              <div className="w-full rounded-2xl p-4 mt-2" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{generatedText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (writeView === "result" && selectedTemplate) {
    return (
      <div className="px-5 py-4">
        <ResultView text={generatedText} template={selectedTemplate} fields={fields} onSave={onSave} onNewDemarche={onNewDemarche} />
      </div>
    );
  }

  return null;
}

function PillButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        border: "none", cursor: "pointer",
        background: active ? "#1A1E35" : "white",
        color: active ? "white" : "#64748B",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {label}
    </button>
  );
}

function TemplateList({ onSelect }: { onSelect: (t: DemarcheTemplate) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: 15, color: "#64748B", marginBottom: 4 }}>Choisissez le type de courrier :</p>
      {DEMARCHE_TEMPLATES.map(template => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ border: "none", cursor: "pointer", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left", width: "100%" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,184,154,0.1)", color: "#1EB89A" }}>
            {ICON_MAP[template.icon] || <FileText className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{template.label}</p>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>{template.description}</p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "#CBD5E1" }} />
        </button>
      ))}
    </div>
  );
}

function QuestionForm({ template, question, questionIndex, totalQuestions, onSubmit, isGenerating }: {
  template: DemarcheTemplate;
  question: DemarcheTemplate["questions"][number];
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (v: string) => void;
  isGenerating: boolean;
}) {
  const [value, setValue] = useState("");
  const handleSubmit = () => {
    if (!value.trim()) { toast.error("Veuillez répondre à la question"); return; }
    onSubmit(value.trim());
    setValue("");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && question.type !== "textarea") { e.preventDefault(); handleSubmit(); }
  };
  if (isGenerating) return null;
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%`, background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" }} />
        </div>
        <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{questionIndex + 1}/{totalQuestions}</span>
      </div>
      <p style={{ fontSize: 13, color: "#1EB89A", fontWeight: 600 }}>{template.label}</p>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1A1E35", lineHeight: 1.3, margin: 0 }}>{question.label}</h2>
      {question.type === "textarea" ? (
        <textarea value={value} onChange={e => setValue(e.target.value)} placeholder={question.placeholder} rows={4} autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none resize-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, lineHeight: 1.6, color: "#1A1E35", background: "white" }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      ) : question.type === "date" ? (
        <input type="date" value={value} onChange={e => setValue(e.target.value)} autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, color: "#1A1E35", background: "white", minHeight: 52 }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      ) : (
        <input type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={question.placeholder} autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none"
          style={{ border: "2px solid #E2E8F0", fontSize: 16, color: "#1A1E35", background: "white", minHeight: 52 }}
          onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      )}
      <button onClick={handleSubmit} disabled={!value.trim()}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ border: "none", cursor: value.trim() ? "pointer" : "default", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)", boxShadow: "0 4px 16px rgba(30,184,154,0.3)", fontSize: 16, minHeight: 52 }}
      >
        {questionIndex < totalQuestions - 1 ? "Continuer" : "Générer le texte"}
      </button>
    </div>
  );
}

function ResultView({ text, template, fields, onSave, onNewDemarche }: {
  text: string; template: DemarcheTemplate; fields: DemarcheFields; onSave: () => void; onNewDemarche: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Texte copié !"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Impossible de copier"); }
  };
  const handleEmail = () => { openMailtoLink({ subject: template.label, body: text }); toast.success("Votre texte est prêt. Appuyez sur Envoyer dans votre application email."); };
  const handlePdf = () => { downloadDocument(template.id, text, template.label); toast.success("Document téléchargé !"); };
  const recipient = fields.destinataire || fields.entreprise || fields.mairie || fields.organisme || "";

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.1)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1EB89A" }}>
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Votre texte est prêt !</p>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{template.label}{recipient ? ` — ${recipient}` : ""}</p>
        </div>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
      <div className="flex flex-col gap-3">
        <BigBtn icon={<Mail className="w-5 h-5" />} label="Ouvrir dans mes emails" subtitle="Le texte sera pré-rempli" onClick={handleEmail} primary />
        <div className="flex gap-3">
          <BigBtn icon={<FileText className="w-5 h-5" />} label={copied ? "Copié !" : "Copier le texte"} onClick={handleCopy} primary={false} />
          <BigBtn icon={<Download className="w-5 h-5" />} label="Télécharger en PDF" onClick={handlePdf} primary={false} />
        </div>
        <BigBtn icon={<FileText className="w-5 h-5" />} label="Sauvegarder" onClick={onSave} primary={false} />
        <button onClick={onNewDemarche} className="w-full py-3 rounded-2xl text-sm font-medium transition-all" style={{ border: "2px solid #E2E8F0", background: "transparent", color: "#64748B", cursor: "pointer", fontSize: 14 }}>
          Écrire un autre courrier
        </button>
      </div>
    </div>
  );
}

function BigBtn({ icon, label, subtitle, onClick, primary }: { icon: React.ReactNode; label: string; subtitle?: string; onClick: () => void; primary: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] flex-1"
      style={{
        border: "none", cursor: "pointer", textAlign: "left", minHeight: 52, fontSize: 15, fontWeight: 600,
        background: primary ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white",
        color: primary ? "white" : "#1A1E35",
        boxShadow: primary ? "0 4px 16px rgba(30,184,154,0.3)" : "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {icon}
      <div>
        <span>{label}</span>
        {subtitle && <p style={{ fontSize: 12, opacity: 0.8, margin: "2px 0 0", fontWeight: 400 }}>{subtitle}</p>}
      </div>
    </button>
  );
}

function DocumentsList({ documents, onDelete }: { documents: SavedDocument[]; onDelete: (id: string) => void }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}>
          <FileText className="w-8 h-8" style={{ color: "#1EB89A" }} />
        </div>
        <p style={{ fontSize: 16, color: "#64748B", textAlign: "center" }}>Aucun courrier sauvegardé.<br />Vos courriers apparaîtront ici.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {documents.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,184,154,0.1)", color: "#1EB89A" }}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }} className="truncate">{doc.subject}</p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }} className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => openMailtoLink({ subject: doc.subject, body: doc.content })} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1EB89A" }} aria-label="Email"><Mail className="w-4 h-4" /></button>
            <button onClick={() => downloadDocument(doc.type, doc.content, doc.subject)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }} aria-label="PDF"><Download className="w-4 h-4" /></button>
            <button onClick={() => onDelete(doc.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#EF4444" }} aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DÉMARCHES SECTION (task tracking)
// ═══════════════════════════════════════════════════════════

function DemarchesSection({ tasks, loading, inProgressTasks, templates, showTaskForm, onShowTaskForm, onCreateTask, onUpdateStep, onDeleteTask, onAskOscar }: {
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
    <div className="px-5 py-4 space-y-4">
      {!showTaskForm ? (
        <button
          onClick={() => onShowTaskForm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98]"
          style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)", color: "white", boxShadow: "0 4px 16px rgba(30,184,154,0.3)", minHeight: 52 }}
        >
          <Plus className="w-5 h-5" />
          Nouvelle démarche
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Choisir une démarche</p>
            <button onClick={() => onShowTaskForm(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#94A3B8" }} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {TASK_CATEGORIES.map(cat => {
              const catTemplates = templates.filter(t => t.category === cat.value);
              if (catTemplates.length === 0) return null;
              return (
                <div key={cat.value}>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1 sticky top-0 py-1" style={{ color: "#64748B", background: "white" }}>
                    <span>{cat.icon}</span> {cat.label}
                  </p>
                  <div className="space-y-2 mb-3">
                    {catTemplates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => onCreateTask(tmpl.id)}
                        className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        style={{ border: "1px solid #E2E8F0", background: "white", cursor: "pointer" }}
                      >
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#1A1E35" }}>{tmpl.title}</p>
                        <p style={{ fontSize: 12, color: "#94A3B8" }}>{tmpl.steps.length} étapes • ~{tmpl.estimatedDays} jours</p>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}>
            <ListChecks className="w-8 h-8" style={{ color: "#1EB89A" }} />
          </div>
          <p style={{ fontSize: 16, color: "#64748B", textAlign: "center" }}>Aucune démarche en cours.<br />Lancez votre première démarche !</p>
        </div>
      ) : (
        <>
          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>En cours</p>
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} onAskOscar={onAskOscar} />
              ))}
            </div>
          )}
          {tasks.filter(t => t.status === "not_started").length > 0 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>À commencer</p>
              {tasks.filter(t => t.status === "not_started").map(task => (
                <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} onAskOscar={onAskOscar} />
              ))}
            </div>
          )}
          {tasks.filter(t => t.status === "done").length > 0 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Terminées</p>
              {tasks.filter(t => t.status === "done").map(task => (
                <TaskCard key={task.id} task={task} onUpdateStep={onUpdateStep} onDelete={onDeleteTask} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DROITS SECTION
// ═══════════════════════════════════════════════════════════

function DroitsSection({ onAskOscar }: { onAskOscar: (ctx: string) => void }) {
  return (
    <div className="px-5 py-4 space-y-5">
      <div className="p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.08)" }}>
        <div className="flex items-start gap-3">
          <BookOpen className="w-6 h-6 flex-shrink-0" style={{ color: "#1EB89A" }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Comprendre vos droits</p>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 12px" }}>Oscar peut vérifier les aides auxquelles vous avez droit.</p>
            <button
              onClick={() => onAskOscar("Quelles aides sociales sont disponibles pour les seniors ? Vérifie mon éligibilité.")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white" }}
            >
              <MessageCircle className="w-4 h-4" />
              Vérifier mes droits
            </button>
          </div>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Guides détaillés</p>
        <div className="space-y-3">
          {RIGHTS_GUIDES.map(guide => (
            <RightsGuideCard key={guide.id} guide={guide} onAskOscar={onAskOscar} />
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Toutes les aides disponibles</p>
        <div className="space-y-3">
          {SOCIAL_AIDS.map(aid => (
            <AidCard key={aid.id} aid={aid} onAskOscar={onAskOscar} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OSCAR MINI CHAT
// ═══════════════════════════════════════════════════════════

function OscarMiniChat({ messages, input, typing, endRef, onInputChange, onSend }: {
  messages: { id: string; role: "user" | "assistant"; content: string }[];
  input: string;
  typing: boolean;
  endRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages or empty state */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(30,184,154,0.1)" }}>
              <MessageCircle className="w-7 h-7" style={{ color: "#1EB89A" }} />
            </div>
            <p style={{ fontSize: 15, color: "#64748B", textAlign: "center" }}>Posez une question à Oscar sur vos démarches administratives</p>
            <div className="flex flex-col gap-2 w-full">
              {OSCAR_SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => onSend(s)}
                  className="w-full p-3 rounded-xl text-left text-sm transition-all active:scale-[0.98]"
                  style={{ border: "1px solid rgba(30,184,154,0.2)", background: "white", cursor: "pointer", color: "#1A1E35" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-3.5 py-2.5"
              style={{
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap",
                background: msg.role === "user" ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white",
                color: msg.role === "user" ? "white" : "#1A1E35",
                boxShadow: msg.role === "user" ? "0 2px 8px rgba(30,184,154,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5" style={{ borderRadius: "18px 18px 18px 4px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex gap-1.5 items-center py-0.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Posez votre question..."
            className="flex-1 rounded-2xl px-4 py-3 outline-none"
            style={{ border: "2px solid #E2E8F0", fontSize: 15, color: "#1A1E35", background: "white", minHeight: 48 }}
            onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
          />
          <button
            onClick={() => onSend(input)}
            disabled={!input.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
            style={{ border: "none", cursor: input.trim() ? "pointer" : "default", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
