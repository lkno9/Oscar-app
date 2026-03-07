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
        className="flex flex-col h-full"
        style={{ background: "#f8fafc", fontFamily: "'Inter', 'Nunito', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3" style={{ padding: "16px 16px 0" }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Quiz du jour</h1>
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

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            {alreadyDone ? "Quiz déjà complété !" : pct >= 80 ? "Excellent !" : pct >= 50 ? "Bien joué !" : "Pas mal !"}
          </h2>

          <p style={{ fontSize: 40, fontWeight: 800, color: "#48A29E", marginBottom: 4 }}>
            {displayScore}/{displayTotal}
          </p>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>bonnes réponses</p>

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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Quiz du jour</h1>
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
            background: "#e2e8f0",
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
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1e293b",
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

            let bg = "#fff";
            let border = "1.5px solid #e2e8f0";
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
                    background: isSelected && !showResult ? "#48A29E" : "#f1f5f9",
                    border: isSelected && !showResult ? "none" : "1.5px solid #e2e8f0",
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
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected || (showCorrectness && isCorrect) ? 600 : 400,
                    color: "#1e293b",
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
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.45 }}>
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
