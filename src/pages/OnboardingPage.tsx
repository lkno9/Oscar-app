import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Building2, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Brand ────────────────────────────────────────────────────────────────────
const G = "#1A9E7E";   // primary green
const DARK = "#1A1A2E";
const MINT = "#E8F5F0";
const TEAL = "#4DBFA5";

// ─── Mascot ───────────────────────────────────────────────────────────────────
// MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here
function Mascot({ size = 80 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: G, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 32px rgba(26,158,126,0.32)",
    }}>
      <span style={{ color: "#fff", fontWeight: 900, fontSize: size * 0.42, fontFamily: "system-ui, -apple-system" }}>O</span>
    </div>
  );
}

// ─── Speech bubble ────────────────────────────────────────────────────────────
function Bubble({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: 340 }}>
      <div style={{
        background: dark ? "rgba(255,255,255,0.16)" : "#fff",
        backdropFilter: dark ? "blur(8px)" : undefined,
        borderRadius: 20, padding: "14px 20px",
        boxShadow: dark ? "none" : "0 4px 18px rgba(0,0,0,0.08)",
      }}>
        <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.55, margin: 0, color: dark ? "#fff" : DARK }}>{text}</p>
      </div>
      <div style={{
        position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
        borderTop: `9px solid ${dark ? "rgba(255,255,255,0.16)" : "#fff"}`,
      }} />
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ padding: "0 0 4px" }}>
      <div style={{ height: 6, background: "#C8E6DC", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(step / total) * 100}%`, background: G, borderRadius: 99, transition: "width 0.35s ease" }} />
      </div>
      <p style={{ fontSize: 13, color: "#6B7280", textAlign: "right", marginTop: 3 }}>Étape {step}/{total}</p>
    </div>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────
function Btn({
  label, onClick, disabled = false, onDark = false, outline = false,
}: {
  label: string; onClick: () => void; disabled?: boolean; onDark?: boolean; outline?: boolean;
}) {
  const base: React.CSSProperties = {
    width: "100%", height: 56, borderRadius: 16, fontSize: 18, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
    opacity: disabled ? 0.45 : 1,
  };
  if (outline) return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: "none", border: "2px solid rgba(255,255,255,0.5)", color: "rgba(255,255,255,0.7)" }}>{label}</button>
  );
  if (onDark) return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: "#fff", color: G, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}>{label}</button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: G, color: "#fff", border: "none", boxShadow: disabled ? "none" : `0 4px 20px rgba(26,158,126,0.35)` }}>{label}</button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, type = "text", autoFocus = false }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 56, borderRadius: 16, fontSize: 18, color: DARK,
        border: `2px solid ${focused ? G : "#D1EAE3"}`, background: "#fff",
        padding: "0 16px", outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
    />
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// CONNECT_TO_CITY_API
const CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier",
  "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne",
  "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Le Mans",
  "Aix-en-Provence", "Clermont-Ferrand", "Brest", "Tours", "Limoges", "Amiens",
  "Perpignan", "Metz", "Besançon", "Boulogne-Billancourt", "Orléans", "Mulhouse",
  "Rouen", "Caen", "Nancy", "Saint-Denis", "Argenteuil", "Montreuil", "Roubaix",
  "Tourcoing", "Vitry-sur-Seine", "Créteil", "Avignon", "Nanterre", "Poitiers",
  "Versailles", "Courbevoie", "Colombes", "Aulnay-sous-Bois", "Pau", "Bayonne",
  "Annecy", "Mérignac", "Saint-Nazaire", "Colmar", "Sartrouville", "Champigny-sur-Marne",
];

// CONNECT_TO_ORGANISM_DATABASE
const ORGANISMS = [
  "ADMR", "AGIRC-ARRCO", "AG2R La Mondiale", "APICIL", "CARSAT",
  "CCAS (Centre communal d'action sociale)", "CNAV", "Croix-Rouge française",
  "Groupama", "Harmonie Mutuelle", "KLESIA", "La Mutuelle Générale",
  "MAIF", "MALAKOFF HUMANIS", "MGEN", "MSA", "MFP",
  "Mutuelle Nationale Territoriale", "Pro BTP", "SMACL Assurances",
  "UNIRC", "VYV Conseil",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Step =
  | "welcome" | "intro" | "feature1" | "feature2"
  | "firstname" | "city" | "organism" | "phone" | "otp"
  | "paywall" | "confirm";

type UserType = "senior" | "family";
type AccessType = "b2b2c" | "trial" | "paid" | "limited";

const FLOW: Step[] = ["welcome", "intro", "feature1", "feature2", "firstname", "city", "organism", "phone", "otp"];
const PROGRESS_STEP: Partial<Record<Step, number>> = { firstname: 1, city: 2, organism: 3, phone: 4, otp: 5 };

// ─── Component ────────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("welcome");
  const [userType, setUserType] = useState<UserType>("senior");
  const [firstName, setFirstName] = useState("");
  const [seniorFirstName, setSeniorFirstName] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [citySelected, setCitySelected] = useState("");
  const [hasOrganism, setHasOrganism] = useState<boolean | null>(null);
  const [orgInput, setOrgInput] = useState("");
  const [orgSelected, setOrgSelected] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [accessType, setAccessType] = useState<AccessType>("limited");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const goTo = (s: Step) => setStep(s);

  const goNext = useCallback(() => {
    const i = FLOW.indexOf(step);
    if (i >= 0 && i < FLOW.length - 1) setStep(FLOW[i + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const i = FLOW.indexOf(step);
    if (i > 0) setStep(FLOW[i - 1]);
    else if (step === "paywall" || step === "confirm") setStep("otp");
  }, [step]);

  const resolveAccess = useCallback((): AccessType => {
    if (!hasOrganism) return "limited";
    const knownOrg = ORGANISMS.includes(orgSelected);
    if (knownOrg) return "b2b2c";
    // SEND_ORGANISM_LEAD_NOTIFICATION — trigger Make webhook: { organism: orgSelected, phone, firstName }
    return "trial";
  }, [hasOrganism, orgSelected]);

  const handleSendOtp = async () => {
    // CONNECT_TO_SUPABASE_SMS_OTP
    // const cleaned = phone.replace(/\s/g, "");
    // const fullNumber = cleaned.startsWith("0") ? `+33${cleaned.slice(1)}` : cleaned;
    // await supabase.auth.signInWithOtp({ phone: fullNumber });
    setSending(true);
    await new Promise(r => setTimeout(r, 600)); // stub
    setSending(false);
    toast.success("Code envoyé par SMS !");
    goTo("otp");
  };

  const handleVerifyOtp = async () => {
    // CONNECT_TO_SUPABASE_OTP_VERIFY
    // const { error } = await supabase.auth.verifyOtp({ phone: fullNumber, token: otp.join(""), type: "sms" });
    setVerifying(true);
    await new Promise(r => setTimeout(r, 700)); // stub
    setVerifying(false);
    await persistProfile();
    const resolved = resolveAccess();
    setAccessType(resolved);
    goTo(resolved === "limited" ? "paywall" : "confirm");
  };

  const persistProfile = async () => {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName,
        senior_first_name: seniorFirstName || null,
        city: citySelected,
        phone_number: phone,
        user_type: userType,
        has_organism: hasOrganism ?? false,
        organism_name: orgSelected || null,
        access_type: accessType,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch { /* non-blocking */ }
  };

  const handleOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const filteredCities = cityInput.length >= 2
    ? CITIES.filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase())).slice(0, 6)
    : [];

  const filteredOrgs = orgInput.length >= 2
    ? ORGANISMS.filter(o => o.toLowerCase().includes(orgInput.toLowerCase())).slice(0, 5)
    : [];

  const isImmersive = ["welcome", "intro", "confirm"].includes(step);
  const isDark = step === "paywall";
  const showBack = !["welcome", "intro"].includes(step);
  const progressStep = PROGRESS_STEP[step];

  const bg = isImmersive ? G : isDark ? DARK : MINT;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: bg }}>

      {/* ── Top bar ── */}
      {(showBack || progressStep !== undefined) && (
        <div style={{ padding: "16px 24px 0", flexShrink: 0 }}>
          {showBack && (
            <button
              onClick={goBack}
              aria-label="Retour"
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
                color: isImmersive || isDark ? "#fff" : DARK, fontSize: 16, fontWeight: 600,
              }}
            >
              <ArrowLeft style={{ width: 20, height: 20 }} /> Retour
            </button>
          )}
          {progressStep !== undefined && <ProgressBar step={progressStep} total={5} />}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 1 — Welcome                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "welcome" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px 56px", gap: 36 }}>
          {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
          <Mascot size={130} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.4, maxWidth: 310, margin: 0 }}>
            Rendre le numérique invisible pour que le lien reste réel.
          </p>
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
            <Btn label="Commencer" onClick={() => { setUserType("senior"); goTo("intro"); }} onDark />
            <button
              onClick={() => { setUserType("family"); goTo("intro"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 17, fontWeight: 500, textDecoration: "underline", padding: "6px 0" }}
            >
              Je configure Oscar pour un proche
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 2 — Intro                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "intro" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px 56px", gap: 32 }}>
          <Bubble text="Bonjour ! Je suis Oscar. Je vais vous aider à rester connecté à ceux que vous aimez." dark />
          <div style={{ marginTop: 4 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={148} />
          </div>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <Btn label="Continuer" onClick={() => goTo("feature1")} onDark />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 3 — Feature 1                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "feature1" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Bubble text="Je réponds à vos appels, vos messages, et je simplifie vos démarches du quotidien." />
            {/* Voice interface card */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 22, width: "100%", maxWidth: 360, boxShadow: "0 4px 24px rgba(26,158,126,0.13)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: MINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone style={{ width: 22, height: 22, color: G }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: DARK, margin: 0 }}>Appel vocal avec Oscar</p>
                  <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Parlez naturellement</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 40 }}>
                {[0.4, 0.7, 1, 0.55, 0.85, 0.4, 0.95, 0.6, 1, 0.7, 0.45, 0.8].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: i % 3 === 0 ? G : TEAL, borderRadius: 99 }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 17, color: "#4A5568", textAlign: "center", fontWeight: 500, margin: 0 }}>
              Disponible par appel vocal, WhatsApp, et sur cette application.
            </p>
          </div>
          <div style={{ marginTop: 24 }}>
            <Btn label="Suivant" onClick={() => goTo("feature2")} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 4 — Feature 2                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "feature2" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Bubble text="Et je garde le lien avec votre famille, où qu'elle soit." />
            {/* Family card */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 22, width: "100%", maxWidth: 360, boxShadow: "0 4px 24px rgba(26,158,126,0.13)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 14px" }}>Résumé famille</p>
              {[
                { name: "Marie (fille)", msg: "A envoyé une photo hier" },
                { name: "Pierre (fils)", msg: "A laissé un message vocal" },
                { name: "Lucie (petite-fille)", msg: "Connectée ce matin" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: i % 2 === 0 ? G : TEAL, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{item.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Btn label="Suivant" onClick={() => goTo("firstname")} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 5 — First name                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "firstname" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <Bubble text="Commençons par faire connaissance." />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 18, fontWeight: 700, color: DARK, display: "block", marginBottom: 8 }}>Prénom</label>
                <Input value={firstName} onChange={setFirstName} placeholder="Votre prénom" autoFocus />
              </div>
              {userType === "family" && (
                <div>
                  <label style={{ fontSize: 18, fontWeight: 700, color: DARK, display: "block", marginBottom: 8 }}>Prénom de votre proche</label>
                  <Input value={seniorFirstName} onChange={setSeniorFirstName} placeholder="Son prénom" />
                </div>
              )}
            </div>
          </div>
          <Btn
            label="Suivant"
            onClick={() => goTo("city")}
            disabled={!firstName.trim() || (userType === "family" && !seniorFirstName.trim())}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 6 — City                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "city" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <Bubble text="Dans quelle ville habitez-vous ?" />
            <div>
              <label style={{ fontSize: 18, fontWeight: 700, color: DARK, display: "block", marginBottom: 8 }}>Ville</label>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "#6B7280", pointerEvents: "none" }} />
                <input
                  value={citySelected || cityInput}
                  onChange={e => { setCityInput(e.target.value); setCitySelected(""); }}
                  placeholder="Rechercher votre ville"
                  style={{
                    width: "100%", height: 56, borderRadius: 16, fontSize: 18, color: DARK,
                    border: `2px solid ${citySelected ? G : "#D1EAE3"}`, background: "#fff",
                    padding: "0 16px 0 46px", outline: "none", boxSizing: "border-box",
                  }}
                />
                {citySelected && (
                  <button onClick={() => { setCitySelected(""); setCityInput(""); }}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 20, lineHeight: 1 }}>×</button>
                )}
              </div>
              {filteredCities.length > 0 && !citySelected && (
                <div style={{ background: "#fff", borderRadius: 16, marginTop: 6, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.09)" }}>
                  {filteredCities.map(city => (
                    <button key={city} onClick={() => { setCitySelected(city); setCityInput(city); }}
                      style={{ width: "100%", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid #E8F5F0", cursor: "pointer", textAlign: "left", fontSize: 18, color: DARK, display: "flex", alignItems: "center", gap: 10 }}>
                      <Search style={{ width: 14, height: 14, color: G, flexShrink: 0 }} />{city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Btn label="Suivant" onClick={() => goTo("organism")} disabled={!citySelected} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 7 — Organism                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "organism" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <Bubble text="Êtes-vous suivi par une association, une mutuelle, ou un service social ?" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { val: true,  Icon: Building2, label: "Oui, je suis membre d'un organisme" },
                { val: false, Icon: User,      label: "Non, je n'en ai pas" },
              ] as const).map(({ val, Icon, label }) => {
                const active = hasOrganism === val;
                return (
                  <button key={String(val)} onClick={() => { setHasOrganism(val); if (!val) { setOrgSelected(""); setOrgInput(""); } }}
                    style={{
                      width: "100%", minHeight: 64, borderRadius: 16, padding: "16px 20px",
                      border: `2px solid ${active ? G : "#D1EAE3"}`,
                      background: active ? "rgba(26,158,126,0.07)" : "#fff",
                      display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}>
                    <Icon style={{ width: 24, height: 24, color: active ? G : "#6B7280", flexShrink: 0 }} />
                    <span style={{ fontSize: 18, fontWeight: 600, color: active ? G : DARK }}>{label}</span>
                  </button>
                );
              })}
            </div>
            {hasOrganism === true && (
              <div>
                <label style={{ fontSize: 16, fontWeight: 600, color: DARK, display: "block", marginBottom: 8 }}>Recherchez votre organisme</label>
                <input
                  value={orgSelected || orgInput}
                  onChange={e => { setOrgInput(e.target.value); setOrgSelected(""); }}
                  placeholder="Nom de l'organisme"
                  style={{
                    width: "100%", height: 56, borderRadius: 16, fontSize: 18, color: DARK,
                    border: `2px solid ${orgSelected ? G : "#D1EAE3"}`, background: "#fff",
                    padding: "0 16px", outline: "none", boxSizing: "border-box",
                  }}
                />
                {filteredOrgs.length > 0 && !orgSelected && (
                  <div style={{ background: "#fff", borderRadius: 16, marginTop: 6, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.09)" }}>
                    {filteredOrgs.map(org => (
                      <button key={org} onClick={() => { setOrgSelected(org); setOrgInput(org); }}
                        style={{ width: "100%", padding: "13px 16px", background: "none", border: "none", borderBottom: "1px solid #E8F5F0", cursor: "pointer", textAlign: "left", fontSize: 17, color: DARK }}>
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Btn
            label="Suivant"
            onClick={() => goTo("phone")}
            disabled={hasOrganism === null || (hasOrganism === true && !orgSelected)}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 8 — Phone                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "phone" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <Bubble text="Renseignez votre numéro pour accéder à votre compte." />
            <div>
              <label style={{ fontSize: 18, fontWeight: 700, color: DARK, display: "block", marginBottom: 10 }}>Numéro de téléphone</label>
              <div style={{ display: "flex", height: 56, borderRadius: 16, border: "2px solid #D1EAE3", background: "#fff", overflow: "hidden" }}>
                <div style={{ padding: "0 14px", display: "flex", alignItems: "center", gap: 8, borderRight: "2px solid #D1EAE3", flexShrink: 0, background: "#F9FAFB" }}>
                  <span style={{ fontSize: 22 }}>🇫🇷</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: DARK }}>+33</span>
                </div>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="06 12 34 56 78"
                  type="tel"
                  inputMode="tel"
                  style={{ flex: 1, padding: "0 16px", fontSize: 20, fontWeight: 600, color: DARK, border: "none", outline: "none", background: "transparent", letterSpacing: "0.5px" }}
                />
              </div>
              <p style={{ fontSize: 15, color: "#6B7280", marginTop: 10, lineHeight: 1.6 }}>
                Ce numéro sera votre identifiant. Il ne sera pas visible sur votre profil.
              </p>
              <p style={{ fontSize: 15, color: "#6B7280" }}>
                Nous allons vous envoyer un code par SMS.
              </p>
            </div>
          </div>
          {/* CONNECT_TO_SUPABASE_SMS_OTP */}
          <Btn
            label={sending ? "Envoi en cours…" : "Envoyer le code"}
            onClick={handleSendOtp}
            disabled={phone.replace(/\s/g, "").length < 9 || sending}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 9 — OTP                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "otp" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
            <Mascot size={52} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            <Bubble text="Entrez le code reçu par SMS." />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  style={{
                    width: 48, height: 62, borderRadius: 14, textAlign: "center",
                    fontSize: 28, fontWeight: 800, color: DARK,
                    border: `2px solid ${digit ? G : "#D1EAE3"}`,
                    background: digit ? "rgba(26,158,126,0.07)" : "#fff",
                    outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = G)}
                  onBlur={e => { e.target.style.borderColor = otp[i] ? G : "#D1EAE3"; }}
                />
              ))}
            </div>
            <button
              onClick={handleSendOtp}
              style={{ background: "none", border: "none", cursor: "pointer", color: G, fontSize: 16, fontWeight: 600, textDecoration: "underline" }}
            >
              Renvoyer le code
            </button>
          </div>
          {/* CONNECT_TO_SUPABASE_OTP_VERIFY */}
          <Btn
            label={verifying ? "Vérification…" : "Valider"}
            onClick={handleVerifyOtp}
            disabled={otp.join("").length < 6 || verifying}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 10A — Paywall                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "paywall" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 44px", gap: 24 }}>
          {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
          <Mascot size={80} />
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", textAlign: "center", margin: 0 }}>
            Choisissez votre formule
          </h2>
          <div style={{ width: "100%", display: "flex", gap: 12 }}>
            {[
              {
                id: "individual",
                name: "Individuelle",
                price: "12,99€/mois",
                bullets: ["Accès complet", "1 senior", "Support inclus"],
                featured: false,
              },
              {
                id: "family",
                name: "Famille",
                price: "17,99€/mois",
                bullets: ["Accès complet", "Jusqu'à 5 proches", "Résumé famille hebdomadaire", "Support prioritaire"],
                featured: true,
              },
            ].map(plan => (
              <button
                key={plan.id}
                onClick={() => { setAccessType("paid"); goTo("confirm"); }}
                style={{
                  flex: 1, borderRadius: 20, padding: "22px 14px 18px",
                  border: `2px solid ${plan.featured ? G : "rgba(255,255,255,0.18)"}`,
                  background: plan.featured ? "rgba(26,158,126,0.16)" : "rgba(255,255,255,0.05)",
                  cursor: "pointer", textAlign: "left", position: "relative",
                  backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", gap: 10,
                }}
              >
                {plan.featured && (
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    background: G, borderRadius: 99, padding: "3px 13px",
                    fontSize: 12, fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
                  }}>Le plus choisi</div>
                )}
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>{plan.name}</p>
                <p style={{ fontSize: 23, fontWeight: 900, color: plan.featured ? TEAL : "#fff", margin: 0 }}>{plan.price}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {plan.bullets.map(b => (
                    <p key={b} style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", margin: 0 }}>• {b}</p>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: 0 }}>
            Prix bloqué pour les premiers utilisateurs
          </p>
          {/* CONNECT_TO_STRIPE */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <Btn label="Commencer l'essai gratuit 14 jours" onClick={() => { setAccessType("trial"); goTo("confirm"); }} onDark />
            <button
              onClick={() => { setAccessType("limited"); goTo("confirm"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: 15, textDecoration: "underline", padding: "4px 0" }}
            >
              Continuer sans abonnement
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Screen 11 — Confirmation                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === "confirm" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px 56px", gap: 28 }}>
          {/* MASCOT_PLACEHOLDER — Oscar mascot illustration will be provided by founder, drop SVG/PNG here */}
          <Mascot size={130} />
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", margin: 0 }}>
              {userType === "family" && seniorFirstName
                ? `Oscar est prêt pour ${seniorFirstName} !`
                : `Bienvenue ${firstName} !`}
            </h1>
            <Bubble text="Je suis là, quand vous avez besoin." dark />
          </div>
          {accessType === "trial" && (
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "8px 22px" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>✨ Essai gratuit — 14 jours</p>
            </div>
          )}
          {accessType === "b2b2c" && orgSelected && (
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "8px 22px" }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>🎁 Accès offert par {orgSelected}</p>
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 380 }}>
            <Btn label="Découvrir Oscar" onClick={() => navigate("/")} onDark />
          </div>
        </div>
      )}
    </div>
  );
}
