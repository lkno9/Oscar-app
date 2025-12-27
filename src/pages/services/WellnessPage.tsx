import { ArrowLeft, Heart, Activity, Moon, Footprints, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export function WellnessPage() {
  const navigate = useNavigate();

  const stats = [
    { icon: Footprints, label: "Pas aujourd'hui", value: "4,532", goal: "6,000", progress: 75, color: "text-blue-500" },
    { icon: Moon, label: "Sommeil", value: "7h 30m", goal: "8h", progress: 94, color: "text-purple-500" },
    { icon: Activity, label: "Activité", value: "45 min", goal: "30 min", progress: 100, color: "text-green-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Bien-être</h1>
          <p className="text-sm text-muted-foreground">Prenez soin de vous</p>
        </div>
        <Heart className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mood check */}
        <div className="bg-gradient-to-r from-primary/20 to-accent rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-5 h-5" />
            Comment vous sentez-vous ?
          </h2>
          <div className="flex justify-between">
            {["😊", "🙂", "😐", "😔", "😢"].map((emoji, i) => (
              <button
                key={i}
                className="w-12 h-12 rounded-full bg-card hover:bg-secondary transition-colors flex items-center justify-center text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Votre journée
          </h2>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 shadow-sm border border-border"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{stat.label}</h3>
                  <p className="text-sm text-muted-foreground">Objectif : {stat.goal}</p>
                </div>
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
              </div>
              <Progress value={stat.progress} className="h-2" />
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-accent rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-2">💡 Conseil du jour</h3>
          <p className="text-sm text-muted-foreground">
            Pensez à vous hydrater régulièrement. Boire 1,5L d'eau par jour aide à rester en forme !
          </p>
        </div>
      </div>
    </div>
  );
}
