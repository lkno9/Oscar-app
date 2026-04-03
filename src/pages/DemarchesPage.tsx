import { useState, useCallback } from "react";
import {
  FileWarning, Building2, FileX2, Heart, ShieldCheck, PenLine,
  FileText, ChevronRight, ArrowLeft, Clock, Mail, Download, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DEMARCHE_TEMPLATES, buildPrompt, downloadDocument } from "@/lib/documentService";
import { openMailtoLink } from "@/lib/mailtoHelper";
import { useMistralChat } from "@/hooks/useMistralChat";
import { useAuth } from "@/hooks/useAuth";
import type { DemarcheTemplate, DemarcheFields, SavedDocument, DocumentStatus } from "@/types/demarches";

// ─── Icon Mapping ───────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  FileWarning: <FileWarning className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  FileX2: <FileX2 className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  PenLine: <PenLine className="w-6 h-6" />,
};

type PageView = "list" | "form" | "result" | "documents";

export function DemarchesPage() {
  const [view, setView] = useState<PageView>("list");
  const [activeSection, setActiveSection] = useState<"courriers" | "documents">("courriers");
  const [selectedTemplate, setSelectedTemplate] = useState<DemarcheTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fields, setFields] = useState<DemarcheFields>({});
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

  const { user } = useAuth();

  // Streaming text generation via the orchestrator
  const handleDelta = useCallback((token: string) => {
    setGeneratedText((prev) => prev + token);
  }, []);

  const handleDone = useCallback(() => {
    setIsGenerating(false);
    setView("result");
    toast.success("Votre texte est prêt !");
  }, []);

  const handleError = useCallback((error: string) => {
    setIsGenerating(false);
    toast.error(error || "Impossible de générer le texte. Réessayez.");
  }, []);

  const { sendMessage } = useMistralChat({
    onDelta: handleDelta,
    onDone: handleDone,
    onError: handleError,
    userId: user?.id,
  });

  // ─── Template Selection ───
  const handleSelectTemplate = (template: DemarcheTemplate) => {
    setSelectedTemplate(template);
    setCurrentQuestionIndex(0);
    setFields({});
    setGeneratedText("");
    setView("form");
  };

  // ─── Form Navigation (one question at a time) ───
  const currentQuestion = selectedTemplate?.questions[currentQuestionIndex];

  const handleAnswerSubmit = (value: string) => {
    if (!currentQuestion || !selectedTemplate) return;

    const newFields = { ...fields, [currentQuestion.key]: value };
    setFields(newFields);

    if (currentQuestionIndex < selectedTemplate.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // All questions answered — generate the text
      setIsGenerating(true);
      setGeneratedText("");
      const prompt = buildPrompt(selectedTemplate, newFields);
      sendMessage(prompt);
    }
  };

  const handleBack = () => {
    if (view === "form" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (view === "form" || view === "result") {
      setView("list");
      setSelectedTemplate(null);
    }
  };

  // ─── Save document ───
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

    setSavedDocuments((prev) => [doc, ...prev]);
    toast.success("Document sauvegardé !");

    // Xano integration: save to backend
    // TODO: Replace with actual Xano API call:
    // POST /saved_documents { senior_id, type, content, subject, recipient, status }
  };

  const handleDeleteDocument = (docId: string) => {
    setSavedDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success("Document supprimé");
  };

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
        {(view === "form" || view === "result") && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ border: "none", background: "transparent", cursor: "pointer" }}
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "#1A1E35" }} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1A1E35", margin: 0 }}>
            Démarches
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Oscar vous aide à écrire vos courriers
          </p>
        </div>
      </header>

      {/* Section Tabs (only on list view) */}
      {view === "list" && (
        <div className="flex gap-2 px-5 pt-4 pb-2 flex-shrink-0">
          <SectionTab
            label="Écrire un courrier"
            icon={<PenLine className="w-4 h-4" />}
            active={activeSection === "courriers"}
            onClick={() => setActiveSection("courriers")}
          />
          <SectionTab
            label="Mes documents"
            icon={<FileText className="w-4 h-4" />}
            active={activeSection === "documents"}
            onClick={() => setActiveSection("documents")}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {view === "list" && activeSection === "courriers" && (
          <TemplateList onSelect={handleSelectTemplate} />
        )}

        {view === "list" && activeSection === "documents" && (
          <DocumentsList
            documents={savedDocuments}
            onDelete={handleDeleteDocument}
          />
        )}

        {view === "form" && selectedTemplate && currentQuestion && (
          <QuestionForm
            template={selectedTemplate}
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={selectedTemplate.questions.length}
            onSubmit={handleAnswerSubmit}
            isGenerating={isGenerating}
          />
        )}

        {view === "form" && isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: "#1EB89A",
                    animation: "bounce 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 16, color: "#1A1E35", fontWeight: 500 }}>
              Oscar rédige votre texte...
            </p>
            {generatedText && (
              <div
                className="w-full rounded-2xl p-4 mt-2"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
                  {generatedText}
                </p>
              </div>
            )}
          </div>
        )}

        {view === "result" && selectedTemplate && (
          <ResultView
            text={generatedText}
            template={selectedTemplate}
            fields={fields}
            onSave={handleSaveDocument}
            onNewDemarche={() => {
              setView("list");
              setSelectedTemplate(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function SectionTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        border: "none",
        cursor: "pointer",
        background: active
          ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)"
          : "white",
        color: active ? "white" : "#64748B",
        boxShadow: active
          ? "0 2px 8px rgba(30, 184, 154, 0.3)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TemplateList({ onSelect }: { onSelect: (t: DemarcheTemplate) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: 15, color: "#64748B", marginBottom: 4 }}>
        Choisissez le type de courrier à écrire :
      </p>
      {DEMARCHE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{
            border: "none",
            cursor: "pointer",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            textAlign: "left",
            width: "100%",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(30, 184, 154, 0.1)", color: "#1EB89A" }}
          >
            {ICON_MAP[template.icon] || <FileText className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35", margin: 0 }}>
              {template.label}
            </p>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>
              {template.description}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "#CBD5E1" }} />
        </button>
      ))}
    </div>
  );
}

function QuestionForm({
  template,
  question,
  questionIndex,
  totalQuestions,
  onSubmit,
  isGenerating,
}: {
  template: DemarcheTemplate;
  question: DemarcheTemplate["questions"][number];
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (value: string) => void;
  isGenerating: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) {
      toast.error("Veuillez répondre à la question");
      return;
    }
    onSubmit(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && question.type !== "textarea") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isGenerating) return null;

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
              background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)",
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
          {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Template label */}
      <p style={{ fontSize: 13, color: "#1EB89A", fontWeight: 600 }}>
        {template.label}
      </p>

      {/* Question */}
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1A1E35", lineHeight: 1.3, margin: 0 }}>
        {question.label}
      </h2>

      {/* Input */}
      {question.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none resize-none"
          style={{
            border: "2px solid #E2E8F0",
            fontSize: 16,
            lineHeight: 1.6,
            color: "#1A1E35",
            background: "white",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      ) : question.type === "date" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none"
          style={{
            border: "2px solid #E2E8F0",
            fontSize: 16,
            color: "#1A1E35",
            background: "white",
            transition: "border-color 0.2s",
            minHeight: 52,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={question.placeholder}
          autoFocus
          className="w-full rounded-2xl p-4 text-base outline-none"
          style={{
            border: "2px solid #E2E8F0",
            fontSize: 16,
            color: "#1A1E35",
            background: "white",
            transition: "border-color 0.2s",
            minHeight: 52,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#1EB89A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          border: "none",
          cursor: value.trim() ? "pointer" : "default",
          background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)",
          boxShadow: "0 4px 16px rgba(30, 184, 154, 0.3)",
          fontSize: 16,
          minHeight: 52,
        }}
      >
        {questionIndex < totalQuestions - 1 ? "Continuer" : "Générer le texte"}
      </button>
    </div>
  );
}

function ResultView({
  text,
  template,
  fields,
  onSave,
  onNewDemarche,
}: {
  text: string;
  template: DemarcheTemplate;
  fields: DemarcheFields;
  onSave: () => void;
  onNewDemarche: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Texte copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleEmail = () => {
    openMailtoLink({
      subject: template.label,
      body: text,
    });
    toast.success("Votre texte est prêt. Appuyez sur Envoyer dans votre application email.");
  };

  const handlePdf = () => {
    downloadDocument(template.id, text, template.label);
    toast.success("Document téléchargé !");
  };

  const recipient = fields.destinataire || fields.entreprise || fields.mairie || fields.organisme || "";

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Success header */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: "rgba(30, 184, 154, 0.1)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#1EB89A" }}
        >
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1E35", margin: 0 }}>
            Votre texte est prêt !
          </p>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            {template.label}{recipient ? ` — ${recipient}` : ""}
          </p>
        </div>
      </div>

      {/* Generated text */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
          {text}
        </p>
      </div>

      {/* Action buttons — large, senior-friendly */}
      <div className="flex flex-col gap-3">
        <BigActionButton
          icon={<Mail className="w-5 h-5" />}
          label="Ouvrir dans mes emails"
          subtitle="Le texte sera pré-rempli"
          onClick={handleEmail}
          primary
        />
        <div className="flex gap-3">
          <BigActionButton
            icon={copied ? <FileText className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            label={copied ? "Copié !" : "Copier le texte"}
            onClick={handleCopy}
            primary={false}
          />
          <BigActionButton
            icon={<Download className="w-5 h-5" />}
            label="Télécharger en PDF"
            onClick={handlePdf}
            primary={false}
          />
        </div>
        <BigActionButton
          icon={<FileText className="w-5 h-5" />}
          label="Sauvegarder"
          onClick={onSave}
          primary={false}
        />
        <button
          onClick={onNewDemarche}
          className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
          style={{
            border: "2px solid #E2E8F0",
            background: "transparent",
            color: "#64748B",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Écrire un autre courrier
        </button>
      </div>
    </div>
  );
}

function BigActionButton({
  icon,
  label,
  subtitle,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
  primary: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] flex-1"
      style={{
        border: "none",
        cursor: "pointer",
        background: primary
          ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)"
          : "white",
        color: primary ? "white" : "#1A1E35",
        boxShadow: primary
          ? "0 4px 16px rgba(30, 184, 154, 0.3)"
          : "0 1px 4px rgba(0,0,0,0.08)",
        textAlign: "left",
        minHeight: 52,
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {icon}
      <div>
        <span>{label}</span>
        {subtitle && (
          <p style={{ fontSize: 12, opacity: 0.8, margin: "2px 0 0", fontWeight: 400 }}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}

function DocumentsList({
  documents,
  onDelete,
}: {
  documents: SavedDocument[];
  onDelete: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(30, 184, 154, 0.1)" }}
        >
          <FileText className="w-8 h-8" style={{ color: "#1EB89A" }} />
        </div>
        <p style={{ fontSize: 16, color: "#64748B", textAlign: "center" }}>
          Aucun document sauvegardé pour le moment.
          <br />
          Vos courriers apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: 15, color: "#64748B", marginBottom: 4 }}>
        Vos documents sauvegardés :
      </p>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(30, 184, 154, 0.1)", color: "#1EB89A" }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }} className="truncate">
              {doc.subject}
            </p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }} className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                openMailtoLink({ subject: doc.subject, body: doc.content });
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1EB89A" }}
              aria-label="Ouvrir dans les emails"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                downloadDocument(doc.type, doc.content, doc.subject);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }}
              aria-label="Télécharger en PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(doc.id)}
              className="p-2 rounded-xl hover:bg-red-50 transition-colors"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#EF4444" }}
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
