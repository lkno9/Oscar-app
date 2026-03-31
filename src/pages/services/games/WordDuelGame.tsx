import { ArrowLeft, RotateCcw, Trophy, Users, Timer, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// Word categories with letters to find words from
const ROUNDS = [
  { letters: "AEILNRS", theme: "Trouvez le plus de mots !", minLength: 3 },
  { letters: "AEIOUBT", theme: "Trouvez le plus de mots !", minLength: 3 },
  { letters: "CMORTAE", theme: "Trouvez le plus de mots !", minLength: 3 },
  { letters: "PLAINES", theme: "Trouvez le plus de mots !", minLength: 3 },
  { letters: "DOUNRET", theme: "Trouvez le plus de mots !", minLength: 3 },
  { letters: "FGLOIRE", theme: "Trouvez le plus de mots !", minLength: 3 },
];

// French word dictionary - common words for validation
const VALID_WORDS = new Set([
  // 3 lettres
  "air", "ale", "ane", "are", "bas", "bat", "bel", "bio", "bit", "boa", "bon", "bot", "but",
  "car", "cas", "cor", "eau", "eta", "île", "ire", "lai", "las", "les", "lin", "lit",
  "mal", "mer", "met", "mil", "mot", "mue", "net", "nie", "nit", "nos", "ore", "par",
  "pas", "pie", "pin", "pli", "rai", "ras", "rat", "ria", "rie", "roi", "rot",
  "rue", "sel", "sir", "soi", "sol", "son", "sur", "tas", "ter", "the", "top", "tri",
  "une", "uni", "vie", "vin",
  // 4 lettres
  "aine", "aire", "aile", "ales", "amer", "anes", "arme", "arts", "aube", "auto",
  "baie", "bain", "bate", "beau", "bile", "bite", "bloc", "bleu", "bois", "bone", "bore", "bout",
  "ciel", "cite", "clef", "come", "core", "cote", "cour", "crie",
  "dire", "dome", "done", "dore", "dune", "dure",
  "elan", "etre",
  "faire", "file", "fine", "flot", "foie", "font", "fort",
  "gare", "gite", "gloire", "gris", "gros",
  "haie", "hier",
  "iles", "iris",
  "joie", "joli", "jour",
  "lame", "lane", "lien", "lieu", "lime", "line", "lire", "loin", "lune",
  "main", "male", "mare", "mate", "mire", "mise", "mite", "mode", "mole", "mont", "more", "mote", "mure",
  "naif", "naît", "nait", "noel", "noir", "note", "noue",
  "oeil", "once", "onze", "oral", "oser",
  "paie", "pain", "pair", "pale", "pare", "pars", "pile", "pine", "plan", "plie", "pneu", "pole", "pont",
  "raie", "rame", "rase", "rien", "rime", "robe", "rode", "role", "rond", "rose", "roue", "rude", "ruse",
  "sage", "sale", "sain", "sein", "semi", "seul", "sien", "soie", "soin", "sole", "sort",
  "taie", "tale", "tare", "tige", "tire", "toil", "tome", "tone", "tore", "tour", "trio", "trou", "tube",
  "unir", "user",
  "vase", "vein", "vent", "vers", "vide", "vile", "vine", "voie", "voir", "vote",
  // 5 lettres
  "aimer", "aline", "amour", "arbre", "arene", "atome",
  "baiser", "blanc", "boire", "botte", "boite", "brise", "butte",
  "calme", "carte", "chant", "chose", "clair", "coeur", "conte", "copie", "corne", "corse", "coter", "crane", "crete", "crire",
  "danse", "delit", "droit", "duret",
  "ecart", "ecrin", "elire", "email", "encre", "envie", "etoile",
  "flair", "fleur", "forge", "forme", "forte", "frein",
  "geler", "genre", "gilet", "glace", "globe", "grace", "grain", "grise",
  "haine", "herbe", "honte",
  "image", "inter",
  "jeune", "jouer", "juger",
  "laine", "laser", "liber", "liner", "lires", "livre", "loger", "luire",
  "marin", "melon", "merci", "miner", "miser", "monte", "motel", "moule",
  "nager", "nappe", "noble", "norme", "noter", "notre", "nuire",
  "orage", "ordre", "outre",
  "paire", "panel", "parle", "peine", "peler", "pente", "perle", "piler", "pilon", "piste", "place", "plage", "plein", "plier", "poeme", "poire", "porte", "poste", "prune",
  "reine", "relie", "renom", "rente", "ronde", "route",
  "sable", "saler", "salon", "serpe", "serin", "sirop", "sobre", "soeur", "sorte", "store",
  "table", "taire", "talon", "tapis", "terme", "terre", "toise", "toile", "torse", "trace", "train", "trame", "tripe",
  "ulcer", "unite", "urner",
  "valet", "venir", "vente", "veste", "vibre", "virer", "vitre", "voile",
  // 6+ lettres
  "aérien", "airain", "alerté", "alpine", "amener", "animal", "ariser",
  "blouse", "bonite", "bourse", "braise",
  "camion", "cantor", "carnet", "castor", "centre", "cinema", "cloner", "combat", "comite", "copain", "cornet", "course", "craint", "croire",
  "detail", "donner", "dormir",
  "eclair", "eprise", "espoir", "etoile",
  "famille", "favori", "flacon", "foudre", "fourni",
  "garcon", "gloire", "grappe", "grenat", "grotte",
  "insole", "ironie",
  "jardin", "jasmin", "joueur",
  "lainer", "lanier", "lianes", "linéar", "lisane",
  "maitre", "marine", "merlan", "minéra", "mobile", "moulin",
  "nature", "notaire",
  "oiseau", "orange", "orient",
  "palier", "parole", "patron", "plaine", "plaire", "plants", "plonge", "police", "pointe",
  "raison", "rapide", "raisin", "relais", "renais", "risque", "romane",
  "saline", "saluer", "saumon", "senior", "serial", "soleil", "source",
  "temple", "tendre", "tomate", "touner", "troupe",
  "utiles",
  "valeur", "ventre", "vernis", "voiture",
]);

function canFormWord(word: string, letters: string): boolean {
  const available = letters.toLowerCase().split("");
  for (const char of word.toLowerCase()) {
    const idx = available.indexOf(char);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

function isValidWord(word: string): boolean {
  return VALID_WORDS.has(word.toLowerCase());
}

const ROUND_TIME = 60; // seconds per round per player

type GamePhase = "setup" | "player1" | "transition" | "player2" | "results";

export function WordDuelGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();

  const [player1Name, setPlayer1Name] = useState("Joueur 1");
  const [player2Name, setPlayer2Name] = useState("Joueur 2");
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [roundIndex, setRoundIndex] = useState(0);
  const [input, setInput] = useState("");
  const [p1Words, setP1Words] = useState<string[]>([]);
  const [p2Words, setP2Words] = useState<string[]>([]);
  const [p1TotalScore, setP1TotalScore] = useState(0);
  const [p2TotalScore, setP2TotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [startTime, setStartTime] = useState(Date.now());
  const [roundNumber, setRoundNumber] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const currentRound = ROUNDS[roundIndex % ROUNDS.length];

  // Timer
  useEffect(() => {
    if (phase === "player1" || phase === "player2") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            if (phase === "player1") {
              setPhase("transition");
            } else {
              setPhase("results");
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "results" && !savedRef.current) {
      savedRef.current = true;
      saveSession();
    }
  }, [phase]);

  const saveSession = async () => {
    if (!user) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const p1s = calcScore(p1Words);
    const p2s = calcScore(p2Words);
    await supabase.from("game_sessions").insert({
      user_id: user.id,
      game_type: "word_duel",
      score: p1s + p2s,
      success: true,
      duration_seconds: duration,
    });
  };

  const calcScore = (words: string[]): number => {
    return words.reduce((acc, w) => {
      if (w.length === 3) return acc + 1;
      if (w.length === 4) return acc + 3;
      if (w.length === 5) return acc + 5;
      if (w.length === 6) return acc + 8;
      return acc + 12;
    }, 0);
  };

  const startGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      toast.error("Entrez les deux prénoms !");
      return;
    }
    setRoundIndex(Math.floor(Math.random() * ROUNDS.length));
    setPhase("player1");
    setP1Words([]);
    setP2Words([]);
    setTimeLeft(ROUND_TIME);
    setStartTime(Date.now());
    savedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startPlayer2 = () => {
    setPhase("player2");
    setTimeLeft(ROUND_TIME);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitWord = () => {
    const word = input.trim().toLowerCase();
    setInput("");

    if (word.length < currentRound.minLength) {
      toast.error(`Le mot doit faire au moins ${currentRound.minLength} lettres !`, { duration: 1500 });
      return;
    }

    if (!canFormWord(word, currentRound.letters)) {
      toast.error("Utilisez uniquement les lettres disponibles !", { duration: 1500 });
      return;
    }

    const currentWords = phase === "player1" ? p1Words : p2Words;
    if (currentWords.includes(word)) {
      toast.error("Mot déjà trouvé !", { duration: 1500 });
      return;
    }

    if (!isValidWord(word)) {
      toast.error("Mot non reconnu !", { duration: 1500 });
      return;
    }

    if (phase === "player1") {
      setP1Words([...p1Words, word]);
    } else {
      setP2Words([...p2Words, word]);
    }

    const points = word.length === 3 ? 1 : word.length === 4 ? 3 : word.length === 5 ? 5 : word.length >= 6 ? 8 : 0;
    toast.success(`+${points} pts ! "${word.toUpperCase()}"`, { duration: 1200 });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitWord();
    }
  };

  const newRound = () => {
    setP1TotalScore(t => t + calcScore(p1Words));
    setP2TotalScore(t => t + calcScore(p2Words));
    setRoundNumber(r => r + 1);
    setRoundIndex(Math.floor(Math.random() * ROUNDS.length));
    setP1Words([]);
    setP2Words([]);
    setPhase("player1");
    setTimeLeft(ROUND_TIME);
    setInput("");
    savedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const newMatch = () => {
    setP1TotalScore(0);
    setP2TotalScore(0);
    setRoundNumber(1);
    setPhase("setup");
    setP1Words([]);
    setP2Words([]);
    setInput("");
    savedRef.current = false;
  };

  const currentPlayerName = phase === "player1" ? player1Name : player2Name;
  const currentWords = phase === "player1" ? p1Words : p2Words;
  const currentScore = calcScore(currentWords);

  // Setup
  if (phase === "setup") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Bataille de Mots</h1>
            <p className="text-sm text-muted-foreground">Duel de vocabulaire !</p>
          </div>
          <Users className="w-6 h-6 text-primary" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Bataille de Mots</h2>
            <p className="text-muted-foreground">
              Formez un maximum de mots avec les lettres données en {ROUND_TIME} secondes !
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Joueur 1 🔵</label>
              <input
                type="text"
                value={player1Name}
                onChange={e => setPlayer1Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Joueur 2 🔴</label>
              <input
                type="text"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg focus:border-primary focus:outline-none"
                placeholder="Prénom..."
                maxLength={15}
              />
            </div>

            <div className="bg-accent rounded-xl p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">📖 Règles :</p>
              <ul className="space-y-1">
                <li>• Chaque joueur a {ROUND_TIME}s pour trouver des mots</li>
                <li>• Utilisez uniquement les lettres proposées</li>
                <li>• 3 lettres = 1 pt, 4 = 3 pts, 5 = 5 pts, 6+ = 8 pts</li>
                <li>• Les mots longs rapportent plus !</li>
              </ul>
            </div>

            <Button size="lg" className="w-full text-lg py-6" onClick={startGame}>
              🎮 Commencer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transition screen
  if (phase === "transition") {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Bataille de Mots</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Au tour de {player2Name} !</h2>
            <p className="text-muted-foreground mb-2">
              {player1Name} a trouvé {p1Words.length} mots ({calcScore(p1Words)} points).
            </p>
            <p className="text-lg text-foreground font-medium">
              Passez l'appareil à {player2Name} !
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ⚠️ {player2Name}, ne regardez pas les mots de {player1Name} !
            </p>
          </div>
          <Button size="lg" className="text-lg py-6 px-8" onClick={startPlayer2}>
            🎯 C'est parti, {player2Name} !
          </Button>
        </div>
      </div>
    );
  }

  // Results
  if (phase === "results") {
    const p1s = calcScore(p1Words);
    const p2s = calcScore(p2Words);
    const winner = p1s > p2s ? player1Name : p2s > p1s ? player2Name : null;
    // Find common words
    const commonWords = p1Words.filter(w => p2Words.includes(w));

    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Résultats</h1>
            <p className="text-sm text-muted-foreground">Manche {roundNumber}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-2" />
            <h2 className="text-xl font-bold text-foreground">
              {winner ? `${winner} gagne ! 🎉` : "Égalité ! 🤝"}
            </h2>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{p1s}</p>
                <p className="text-sm font-medium text-foreground">{player1Name}</p>
                <p className="text-xs text-muted-foreground">{p1Words.length} mots</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{p2s}</p>
                <p className="text-sm font-medium text-foreground">{player2Name}</p>
                <p className="text-xs text-muted-foreground">{p2Words.length} mots</p>
              </div>
            </div>
          </div>

          {commonWords.length > 0 && (
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-sm text-muted-foreground">
                🤝 Mots en commun : {commonWords.map(w => w.toUpperCase()).join(", ")}
              </p>
            </div>
          )}

          {/* Words lists */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p className="font-medium text-blue-600 dark:text-blue-400 text-sm mb-2">{player1Name}</p>
              <div className="flex flex-wrap gap-1">
                {p1Words.map((w, i) => (
                  <span key={i} className="bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium uppercase">
                    {w}
                  </span>
                ))}
                {p1Words.length === 0 && <p className="text-xs text-muted-foreground">Aucun mot</p>}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <p className="font-medium text-red-600 dark:text-red-400 text-sm mb-2">{player2Name}</p>
              <div className="flex flex-wrap gap-1">
                {p2Words.map((w, i) => (
                  <span key={i} className="bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs font-medium uppercase">
                    {w}
                  </span>
                ))}
                {p2Words.length === 0 && <p className="text-xs text-muted-foreground">Aucun mot</p>}
              </div>
            </div>
          </div>

          {(p1TotalScore > 0 || p2TotalScore > 0) && (
            <div className="text-center text-sm text-muted-foreground">
              Score total : {player1Name} {p1TotalScore + p1s} - {p2TotalScore + p2s} {player2Name}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={newRound}>
              ▶️ Nouvelle manche
            </Button>
            <Button variant="outline" onClick={newMatch}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Nouveau match
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game play
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={goBack} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Tour de {currentPlayerName}</h1>
          <p className="text-sm text-muted-foreground">{currentWords.length} mots trouvés</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
          timeLeft <= 10 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
        }`}>
          <Timer className="w-4 h-4" />
          {timeLeft}s
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Timer bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeLeft <= 10 ? "bg-destructive" : phase === "player1" ? "bg-blue-500" : "bg-red-500"
            }`}
            style={{ width: `${(timeLeft / ROUND_TIME) * 100}%` }}
          />
        </div>

        {/* Available letters */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Lettres disponibles :</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {currentRound.letters.split("").map((letter, i) => (
              <span
                key={i}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold flex items-center justify-center shadow-md"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg uppercase focus:border-primary focus:outline-none"
            placeholder="Tapez un mot..."
            maxLength={currentRound.letters.length}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
          />
          <Button size="lg" onClick={submitWord} disabled={!input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
          <span className="text-sm text-muted-foreground">Score</span>
          <span className="text-xl font-bold text-primary">{currentScore} pts</span>
        </div>

        {/* Found words */}
        {currentWords.length > 0 && (
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Mots trouvés :</p>
            <div className="flex flex-wrap gap-2">
              {currentWords.map((word, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-medium uppercase ${
                    phase === "player1"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  {word} (+{word.length === 3 ? 1 : word.length === 4 ? 3 : word.length === 5 ? 5 : 8})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Point system reminder */}
        <div className="text-center text-xs text-muted-foreground">
          3 lettres = 1 pt • 4 lettres = 3 pts • 5 lettres = 5 pts • 6+ lettres = 8 pts
        </div>
      </div>
    </div>
  );
}
