import { useState } from "react";
import { Phone, MapPin, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SOSButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCallEmergency = () => {
    window.location.href = "tel:15";
    setOpen(false);
  };

  const handleCallFamily = () => {
    navigate("/services/calls");
    setOpen(false);
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        // Try to share or open maps
        if (navigator.share) {
          navigator.share({ title: "Ma position", url });
        } else {
          window.open(url, "_blank");
        }
      });
    }
    setOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SOS Modal */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-72 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-slide-up">
          <div className="bg-destructive px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-destructive-foreground font-bold text-lg">Urgence</p>
              <p className="text-destructive-foreground/80 text-sm">Que souhaitez-vous faire ?</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-destructive-foreground" />
            </button>
          </div>

          <div className="p-3 space-y-2">
            <button
              onClick={handleCallEmergency}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors min-h-[60px]"
            >
              <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground text-base">Appeler les secours</p>
                <p className="text-sm text-muted-foreground">SAMU · Police · Pompiers</p>
              </div>
            </button>

            <button
              onClick={handleCallFamily}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors min-h-[60px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground text-base">Appeler ma famille</p>
                <p className="text-sm text-muted-foreground">Contacts proches</p>
              </div>
            </button>

            <button
              onClick={handleSendLocation}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors min-h-[60px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground text-base">Envoyer ma position</p>
                <p className="text-sm text-muted-foreground">Partager ma localisation</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-destructive shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="SOS Urgence"
      >
        <span className="text-destructive-foreground font-black text-sm tracking-widest">SOS</span>
      </button>
    </>
  );
}
