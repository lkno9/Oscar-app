import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  MessageCircle,
  Search,
  Shield,
} from "lucide-react";
import { SOCIAL_AIDS, RIGHTS_GUIDES } from "@/components/documents/TaskTemplates";
import type { RightGuide } from "@/components/documents/TaskTemplates";

interface DemarchesDroitsFlowProps {
  onBack: () => void;
  onAskOscar: (ctx: string) => void;
}

type Tab = "aides" | "guides";

export function DemarchesDroitsFlow({ onBack, onAskOscar }: DemarchesDroitsFlowProps) {
  const [tab, setTab] = useState<Tab>("aides");
  const [search, setSearch] = useState("");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const filteredAids = search
    ? SOCIAL_AIDS.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.shortDescription.toLowerCase().includes(search.toLowerCase())
      )
    : SOCIAL_AIDS;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Droits & aides</h1>
          <p className="text-sm text-muted-foreground">Vos droits en tant que senior</p>
        </div>
        <Shield className="w-6 h-6 text-primary" />
      </header>

      {/* Tab pills */}
      <div className="px-4 pt-3 pb-2 bg-card flex gap-2">
        <TabPill label={`Aides (${SOCIAL_AIDS.length})`} active={tab === "aides"} onClick={() => setTab("aides")} />
        <TabPill label={`Guides (${RIGHTS_GUIDES.length})`} active={tab === "guides"} onClick={() => setTab("guides")} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "aides" && (
          <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 36 }}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une aide..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                style={{ border: "2px solid #E2E8F0", fontSize: 14, color: "#1A1E35", background: "white" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#1EB89A"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
              />
            </div>

            {/* Oscar CTA */}
            <button
              onClick={() => onAskOscar("Quelles aides sociales sont disponibles pour ma situation de senior ? Aide-moi à vérifier mes droits.")}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
              style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)", textAlign: "left", boxShadow: "0 4px 16px rgba(30,184,154,0.3)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "white", margin: 0 }}>Oscar vérifie vos droits</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>Décrivez votre situation, Oscar identifie les aides possibles</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
            </button>

            {/* Aids list */}
            {filteredAids.map(aid => (
              <AidRow key={aid.id} aid={aid} onAskOscar={onAskOscar} />
            ))}

            {filteredAids.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-2">
                <p style={{ fontSize: 14, color: "#94A3B8" }}>Aucune aide trouvée pour "{search}"</p>
                <button
                  onClick={() => onAskOscar(`Je cherche des aides sur le thème : ${search}`)}
                  className="text-sm font-medium"
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1EB89A" }}
                >
                  Demander à Oscar
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "guides" && (
          <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 36 }}>
            {RIGHTS_GUIDES.map(guide => (
              <GuideCard
                key={guide.id}
                guide={guide}
                expanded={expandedGuide === guide.id}
                onToggle={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                onAskOscar={onAskOscar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{ border: "none", cursor: "pointer", background: active ? "#1A1E35" : "white", color: active ? "white" : "#64748B", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {label}
    </button>
  );
}

function AidRow({ aid, onAskOscar }: { aid: typeof SOCIAL_AIDS[number]; onAskOscar: (ctx: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 transition-all"
        style={{ border: "none", cursor: "pointer", background: "transparent", textAlign: "left" }}
      >
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{aid.name}</p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0", lineHeight: 1.4 }}>{aid.shortDescription}</p>
        </div>
        <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "#CBD5E1", transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid #F1F5F9" }}>
          <div className="pt-3 space-y-3">
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", margin: "0 0 4px" }}>Qui peut en bénéficier ?</p>
              <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.5 }}>{aid.whoCanApply}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", margin: "0 0 4px" }}>Où faire la demande ?</p>
              <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.5 }}>{aid.whereToApply}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onAskOscar(`Explique-moi en détail l'aide "${aid.name}" : conditions, montants, et comment faire la demande.`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white" }}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Demander à Oscar
              </button>
              <button
                onClick={() => window.open(`https://${aid.website}`, "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Site officiel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuideCard({ guide, expanded, onToggle, onAskOscar }: {
  guide: RightGuide;
  expanded: boolean;
  onToggle: () => void;
  onAskOscar: (ctx: string) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 transition-all"
        style={{ border: "none", cursor: "pointer", background: "transparent", textAlign: "left" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.1)", fontSize: 20 }}>
          {guide.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{guide.title}</p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0", lineHeight: 1.4 }}>{guide.description}</p>
        </div>
        <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "#CBD5E1", transform: expanded ? "rotate(180deg)" : "none" }} />
      </button>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid #F1F5F9" }}>
          <div className="pt-3 space-y-4">
            {/* Eligibility */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1E35", margin: "0 0 6px" }}>Conditions</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {guide.eligibility.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* How to apply */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1E35", margin: "0 0 6px" }}>Comment faire la demande</p>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {guide.howToApply.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Documents */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1E35", margin: "0 0 6px" }}>Documents nécessaires</p>
              <div className="flex flex-wrap gap-1.5">
                {guide.documents.map((doc, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "#F1F5F9", fontSize: 12, color: "#475569" }}>
                    <FileText className="w-3 h-3" /> {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4" style={{ fontSize: 12, color: "#94A3B8" }}>
              <span>Délai : {guide.estimatedDelay}</span>
              <span>Site : {guide.website}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onAskOscar(`Je veux en savoir plus sur "${guide.title}". Suis-je éligible ? Comment faire la demande ?`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ border: "none", cursor: "pointer", background: "#1EB89A", color: "white" }}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Vérifier avec Oscar
              </button>
              <button
                onClick={() => window.open(`https://${guide.website}`, "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Site officiel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
