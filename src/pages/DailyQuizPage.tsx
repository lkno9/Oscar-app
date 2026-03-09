import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Check, X, Trophy, ArrowRight } from "lucide-react";
import { useEngagement } from "@/hooks/useEngagement";

// --- Types ---
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

// --- Ce jour-là dans l'histoire (bonus post-quiz) ---
const HISTORY_EVENTS: Record<string, { year: string; event: string; emoji: string }[]> = {
  "01-01": [{ year: "1804", event: "Haïti proclame son indépendance, devenant la première république noire.", emoji: "🗽" }],
  "01-15": [{ year: "1622", event: "Molière naît à Paris. Il deviendra le plus grand dramaturge français.", emoji: "🎭" }],
  "02-14": [{ year: "1779", event: "James Cook est tué à Hawaï lors de son troisième voyage d'exploration.", emoji: "🌊" }],
  "03-08": [{ year: "1910", event: "Clara Zetkin propose la Journée internationale des femmes.", emoji: "🌸" }],
  "03-09": [{ year: "1959", event: "La poupée Barbie est présentée au monde pour la première fois.", emoji: "🎀" }],
  "03-20": [{ year: "1811", event: "Naissance de Napoléon II, fils de Napoléon Bonaparte.", emoji: "👑" }],
  "04-01": [{ year: "1564", event: "Charles IX fixe le début de l'année au 1er janvier, créant le poisson d'avril.", emoji: "🐟" }],
  "04-15": [{ year: "1874", event: "Première exposition impressionniste à Paris avec Monet, Renoir, Degas.", emoji: "🎨" }],
  "05-01": [{ year: "1886", event: "Les ouvriers de Chicago revendiquent la journée de 8 heures de travail.", emoji: "✊" }],
  "05-08": [{ year: "1945", event: "L'Allemagne capitule. Fin de la Seconde Guerre mondiale en Europe.", emoji: "🕊️" }],
  "05-29": [{ year: "1953", event: "Edmund Hillary et Tenzing Norgay atteignent le sommet de l'Everest.", emoji: "🏔️" }],
  "06-06": [{ year: "1944", event: "Débarquement allié en Normandie. Le jour le plus long.", emoji: "⚓" }],
  "06-18": [{ year: "1940", event: "Le général de Gaulle lance son appel depuis Londres.", emoji: "📻" }],
  "07-14": [{ year: "1789", event: "Prise de la Bastille. La Révolution française commence.", emoji: "🇫🇷" }],
  "07-20": [{ year: "1969", event: "Neil Armstrong marche sur la Lune pour la première fois.", emoji: "🌙" }],
  "08-15": [{ year: "1947", event: "L'Inde obtient son indépendance du Royaume-Uni.", emoji: "🇮🇳" }],
  "08-25": [{ year: "1944", event: "Libération de Paris. Les Alliés entrent dans la capitale.", emoji: "🗼" }],
  "09-01": [{ year: "1715", event: "Mort de Louis XIV, le Roi-Soleil, après 72 ans de règne.", emoji: "☀️" }],
  "10-14": [{ year: "1947", event: "Chuck Yeager franchit le mur du son pour la première fois.", emoji: "✈️" }],
  "11-09": [{ year: "1989", event: "Chute du mur de Berlin. L'Europe se réunifie.", emoji: "🧱" }],
  "11-11": [{ year: "1918", event: "Armistice de la Première Guerre mondiale. La Grande Guerre est finie.", emoji: "🕊️" }],
  "12-10": [{ year: "1948", event: "L'ONU adopte la Déclaration universelle des droits de l'homme.", emoji: "📜" }],
  "12-25": [{ year: "1066", event: "Guillaume le Conquérant est couronné roi d'Angleterre.", emoji: "👑" }],
};

