import { useState } from "react";
import { Copy, Mail, Download, Save, Check, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";
import type { DemarcheCardData, DocumentStatus } from "@/types/demarches";
import { openMailtoLink } from "@/lib/mailtoHelper";
import { downloadDocument } from "@/lib/documentService";

interface DemarcheCardProps {
  data: DemarcheCardData;
  onSave?: (data: DemarcheCardData) => void;
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  brouillon: "Brouillon",
  copie: "Copié",
  ouvert_email: "Ouvert dans les emails",
  sauvegarde: "Sauvegardé",
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  brouillon: "#94A3B8",
  copie: "#2DD4BF",
  ouvert_email: "#3B82F6",
  sauvegarde: "#10B981",
};

export function DemarcheCard({ data, onSave }: DemarcheCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>(data.status);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.generatedText);
      setCopied(true);
      setStatus("copie");
      toast.success("Texte copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le texte");
    }
  };

  const handleOpenEmail = () => {
    openMailtoLink({
      subject: data.subject,
      body: data.generatedText,
    });
    setStatus("ouvert_email");
    toast.success("Votre texte est prêt. Appuyez sur Envoyer dans votre application email.");
  };

  const handleDownloadPdf = () => {
    downloadDocument(data.templateId, data.generatedText, data.subject);
    toast.success("Le document a été téléchargé !");
  };

  const handleSave = () => {
    setStatus("sauvegarde");
    onSave?.({ ...data, status: "sauvegarde" });
    toast.success("Document sauvegardé !");
  };

  // Truncate text for preview
  const previewText = data.generatedText.length > 200
    ? data.generatedText.substring(0, 200) + "..."
    : data.generatedText;

  return (
    <div
      className="mt-3 rounded-2xl border overflow-hidden"
      style={{
        borderColor: "rgba(30, 184, 154, 0.3)",
        background: "linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 100%)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(30, 184, 154, 0.15)" }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(30, 184, 154, 0.15)" }}
        >
          <FileText className="w-5 h-5" style={{ color: "#1EB89A" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "#1A1E35" }}>
            {data.label}
          </p>
          <p className="text-sm" style={{ color: "#64748B" }}>
            {data.recipient ? `Pour : ${data.recipient}` : "Document généré"}
          </p>
        </div>
        {/* Status badge */}
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: `${STATUS_COLORS[status]}15`,
            color: STATUS_COLORS[status],
          }}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Text preview / full text */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 cursor-pointer hover:bg-white/50 transition-colors"
        style={{ border: "none", background: "transparent" }}
      >
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: "#334155", fontSize: "14px", lineHeight: 1.7 }}
        >
          {expanded ? data.generatedText : previewText}
        </p>
        <div className="flex items-center gap-1 mt-2" style={{ color: "#1EB89A" }}>
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="text-xs font-medium">Réduire</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs font-medium">Voir tout le texte</span>
            </>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div
        className="px-3 py-3 flex flex-wrap gap-2"
        style={{ borderTop: "1px solid rgba(30, 184, 154, 0.15)" }}
      >
        <ActionButton
          icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          label={copied ? "Copié !" : "Copier"}
          onClick={handleCopy}
          primary={false}
        />
        <ActionButton
          icon={<Mail className="w-4 h-4" />}
          label="Ouvrir dans mes emails"
          onClick={handleOpenEmail}
          primary
        />
        <ActionButton
          icon={<Download className="w-4 h-4" />}
          label="PDF"
          onClick={handleDownloadPdf}
          primary={false}
        />
        <ActionButton
          icon={<Save className="w-4 h-4" />}
          label="Sauvegarder"
          onClick={handleSave}
          primary={false}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
      style={{
        border: "none",
        cursor: "pointer",
        background: primary
          ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)"
          : "white",
        color: primary ? "white" : "#1A1E35",
        boxShadow: primary
          ? "0 2px 8px rgba(30, 184, 154, 0.3)"
          : "0 1px 3px rgba(0,0,0,0.08)",
        fontSize: "13px",
        minHeight: "40px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
