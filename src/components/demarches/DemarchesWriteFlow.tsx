import { useState, useCallback } from "react";
import {
  FileText,
  ChevronRight,
  Mail,
  Download,
  Clock,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { DEMARCHE_TEMPLATES, buildPrompt, downloadDocument } from "@/lib/documentService";
import { openMailtoLink } from "@/lib/mailtoHelper";
import { useMistralChat } from "@/hooks/useMistralChat";
import { useAuth } from "@/hooks/useAuth";
import { PillBtn, BigBtn, ICON_MAP } from "./DemarchesHelpers";
import type { DemarcheTemplate, DemarcheFields, SavedDocument, DocumentStatus } from "@/types/demarches";

// ═══════════════════════════════════════════════════════════
// WRITE FLOW — template selection → questions → result
// ═══════════════════════════════════════════════════════════

interface DemarchesWriteFlowProps {
  onBack: () => void;
}

type WriteView = "list" | "form" | "result";

export function DemarchesWriteFlow({ onBack }: DemarchesWriteFlowProps) {
  const { user } = useAuth();
  const [writeView, setWriteView] = useState<WriteView>("list");
  const [selectedTemplate, setSelectedTemplate] = useState<DemarcheTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fields, setFields] = useState<DemarcheFields>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [showSaved, setShowSaved] = useState(false);

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

  const handleBack = () => {
    if (writeView === "form" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (writeView === "result") {
      setWriteView("list");
    } else {
      onBack();
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

  const headerTitle = writeView === "list" ? "Écrire un courrier" : selectedTemplate?.label || "Écrire un courrier";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={handleBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{headerTitle}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {writeView === "list" && (
          <div className="px-4 py-4">
            <div className="flex gap-2 mb-4">
              <PillBtn label="Nouveau courrier" active={!showSaved} onClick={() => setShowSaved(false)} />
              <PillBtn label={`Sauvegardés (${savedDocuments.length})`} active={showSaved} onClick={() => setShowSaved(true)} />
            </div>
            {showSaved ? (
              <DocumentsList documents={savedDocuments} onDelete={(id) => setSavedDocuments(prev => prev.filter(d => d.id !== id))} />
            ) : (
              <TemplateList onSelect={handleSelectTemplate} />
            )}
          </div>
        )}

        {writeView === "form" && selectedTemplate && currentQuestion && (
          <div className="px-4 py-4">
            <QuestionForm
              template={selectedTemplate}
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={selectedTemplate.questions.length}
              onSubmit={handleAnswerSubmit}
              isGenerating={isGenerating}
            />
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex gap-1.5 items-center">
                  {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full" style={{ background: "#1EB89A", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
                </div>
                <p style={{ fontSize: 16, color: "#1A1E35", fontWeight: 500 }}>Oscar rédige votre texte...</p>
                {generatedText && (
                  <div className="w-full rounded-2xl p-4 mt-2 bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{generatedText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {writeView === "result" && selectedTemplate && (
          <div className="px-4 py-4">
            <ResultView
              text={generatedText}
              template={selectedTemplate}
              fields={fields}
              onSave={handleSaveDocument}
              onNewDemarche={() => { setWriteView("list"); setSelectedTemplate(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

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

function QuestionForm({ template, question, questionIndex, totalQuestions, onSubmit, isGenerating }: {
  template: DemarcheTemplate;
  question: DemarcheTemplate["questions"][number];
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (v: string) => void;
  isGenerating: boolean;
}) {
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

function ResultView({ text, template, fields, onSave, onNewDemarche }: {
  text: string; template: DemarcheTemplate; fields: DemarcheFields; onSave: () => void; onNewDemarche: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); toast.success("Texte copié !"); setTimeout(() => setCopied(false), 2000); } catch { toast.error("Impossible de copier"); } };
  const recipient = fields.destinataire || fields.entreprise || fields.mairie || fields.organisme || "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(30,184,154,0.1)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1EB89A" }}><FileText className="w-5 h-5 text-white" /></div>
        <div><p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>Votre texte est prêt !</p><p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{template.label}{recipient ? ` — ${recipient}` : ""}</p></div>
      </div>
      <div className="rounded-2xl p-4 bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
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
        <div key={doc.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
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
