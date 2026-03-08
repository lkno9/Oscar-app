import { ArrowLeft, Newspaper } from "lucide-react";
import { useRssArticles, ACTU_CATEGORIES, timeAgo } from "@/hooks/useRssArticles";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export function KnowledgePage() {
  const goBack = useBackNavigation();
  const { filteredArticles, loading, actuCat, setActuCat } = useRssArticles({
    perSource: 6,
    descMaxLength: 200,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header fixe */}
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">À savoir</h1>
          <p className="text-sm text-muted-foreground">
            Actualités, droits, santé & conseils
          </p>
        </div>
        <Newspaper className="w-6 h-6 text-primary" />
      </header>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Category pills */}
        <div className="sticky top-0 z-[5] bg-background px-4 pt-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {ACTU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActuCat(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: actuCat === cat ? 600 : 500,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  background: actuCat === cat ? "#48A29E" : "#f1f5f9",
                  color: actuCat === cat ? "#fff" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles en grille verticale */}
        <div className="px-4 pb-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl animate-pulse"
                  style={{ height: 120 }}
                />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-3">
              {filteredArticles.map((a, i) => (
                <a
                  key={i}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border border-border rounded-2xl no-underline active:scale-[0.99] transition-transform"
                  style={{
                    padding: "16px 18px",
                    textDecoration: "none",
                  }}
                >
                  {/* Badge catégorie */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#48A29E",
                        background: "rgba(72,162,158,0.08)",
                        borderRadius: 99,
                        padding: "3px 10px",
                      }}
                    >
                      {a.category}
                    </span>
                  </div>

                  {/* Titre */}
                  <p
                    className="text-foreground"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      marginBottom: 6,
                    }}
                  >
                    {a.title}
                  </p>

                  {/* Description (plus longue ici) */}
                  {a.description && (
                    <p
                      className="text-muted-foreground"
                      style={{
                        fontSize: 14,
                        lineHeight: 1.45,
                        marginBottom: 10,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}
                    >
                      {a.description}
                    </p>
                  )}

                  {/* Source + date */}
                  <div className="flex items-center justify-between">
                    <span
                      style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}
                    >
                      {a.source}
                    </span>
                    <span style={{ fontSize: 13, color: "#b0b8c4" }}>
                      {timeAgo(a.pubDate)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-card border border-border rounded-2xl p-10 text-center">
              <span style={{ fontSize: 40, marginBottom: 12 }}>📰</span>
              <p
                className="text-muted-foreground"
                style={{ fontSize: 15, lineHeight: 1.5 }}
              >
                Aucun article dans cette catégorie pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
