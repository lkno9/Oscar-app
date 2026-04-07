import {
  FileWarning,
  Building2,
  FileX2,
  Heart,
  ShieldCheck,
  PenLine,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// SHARED UI HELPERS for Démarches
// ═══════════════════════════════════════════════════════════

export function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: "#1EB89A" }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.6px", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

export function ActionCard({ icon, label, sublabel, color, badge, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string; color: string; badge?: number; onClick: () => void;
}) {
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

export function PillBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{ border: "none", cursor: "pointer", background: active ? "#1A1E35" : "white", color: active ? "white" : "#64748B", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {label}
    </button>
  );
}

export function BigBtn({ icon, label, subtitle, onClick, primary }: {
  icon: React.ReactNode; label: string; subtitle?: string; onClick: () => void; primary: boolean;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] flex-1"
      style={{ border: "none", cursor: "pointer", textAlign: "left", minHeight: 52, fontSize: 14, fontWeight: 600, background: primary ? "linear-gradient(135deg, #1EB89A 0%, #0F766E 100%)" : "white", color: primary ? "white" : "#1A1E35", boxShadow: primary ? "0 4px 16px rgba(30,184,154,0.3)" : "0 1px 4px rgba(0,0,0,0.08)" }}>
      {icon}
      <div><span>{label}</span>{subtitle && <p style={{ fontSize: 11, opacity: 0.8, margin: "2px 0 0", fontWeight: 400 }}>{subtitle}</p>}</div>
    </button>
  );
}

export const ICON_MAP: Record<string, React.ReactNode> = {
  FileWarning: <FileWarning className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  FileX2: <FileX2 className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  PenLine: <PenLine className="w-6 h-6" />,
};