const MONTHLY_EVENTS: Record<string, { year: string; event: string; emoji: string }> = {
  "01": { year: "1863", event: "Le Métro de Londres inaugure le premier métro souterrain au monde.", emoji: "🚇" },
  "02": { year: "1858", event: "Bernadette Soubirous a ses visions à Lourdes.", emoji: "⛪" },
  "03": { year: "1889", event: "La Tour Eiffel est inaugurée pour l'Exposition universelle de Paris.", emoji: "🗼" },
  "04": { year: "1961", event: "Youri Gagarine devient le premier homme dans l'espace.", emoji: "🚀" },
  "05": { year: "1789", event: "Ouverture des États généraux à Versailles.", emoji: "🏛️" },
  "06": { year: "1940", event: "L'Appel du 18 juin du général de Gaulle.", emoji: "📻" },
  "07": { year: "1903", event: "Départ du premier Tour de France cycliste.", emoji: "🚴" },
  "08": { year: "1944", event: "Débarquement allié en Provence (Opération Dragoon).", emoji: "⚓" },
  "09": { year: "1981", event: "La France abolit la peine de mort sous Robert Badinter.", emoji: "⚖️" },
  "10": { year: "1793", event: "Inauguration du Musée du Louvre.", emoji: "🖼️" },
  "11": { year: "1918", event: "L'Armistice met fin à la Première Guerre mondiale.", emoji: "🕊️" },
  "12": { year: "1903", event: "Les frères Wright effectuent le premier vol motorisé.", emoji: "✈️" },
};

function getDailyHistory() {
  const now = new Date();
  const key = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const monthKey = String(now.getMonth() + 1).padStart(2, '0');
  const events = HISTORY_EVENTS[key];
  if (events && events.length > 0) return events[0];
  return MONTHLY_EVENTS[monthKey] || { year: "1889", event: "La Tour Eiffel est inaugurée pour l'Exposition universelle de Paris.", emoji: "🗼" };
}

