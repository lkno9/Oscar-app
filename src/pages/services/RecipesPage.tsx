import { useState } from "react";
import { ArrowLeft, ChefHat, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface Recipe {
  id: string;
  title: string;
  region: string;
  emoji: string;
  time: string;
  servings: number;
  difficulty: "Facile" | "Moyen";
  description: string;
  ingredients: string[];
  steps: string[];
}

const REGIONS = ["Toutes", "Provence", "Bretagne", "Alsace", "Sud-Ouest", "Lyon", "Normandie", "Bourgogne", "Savoie"];

const RECIPES: Recipe[] = [
  {
    id: "ratatouille",
    title: "Ratatouille provençale",
    region: "Provence",
    emoji: "🍆",
    time: "45 min",
    servings: 4,
    difficulty: "Facile",
    description: "Le plat emblématique du sud, avec les légumes du soleil.",
    ingredients: ["2 courgettes", "1 aubergine", "2 poivrons", "4 tomates", "2 oignons", "3 gousses d'ail", "Huile d'olive", "Herbes de Provence", "Sel, poivre"],
    steps: ["Coupez tous les légumes en dés.", "Faites revenir les oignons et l'ail dans l'huile d'olive.", "Ajoutez les poivrons, puis les aubergines.", "Après 10 min, ajoutez les courgettes et tomates.", "Assaisonnez avec les herbes, sel et poivre.", "Laissez mijoter 30 min à feu doux en remuant."],
  },
  {
    id: "crepes",
    title: "Crêpes bretonnes",
    region: "Bretagne",
    emoji: "🥞",
    time: "30 min",
    servings: 6,
    difficulty: "Facile",
    description: "Les vraies crêpes de froment, fines et dorées.",
    ingredients: ["250g de farine", "4 œufs", "50cl de lait", "2 c. à soupe de beurre fondu", "1 pincée de sel", "2 c. à soupe de sucre"],
    steps: ["Mélangez la farine, le sel et le sucre.", "Ajoutez les œufs un à un en fouettant.", "Versez le lait progressivement en remuant.", "Ajoutez le beurre fondu et mélangez.", "Laissez reposer la pâte 1 heure.", "Faites cuire dans une poêle chaude beurrée."],
  },
  {
    id: "choucroute",
    title: "Choucroute alsacienne",
    region: "Alsace",
    emoji: "🥬",
    time: "2h",
    servings: 6,
    difficulty: "Moyen",
    description: "Le grand classique alsacien, généreux et convivial.",
    ingredients: ["1kg de choucroute crue", "600g de palette fumée", "4 saucisses de Strasbourg", "4 pommes de terre", "1 oignon", "30cl de vin blanc d'Alsace", "Baies de genièvre", "Laurier"],
    steps: ["Rincez la choucroute et égouttez-la.", "Faites revenir l'oignon émincé dans du saindoux.", "Ajoutez la choucroute, le vin blanc et les épices.", "Posez la palette fumée sur la choucroute.", "Laissez mijoter 1h30 à couvert.", "Ajoutez les saucisses et pommes de terre 30 min avant la fin."],
  },
  {
    id: "cassoulet",
    title: "Cassoulet toulousain",
    region: "Sud-Ouest",
    emoji: "🫘",
    time: "3h",
    servings: 6,
    difficulty: "Moyen",
    description: "Le plat réconfortant du Sud-Ouest, riche en saveurs.",
    ingredients: ["500g de haricots lingots", "4 cuisses de canard confites", "4 saucisses de Toulouse", "200g de lard", "2 oignons", "4 gousses d'ail", "Bouquet garni", "Chapelure"],
    steps: ["Faites tremper les haricots la veille.", "Cuisez-les 1h dans de l'eau avec le bouquet garni.", "Faites revenir le lard et les oignons.", "Dans un plat en terre, alternez haricots et viandes.", "Saupoudrez de chapelure.", "Enfournez 1h30 à 160°C en cassant la croûte 2-3 fois."],
  },
  {
    id: "quenelles",
    title: "Quenelles de brochet sauce Nantua",
    region: "Lyon",
    emoji: "🐟",
    time: "1h30",
    servings: 4,
    difficulty: "Moyen",
    description: "Un classique de la cuisine lyonnaise, fondant et délicat.",
    ingredients: ["300g de chair de brochet", "100g de beurre", "100g de farine", "3 œufs", "20cl de crème fraîche", "Beurre d'écrevisse", "Sel, poivre, muscade"],
    steps: ["Préparez une panade : beurre, eau, farine comme une pâte à choux.", "Mixez la chair de brochet très finement.", "Incorporez la panade refroidie et les œufs.", "Formez les quenelles avec 2 cuillères.", "Pochez-les 10 min dans de l'eau frémissante.", "Nappez de sauce Nantua et gratinez 15 min au four."],
  },
  {
    id: "tarte-tatin",
    title: "Tarte Tatin",
    region: "Normandie",
    emoji: "🍎",
    time: "50 min",
    servings: 6,
    difficulty: "Facile",
    description: "La tarte renversée aux pommes caramélisées.",
    ingredients: ["1 pâte feuilletée", "6 pommes Golden", "100g de beurre", "120g de sucre", "1 pincée de cannelle"],
    steps: ["Préchauffez le four à 200°C.", "Faites un caramel avec le sucre et le beurre dans un moule.", "Épluchez et coupez les pommes en quartiers.", "Disposez les pommes sur le caramel, côté bombé.", "Recouvrez de pâte feuilletée en rentrant les bords.", "Enfournez 30 min. Retournez à la sortie du four."],
  },
  {
    id: "boeuf-bourguignon",
    title: "Bœuf bourguignon",
    region: "Bourgogne",
    emoji: "🥩",
    time: "3h",
    servings: 6,
    difficulty: "Moyen",
    description: "Le grand plat mijoté bourguignon, tendre et parfumé.",
    ingredients: ["1kg de bœuf à braiser", "75cl de vin rouge de Bourgogne", "200g de lardons", "200g de champignons", "2 carottes", "2 oignons", "2 gousses d'ail", "Bouquet garni", "Farine"],
    steps: ["Coupez le bœuf en gros cubes.", "Faites mariner la viande dans le vin rouge une nuit.", "Égouttez et faites revenir la viande dans l'huile.", "Ajoutez les lardons et les oignons.", "Saupoudrez de farine, mélangez.", "Mouillez avec le vin de la marinade.", "Ajoutez carottes, ail et bouquet garni.", "Laissez mijoter 2h30 à feu doux. Ajoutez les champignons 30 min avant la fin."],
  },
  {
    id: "tartiflette",
    title: "Tartiflette",
    region: "Savoie",
    emoji: "🧀",
    time: "45 min",
    servings: 4,
    difficulty: "Facile",
    description: "Le gratin savoyard au reblochon, gourmand et réconfortant.",
    ingredients: ["1kg de pommes de terre", "1 reblochon entier", "200g de lardons", "2 oignons", "20cl de crème fraîche", "Sel, poivre"],
    steps: ["Cuisez les pommes de terre à l'eau 20 min.", "Faites revenir lardons et oignons émincés.", "Coupez les pommes de terre en rondelles.", "Dans un plat, alternez pommes de terre et lardons.", "Nappez de crème fraîche.", "Coupez le reblochon en deux et posez-le dessus.", "Enfournez 20 min à 200°C."],
  },
];

export function RecipesPage() {
  const goBack = useBackNavigation();
  const [selectedRegion, setSelectedRegion] = useState("Toutes");
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const filtered = selectedRegion === "Toutes"
    ? RECIPES
    : RECIPES.filter(r => r.region === selectedRegion);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors" aria-label="Retour">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Recettes de nos régions</h1>
              <p className="text-sm text-muted-foreground">La cuisine française traditionnelle</p>
            </div>
          </div>
        </div>
      </header>

      {/* Region pills */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className="flex-shrink-0"
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: selectedRegion === region ? "#48A29E" : "#f1f5f9",
                color: selectedRegion === region ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes */}
      <div className="flex-1 p-4 space-y-4 pb-24">
        {filtered.map((recipe) => {
          const isExpanded = expandedRecipe === recipe.id;
          return (
            <div
              key={recipe.id}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {/* Recipe Header */}
              <button
                onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start gap-4">
                  <span style={{ fontSize: 40 }}>{recipe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base mb-1">{recipe.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{recipe.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                        {recipe.region}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /> {recipe.time}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" /> {recipe.servings} pers.
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        recipe.difficulty === "Facile" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  {/* Ingredients */}
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      🛒 Ingrédients
                    </h4>
                    <ul className="space-y-1.5">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps */}
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                      👨‍🍳 Préparation
                    </h4>
                    <ol className="space-y-3">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-foreground/80">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
