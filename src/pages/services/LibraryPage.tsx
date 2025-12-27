import { ArrowLeft, BookOpen, Headphones, Newspaper, BookMarked } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LibraryPage() {
  const navigate = useNavigate();

  const categories = [
    { icon: BookMarked, label: "Livres audio", count: 156, color: "text-blue-500", bg: "bg-blue-100" },
    { icon: Headphones, label: "Podcasts", count: 89, color: "text-purple-500", bg: "bg-purple-100" },
    { icon: Newspaper, label: "Journaux", count: 12, color: "text-orange-500", bg: "bg-orange-100" },
  ];

  const recent = [
    { id: 1, title: "Le Petit Prince", author: "Antoine de Saint-Exupéry", type: "Livre audio", emoji: "📖" },
    { id: 2, title: "Les Grosses Têtes", author: "RTL", type: "Podcast", emoji: "🎙️" },
    { id: 3, title: "Le Monde", author: "Quotidien", type: "Journal", emoji: "📰" },
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
          <h1 className="text-lg font-bold text-foreground">Bibliothèque & podcasts</h1>
          <p className="text-sm text-muted-foreground">Lecture et écoute</p>
        </div>
        <BookOpen className="w-6 h-6 text-primary" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Categories */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat, index) => (
            <button
              key={index}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:border-primary transition-colors"
            >
              <div className={`w-12 h-12 rounded-full ${cat.bg} flex items-center justify-center`}>
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <span className="font-medium text-foreground text-sm text-center">{cat.label}</span>
              <span className="text-xs text-muted-foreground">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Recent */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Récemment écouté
          </h2>
          {recent.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.author}</p>
                <span className="text-xs text-primary">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
