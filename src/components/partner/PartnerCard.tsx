import { useState } from "react";
import {
  Building2,
  ChevronRight,
  Phone,
  Globe,
  MapPin,
  Clock,
  ExternalLink,
  X,
  Check,
} from "lucide-react";
import {
  DEMO_PARTNERS,
  PARTNER_TYPE_LABELS,
  getLinkedPartner,
  setLinkedPartnerId,
  type PartnerOrganization,
} from "@/lib/partnerOrganizations";

// ─── Compact card for RecapPage (Accueil) ───────────────

interface PartnerWidgetProps {
  onNavigate: (path: string) => void;
}

export function PartnerWidget({ onNavigate }: PartnerWidgetProps) {
  const partner = getLinkedPartner();

  if (!partner) {
    return (
      <button
        onClick={() => onNavigate("/services/partner")}
        className="w-full flex items-center gap-2.5 transition-all active:scale-[0.98]"
        style={{ borderRadius: 14, padding: "10px 14px", cursor: "pointer", textAlign: "left", background: "rgba(139,92,246,0.06)", border: "1px dashed rgba(139,92,246,0.2)" }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>🤝</span>
        <p className="flex-1" style={{ fontSize: 13, fontWeight: 500, color: "#6D28D9", margin: 0 }}>
          Associer mon organisme d'atelier
        </p>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#8B5CF6" }} />
      </button>
    );
  }

  const typeInfo = PARTNER_TYPE_LABELS[partner.type];

  return (
    <button
      onClick={() => onNavigate("/services/partner")}
      className="w-full flex items-center gap-2.5 transition-all active:scale-[0.98]"
      style={{ borderRadius: 14, padding: "10px 14px", cursor: "pointer", textAlign: "left", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{typeInfo.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#6D28D9", margin: 0 }}>
          {partner.name}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#8B5CF6" }} />
    </button>
  );
}

// ─── Full partner page ──────────────────────────────────

interface PartnerPageProps {
  onBack: () => void;
}

export function PartnerPage({ onBack }: PartnerPageProps) {
  const [partner, setPartner] = useState<PartnerOrganization | null>(getLinkedPartner);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (p: PartnerOrganization) => {
    setLinkedPartnerId(p.id);
    setPartner(p);
    setShowPicker(false);
  };

  const handleUnlink = () => {
    setLinkedPartnerId(null);
    setPartner(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
          <Building2 className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Mon organisme</h1>
          <p className="text-sm text-muted-foreground">Votre structure d'accompagnement</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4" style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 36 }}>

          {partner ? (
            <>
              {/* Partner header card */}
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", boxShadow: "0 4px 20px rgba(139,92,246,0.3)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {PARTNER_TYPE_LABELS[partner.type].label}
                  </span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "white", margin: "0 0 6px" }}>{partner.name}</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: 0 }}>{partner.description}</p>
              </div>

              {/* Contact info */}
              <div className="rounded-2xl bg-card" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {partner.address && (
                  <ContactRow icon={<MapPin className="w-4 h-4" />} label={`${partner.address}${partner.city ? `, ${partner.city}` : ""}`} />
                )}
                {partner.phone && (
                  <ContactRow
                    icon={<Phone className="w-4 h-4" />}
                    label={partner.phone}
                    action={() => window.open(`tel:${partner.phone}`, "_self")}
                    actionLabel="Appeler"
                  />
                )}
                {partner.website && (
                  <ContactRow
                    icon={<Globe className="w-4 h-4" />}
                    label={partner.website}
                    action={() => window.open(`https://${partner.website}`, "_blank")}
                    actionLabel="Visiter"
                  />
                )}
                {partner.schedule && (
                  <ContactRow icon={<Clock className="w-4 h-4" />} label={partner.schedule} />
                )}
              </div>

              {/* Activities */}
              {partner.activities.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Activités proposées
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {partner.activities.map((activity, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-xl"
                        style={{ background: "rgba(139,92,246,0.08)", fontSize: 13, color: "#6D28D9", fontWeight: 500 }}>
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unlink */}
              <button
                onClick={handleUnlink}
                className="w-full py-3 rounded-2xl text-sm font-medium"
                style={{ border: "2px solid #E2E8F0", background: "transparent", color: "#94A3B8", cursor: "pointer" }}
              >
                Changer d'organisme
              </button>
            </>
          ) : (
            <>
              {/* No partner linked */}
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <Building2 className="w-8 h-8" style={{ color: "#8B5CF6" }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35", textAlign: "center" }}>Aucun organisme lié</p>
                <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 280 }}>
                  Si vous participez à des ateliers numériques, associez votre organisme pour retrouver ses infos ici.
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-medium transition-all active:scale-[0.98]"
                  style={{ border: "none", cursor: "pointer", background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}
                >
                  <Building2 className="w-5 h-5" /> Associer un organisme
                </button>
              </div>

              {showPicker && <PartnerPicker partners={DEMO_PARTNERS} onSelect={handleSelect} onClose={() => setShowPicker(false)} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function ContactRow({ icon, label, action, actionLabel }: {
  icon: React.ReactNode; label: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ color: "#8B5CF6" }}>{icon}</div>
      <p className="flex-1 text-foreground" style={{ fontSize: 14, margin: 0 }}>{label}</p>
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98]"
          style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.05)", color: "#8B5CF6", cursor: "pointer" }}
        >
          <ExternalLink className="w-3 h-3" /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function PartnerPicker({ partners, onSelect, onClose }: {
  partners: PartnerOrganization[]; onSelect: (p: PartnerOrganization) => void; onClose: () => void;
}) {
  return (
    <div className="rounded-2xl bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1E35" }}>Choisir votre organisme</p>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
          <X className="w-5 h-5" style={{ color: "#94A3B8" }} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {partners.map(p => {
          const typeInfo = PARTNER_TYPE_LABELS[p.type];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98]"
              style={{ border: "1px solid #E2E8F0", background: "white", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ fontSize: 24 }}>{typeInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1E35", margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0" }}>{typeInfo.label} • {p.city || "France"}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "#CBD5E1" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