// --- Banque de questions pour seniors ---
const QUIZ_BANK: QuizQuestion[] = [
  // Santé
  {
    question: "Combien de litres d'eau est-il recommandé de boire par jour ?",
    options: ["0,5 litre", "1 à 1,5 litre", "3 litres", "5 litres"],
    correctIndex: 1,
    explanation: "Il est recommandé de boire 1 à 1,5 litre d'eau par jour, soit environ 6 à 8 verres.",
    category: "Santé",
  },
  {
    question: "Quelle vitamine est produite grâce à l'exposition au soleil ?",
    options: ["Vitamine A", "Vitamine B12", "Vitamine C", "Vitamine D"],
    correctIndex: 3,
    explanation: "La vitamine D est synthétisée par la peau grâce aux rayons du soleil. Elle est essentielle pour les os.",
    category: "Santé",
  },
  {
    question: "Combien de minutes d'activité physique par jour recommande l'OMS pour les plus de 65 ans ?",
    options: ["10 minutes", "15 minutes", "30 minutes", "60 minutes"],
    correctIndex: 2,
    explanation: "L'OMS recommande au moins 30 minutes d'activité physique modérée par jour pour les seniors.",
    category: "Santé",
  },
  {
    question: "Quel aliment est la meilleure source de calcium ?",
    options: ["La viande rouge", "Les produits laitiers", "Le pain blanc", "Les pâtes"],
    correctIndex: 1,
    explanation: "Les produits laitiers (lait, fromage, yaourt) sont la meilleure source de calcium pour la santé des os.",
    category: "Santé",
  },
  // Sécurité numérique
  {
    question: "Que faire si vous recevez un e-mail vous demandant vos coordonnées bancaires ?",
    options: [
      "Répondre immédiatement",
      "Cliquer sur le lien fourni",
      "Le supprimer sans y répondre",
      "Le transférer à vos amis",
    ],
    correctIndex: 2,
    explanation: "Aucune banque ne vous demandera vos coordonnées par e-mail. Il s'agit probablement d'une arnaque (phishing).",
    category: "Sécurité",
  },
  {
    question: "Qu'est-ce qu'un bon mot de passe ?",
    options: [
      "Votre date de naissance",
      "Le nom de votre animal",
      "Un mélange de lettres, chiffres et symboles",
      "Le mot « motdepasse »",
    ],
    correctIndex: 2,
    explanation: "Un bon mot de passe contient au moins 12 caractères avec des lettres, chiffres et symboles variés.",
    category: "Sécurité",
  },
  {
    question: "Un SMS vous dit que votre colis est bloqué et demande 2 euros. Que faire ?",
    options: [
      "Payer les 2 euros",
      "Cliquer sur le lien",
      "Ignorer et supprimer le SMS",
      "Appeler le numéro indiqué",
    ],
    correctIndex: 2,
    explanation: "C'est une arnaque très courante. Les vrais transporteurs ne demandent jamais de paiement par SMS.",
    category: "Sécurité",
  },
  // Droits & Administration
  {
    question: "À quel âge peut-on percevoir sa retraite à taux plein (né après 1968) ?",
    options: ["60 ans", "62 ans", "64 ans", "67 ans"],
    correctIndex: 2,
    explanation: "Depuis la réforme de 2023, l'âge légal de départ à la retraite est progressivement relevé à 64 ans.",
    category: "Droits",
  },
  {
    question: "L'APA (Allocation Personnalisée d'Autonomie) est destinée aux personnes de quel âge ?",
    options: ["Plus de 50 ans", "Plus de 60 ans", "Plus de 65 ans", "Plus de 70 ans"],
    correctIndex: 1,
    explanation: "L'APA est accessible dès 60 ans pour les personnes en perte d'autonomie (GIR 1 à 4).",
    category: "Droits",
  },
  {
    question: "Quel organisme gère la carte Vitale ?",
    options: ["La CAF", "L'Assurance Maladie", "La mairie", "Pôle Emploi"],
    correctIndex: 1,
    explanation: "L'Assurance Maladie (CPAM) gère la carte Vitale et le remboursement des soins de santé.",
    category: "Droits",
  },
  // Culture Générale
  {
    question: "En quelle année l'euro est-il devenu la monnaie officielle en France ?",
    options: ["1999", "2000", "2002", "2004"],
    correctIndex: 2,
    explanation: "L'euro est devenu monnaie fiduciaire (pièces et billets) le 1er janvier 2002 en France.",
    category: "Culture",
  },
  {
    question: "Quelle est la plus longue rivière de France ?",
    options: ["La Seine", "Le Rhône", "La Loire", "La Garonne"],
    correctIndex: 2,
    explanation: "La Loire est le plus long fleuve de France avec environ 1 012 kilomètres.",
    category: "Culture",
  },
  {
    question: "Quel chanteur français est surnommé « le fou chantant » ?",
    options: ["Charles Aznavour", "Charles Trenet", "Jacques Brel", "Georges Brassens"],
    correctIndex: 1,
    explanation: "Charles Trenet était surnommé « le Fou chantant » pour son style joyeux et exubérant.",
    category: "Culture",
  },
  {
    question: "Combien de régions compte la France métropolitaine depuis 2016 ?",
    options: ["13", "18", "22", "26"],
    correctIndex: 0,
    explanation: "Depuis la réforme territoriale de 2016, la France métropolitaine compte 13 régions.",
    category: "Culture",
  },
  // Bien-être
  {
    question: "Quelle activité est particulièrement recommandée pour l'équilibre chez les seniors ?",
    options: ["La course à pied", "Le tai-chi", "L'haltérophilie", "Le saut en hauteur"],
    correctIndex: 1,
    explanation: "Le tai-chi améliore l'équilibre, la souplesse et réduit le risque de chute chez les seniors.",
    category: "Bien-être",
  },
  {
    question: "Quelle est la meilleure position pour dormir et préserver son dos ?",
    options: [
      "Sur le ventre",
      "Sur le dos, jambes légèrement surélevées",
      "Assis dans un fauteuil",
      "Debout contre un mur",
    ],
    correctIndex: 1,
    explanation: "Dormir sur le dos avec les jambes légèrement surélevées soulage la pression sur la colonne vertébrale.",
    category: "Bien-être",
  },
  {
    question: "Combien d'heures de sommeil sont recommandées pour un adulte de plus de 65 ans ?",
    options: ["4 à 5 heures", "5 à 6 heures", "7 à 8 heures", "10 à 12 heures"],
    correctIndex: 2,
    explanation: "Les experts recommandent 7 à 8 heures de sommeil par nuit, même pour les seniors.",
    category: "Bien-être",
  },
  // Numérique
  {
    question: "Que signifie le cadenas dans la barre d'adresse d'un navigateur web ?",
    options: [
      "Le site est payant",
      "La connexion est sécurisée (HTTPS)",
      "Le site est bloqué",
      "Vous êtes connecté",
    ],
    correctIndex: 1,
    explanation: "Le cadenas indique une connexion sécurisée (HTTPS). Vos données sont chiffrées pendant le transfert.",
    category: "Numérique",
  },
  {
    question: "Comment agrandir le texte sur un écran de téléphone ou tablette ?",
    options: [
      "Secouer l'appareil",
      "Écarter deux doigts sur l'écran",
      "Appuyer longtemps sur le texte",
      "Souffler sur l'écran",
    ],
    correctIndex: 1,
    explanation: "Le geste de « pinch-to-zoom » (écarter deux doigts) permet d'agrandir le contenu à l'écran.",
    category: "Numérique",
  },
  {
    question: "Quel est le raccourci pour copier un texte sur un ordinateur ?",
    options: ["Ctrl + V", "Ctrl + X", "Ctrl + C", "Ctrl + Z"],
    correctIndex: 2,
    explanation: "Ctrl + C permet de copier. Ctrl + V pour coller, Ctrl + X pour couper, Ctrl + Z pour annuler.",
    category: "Numérique",
  },
];

