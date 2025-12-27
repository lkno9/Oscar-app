import { ArrowLeft, Lock, Shield, Key, FileCheck, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function VaultPage() {
  const navigate = useNavigate();

  const items = [
    { id: 1, name: "Carte bancaire", type: "Paiement", icon: "💳", date: "Ajouté le 15 Nov" },
    { id: 2, name: "Code alarme", type: "Sécurité", icon: "🔐", date: "Ajouté le 10 Oct" },
    { id: 3, name: "Mot de passe WiFi", type: "Réseau", icon: "📶", date: "Ajouté le 05 Sep" },
    { id: 4, name: "Code carte vitale", type: "Santé", icon: "🏥", date: "Ajouté le 01 Août" },
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
          <h1 className="text-lg font-bold text-foreground">Coffre-fort numérique</h1>
          <p className="text-sm text-muted-foreground">Vos données sécurisées</p>
        </div>
        <Lock className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Security info */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3 border border-green-200 dark:border-green-800">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Coffre-fort sécurisé</p>
            <p className="text-sm text-green-600 dark:text-green-500">Chiffrement de bout en bout</p>
          </div>
        </div>

        <Button className="w-full gap-2" size="lg">
          <Plus className="w-5 h-5" />
          Ajouter un élément
        </Button>

        {/* Items */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Key className="w-4 h-4" />
            Éléments stockés
          </h2>
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.type}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <FileCheck className="w-5 h-5 text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