function getTodayQuestions(count: number = 5): QuizQuestion[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  // Mélange déterministe basé sur le jour
  const shuffled = [...QUIZ_BANK];
  let seed = dayOfYear * 2654435761;
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function DailyQuizPage() {
  const navigate = useNavigate();
  const { todayQuiz, recordQuiz } = useEngagement();
  const [questions] = useState<QuizQuestion[]>(() => getTodayQuestions(5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  // Si déjà fait aujourd'hui
  const alreadyDone = !!todayQuiz;

  const currentQ = questions[currentIdx];

  const handleSelect = useCallback(
    (idx: number) => {
      if (selectedAnswer !== null) return; // Déjà répondu
      setSelectedAnswer(idx);
      setShowResult(true);
      const correct = idx === currentQ.correctIndex;
      if (correct) setScore((prev) => prev + 1);
      setAnswers((prev) => [...prev, idx]);
    },
    [selectedAnswer, currentQ]
  );

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz terminé
      setFinished(true);
      const finalScore = score + (selectedAnswer === currentQ.correctIndex ? 0 : 0);
      recordQuiz(finalScore, questions.length);
    }
  }, [currentIdx, questions.length, score, selectedAnswer, currentQ, recordQuiz]);

  // --- ÉCRAN RÉSULTAT FINAL ---
  if (finished || alreadyDone) {
    const displayScore = alreadyDone ? todayQuiz!.score : score;
    const displayTotal = alreadyDone ? todayQuiz!.total_questions : questions.length;
    const pct = Math.round((displayScore / displayTotal) * 100);
    const starsEarned = displayScore;

    return (
      <div
        className="flex flex-col h-full bg-background"
        style={{ fontFamily: "'Inter', 'Nunito', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3" style={{ padding: "16px 16px 0" }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center bg-secondary"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
            }}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }}>Quiz du jour</h1>
        </div>

        {/* Résultat */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "24px 24px" }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background:
                pct >= 80
                  ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                  : pct >= 50
                  ? "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)"
                  : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-foreground" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            {alreadyDone ? "Quiz déjà complété !" : pct >= 80 ? "Excellent !" : pct >= 50 ? "Bien joué !" : "Pas mal !"}
          </h2>

          <p style={{ fontSize: 40, fontWeight: 800, color: "#48A29E", marginBottom: 4 }}>
            {displayScore}/{displayTotal}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 24 }}>bonnes réponses</p>

          {/* Étoiles gagnées */}
          <div
            style={{
              background: "linear-gradient(135deg, #fef9e7 0%, #fdf2e9 100%)",
              border: "1.5px solid #fdebd0",
              borderRadius: 16,
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 32,
            }}
          >
            <Star className="w-6 h-6 text-yellow-500" fill="#eab308" />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#92400e" }}>
              +{starsEarned} {starsEarned > 1 ? "étoiles" : "étoile"} gagnée{starsEarned > 1 ? "s" : ""}
            </span>
          </div>

          {/* Le saviez-vous ? — fait historique du jour */}
          {(() => {
            const history = getDailyHistory();
            return (
              <div
                style={{
                  background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 24,
                  width: "100%",
                  maxWidth: 360,
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{history.emoji}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Le saviez-vous ? — {history.year}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.45, color: "#374151" }}>
                    {history.event}
                  </p>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "14px 32px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(72,162,158,0.3)",
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // --- ÉCRAN QUESTION ---
  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#f8fafc", fontFamily: "'Inter', 'Nunito', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: "16px 16px 8px" }}>
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#f1f5f9",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }}>Quiz du jour</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-500" fill="#eab308" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>{score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 16px 8px" }}>
        <div
          style={{
            height: 6,
            background: "hsl(var(--border))",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #48A29E, #2d9e99)",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "right" }}>
          Question {currentIdx + 1}/{questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "8px 16px 24px" }}>
        {/* Catégorie */}
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            color: "#48A29E",
            background: "rgba(72,162,158,0.08)",
            borderRadius: 99,
            padding: "4px 12px",
            marginBottom: 12,
          }}
        >
          {currentQ.category}
        </span>

        <h2
          className="text-foreground"
          style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.35,
            marginBottom: 24,
          }}
        >
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const showCorrectness = showResult;

            let bg = "hsl(var(--card))";
            let border = "1.5px solid hsl(var(--border))";
            let iconEl: React.ReactNode = null;

            if (showCorrectness) {
              if (isCorrect) {
                bg = "rgba(34,197,94,0.06)";
                border = "2px solid #22c55e";
                iconEl = (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                );
              } else if (isSelected && !isCorrect) {
                bg = "rgba(239,68,68,0.06)";
                border = "2px solid #ef4444";
                iconEl = (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </div>
                );
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                className="flex items-center gap-3 w-full text-left"
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: bg,
                  border,
                  cursor: showResult ? "default" : "pointer",
                  transition: "all 0.2s",
                  opacity: showResult && !isCorrect && !isSelected ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isSelected && !showResult ? "#48A29E" : "hsl(var(--secondary))",
                    border: isSelected && !showResult ? "none" : "1.5px solid hsl(var(--border))",
                    display: showCorrectness && (isCorrect || isSelected) ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected && !showResult ? "#fff" : "#94a3b8",
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                {iconEl}
                <span
                  className="text-foreground"
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected || (showCorrectness && isCorrect) ? 600 : 400,
                    flex: 1,
                  }}
                >
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {showResult && (
          <div
            style={{
              marginTop: 20,
              background: "rgba(72,162,158,0.06)",
              border: "1.5px solid rgba(72,162,158,0.15)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: "#48A29E", marginBottom: 4 }}>
              Explication
            </p>
            <p className="text-foreground" style={{ fontSize: 13, lineHeight: 1.45 }}>
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Bouton suivant */}
        {showResult && (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2"
            style={{
              marginTop: 20,
              padding: "14px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #48A29E 0%, #2d9e99 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(72,162,158,0.3)",
            }}
          >
            {currentIdx < questions.length - 1 ? (
              <>
                Question suivante <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Voir mes résultats <Trophy className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
