import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Trophy, Wifi, Timer, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { OnlineGameLobby } from "@/components/games/OnlineGameLobby";
import { toast } from "sonner";

const ROUNDS_DATA = [
  { letters: "AEILNRS", minLength: 3 },
  { letters: "AEIOUBT", minLength: 3 },
  { letters: "CMORTAE", minLength: 3 },
  { letters: "PLAINES", minLength: 3 },
  { letters: "DOUNRET", minLength: 3 },
  { letters: "FGLOIRE", minLength: 3 },
];

const VALID_WORDS = new Set([
  "air","ale","ane","are","bas","bat","bel","bio","bit","boa","bon","bot","but",
  "car","cas","cor","eau","eta","ire","lai","las","les","lin","lit",
  "mal","mer","met","mil","mot","mue","net","nie","nit","nos","ore","par",
  "pas","pie","pin","pli","rai","ras","rat","ria","rie","roi","rot",
  "rue","sel","sir","soi","sol","son","sur","tas","ter","the","top","tri",
  "une","uni","vie","vin",
  "aine","aire","aile","ales","amer","anes","arme","arts","aube","auto",
  "baie","bain","bate","beau","bile","bite","bloc","bleu","bois","bone","bore","bout",
  "ciel","cite","clef","come","core","cote","cour","crie",
  "dire","dome","done","dore","dune","dure",
  "elan","etre",
  "file","fine","flot","foie","font","fort",
  "gare","gite","gris","gros",
  "haie","hier","iles","iris",
  "joie","joli","jour",
  "lame","lane","lien","lieu","lime","line","lire","loin","lune",
  "main","male","mare","mate","mire","mise","mite","mode","mole","mont","more","mote","mure",
  "naif","nait","noel","noir","note","noue",
  "oeil","once","onze","oral","oser",
  "paie","pain","pair","pale","pare","pars","pile","pine","plan","plie","pneu","pole","pont",
  "raie","rame","rase","rien","rime","robe","rode","role","rond","rose","roue","rude","ruse",
  "sage","sale","sain","sein","semi","seul","sien","soie","soin","sole","sort",
  "taie","tale","tare","tige","tire","tome","tone","tore","tour","trio","trou","tube",
  "unir","user",
  "vase","vent","vers","vide","vile","voie","voir","vote",
  "aimer","aline","amour","arbre","arene","atome",
  "blanc","boire","botte","boite","brise","butte",
  "calme","carte","chant","chose","clair","coeur","conte","copie","corne","corse","coter","crane","crete",
  "danse","droit",
  "ecart","ecrin","elire","email","encre","envie",
  "flair","fleur","forge","forme","forte","frein",
  "genre","gilet","glace","globe","grace","grain","grise",
  "haine","herbe","honte",
  "image","inter",
  "jeune","jouer","juger",
  "laine","laser","liner","lires","livre","loger","luire",
  "marin","melon","merci","miner","miser","monte","motel","moule",
  "nager","nappe","noble","norme","noter","notre","nuire",
  "orage","ordre","outre",
  "paire","panel","parle","peine","peler","pente","perle","piler","piste","place","plage","plein","plier",
  "poire","porte","poste","prune",
  "reine","relie","renom","rente","ronde","route",
  "sable","saler","salon","serpe","serin","sirop","sobre","soeur","sorte","store",
  "table","taire","talon","tapis","terme","terre","toise","toile","torse","trace","train","trame","tripe",
  "unite",
  "valet","venir","vente","veste","vibre","virer","vitre","voile",
  "alpine","amener","animal",
  "blouse","bonite","bourse","braise",
  "camion","carnet","castor","centre","cinema","cloner","combat","comite","copain","cornet","course","croire",
  "detail","donner","dormir",
  "eclair","espoir",
  "favori","flacon","foudre","fourni",
  "garcon","gloire","grappe","grenat","grotte",
  "ironie",
  "jardin","jasmin","joueur",
  "lainer","lianes",
  "maitre","marine","merlan","mobile","moulin",
  "nature",
  "oiseau","orange","orient",
  "palier","parole","patron","plaine","plaire","plonge","police","pointe",
  "raison","rapide","raisin","relais","risque",
  "saline","saluer","saumon","senior","soleil","source",
  "temple","tendre","tomate","troupe",
  "valeur","ventre","vernis",
]);

function canFormWord(word: string, letters: string): boolean {
  const available = letters.toLowerCase().split("");
  for (const ch of word.toLowerCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

function calcScore(words: string[]): number {
  return words.reduce((acc, w) => {
    if (w.length === 3) return acc + 1;
    if (w.length === 4) return acc + 3;
    if (w.length === 5) return acc + 5;
    return acc + 8;
  }, 0);
}

const ROUND_TIME = 60;

type Phase = "lobby" | "playing" | "waiting_results" | "results";

export function WordDuelOnlineGame() {
  const goBack = useBackNavigation();
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<ReturnType<typeof useGameRoom> | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");

  const [letters, setLetters] = useState("");
  const [input, setInput] = useState("");
  const [myWords, setMyWords] = useState<string[]>([]);
  const [theirWords, setTheirWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const handleGameReady = useCallback((room: ReturnType<typeof useGameRoom>) => {
    setGameRoom(room);

    if (room.isHost) {
      const round = ROUNDS_DATA[Math.floor(Math.random() * ROUNDS_DATA.length)];
      setLetters(round.letters);
      setTimeout(() => {
        room.sendEvent("round_start", { letters: round.letters });
        setPhase("playing");
        setTimeLeft(ROUND_TIME);
      }, 500);
    }
  }, []);

  // Listen for events
  useEffect(() => {
    if (!gameRoom) return;

    gameRoom.onEvent("round_start", (data: { letters: string }) => {
      setLetters(data.letters);
      setPhase("playing");
      setTimeLeft(ROUND_TIME);
      setTimeout(() => inputRef.current?.focus(), 200);
    });

    gameRoom.onEvent("opponent_word_count", (data: { count: number }) => {
      // Optional: show opponent progress
    });

    gameRoom.onEvent("time_up_words", (data: { words: string[] }) => {
      setTheirWords(data.words);
    });

    gameRoom.onEvent("show_results", () => {
      setPhase("results");
    });
  }, [gameRoom]);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      setTimeout(() => inputRef.current?.focus(), 200);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  // When both words lists are received, show results
  useEffect(() => {
    if (theirWords.length > 0 && phase === "waiting_results") {
      setPhase("results");
    }
  }, [theirWords, phase]);

  // Save
  useEffect(() => {
    if (phase === "results" && !savedRef.current && user) {
      savedRef.current = true;
      const myS = calcScore(myWords);
      const theirS = calcScore(theirWords);
      supabase.from("game_sessions").insert({
        user_id: user.id,
        game_type: "word_duel_online",
        score: myS,
        success: myS > theirS,
        duration_seconds: ROUND_TIME,
      });
    }
  }, [phase, user, myWords, theirWords]);

  const handleTimeUp = () => {
    // Send our words to opponent
    gameRoom?.sendEvent("time_up_words", { words: myWords });

    if (theirWords.length > 0) {
      setPhase("results");
    } else {
      setPhase("waiting_results");
    }
  };

  const submitWord = () => {
    const word = input.trim().toLowerCase();
    setInput("");

    if (word.length < 3) {
      toast.error("3 lettres minimum !", { duration: 1000 });
      return;
    }
    if (!canFormWord(word, letters)) {
      toast.error("Lettres non disponibles !", { duration: 1000 });
      return;
    }
    if (myWords.includes(word)) {
      toast.error("Déjà trouvé !", { duration: 1000 });
      return;
    }
    if (!VALID_WORDS.has(word)) {
      toast.error("Mot non reconnu !", { duration: 1000 });
      return;
    }

    setMyWords((prev) => [...prev, word]);
    const pts = word.length === 3 ? 1 : word.length === 4 ? 3 : word.length === 5 ? 5 : 8;
    toast.success(`+${pts} pts ! "${word.toUpperCase()}"`, { duration: 1000 });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitWord();
    }
  };

  if (phase === "lobby") {
    return (
      <OnlineGameLobby gameTitle="Bataille de Mots" gameEmoji="📝" gameType="word_duel" onGameReady={handleGameReady} />
    );
  }

  if (phase === "waiting_results") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center gap-4 p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-bold text-foreground">Temps écoulé !</h2>
        <p className="text-muted-foreground">En attente des résultats de {gameRoom?.opponentName}...</p>
        <p className="text-lg font-bold text-primary">Vos mots : {myWords.length} ({calcScore(myWords)} pts)</p>
      </div>
    );
  }

  if (phase === "results") {
    const myS = calcScore(myWords);
    const theirS = calcScore(theirWords);
    const winner = myS > theirS ? gameRoom?.myName : theirS > myS ? gameRoom?.opponentName : null;
    const commonWords = myWords.filter((w) => theirWords.includes(w));

    return (
      <div className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
          <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1"><h1 className="text-lg font-bold text-foreground">Résultats</h1></div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-2" />
            <h2 className="text-xl font-bold text-foreground">
              {winner ? (winner === gameRoom?.myName ? "Vous gagnez ! 🎉" : `${gameRoom?.opponentName} gagne !`) : "Égalité ! 🤝"}
            </h2>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{myS}</p>
                <p className="text-sm font-medium text-foreground">{gameRoom?.myName}</p>
                <p className="text-xs text-muted-foreground">{myWords.length} mots</p>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{theirS}</p>
                <p className="text-sm font-medium text-foreground">{gameRoom?.opponentName}</p>
                <p className="text-xs text-muted-foreground">{theirWords.length} mots</p>
              </div>
            </div>
          </div>

          {commonWords.length > 0 && (
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-sm text-muted-foreground">🤝 Mots en commun : {commonWords.map((w) => w.toUpperCase()).join(", ")}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p className="font-medium text-blue-600 dark:text-blue-400 text-sm mb-2">{gameRoom?.myName}</p>
              <div className="flex flex-wrap gap-1">
                {myWords.map((w, i) => (
                  <span key={i} className="bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium uppercase">{w}</span>
                ))}
                {myWords.length === 0 && <p className="text-xs text-muted-foreground">Aucun mot</p>}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <p className="font-medium text-red-600 dark:text-red-400 text-sm mb-2">{gameRoom?.opponentName}</p>
              <div className="flex flex-wrap gap-1">
                {theirWords.map((w, i) => (
                  <span key={i} className="bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs font-medium uppercase">{w}</span>
                ))}
                {theirWords.length === 0 && <p className="text-xs text-muted-foreground">Aucun mot</p>}
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={() => { gameRoom?.leaveRoom(); goBack(); }}>
            Retour aux jeux
          </Button>
        </div>
      </div>
    );
  }

  // Playing phase
  const myS = calcScore(myWords);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={() => { gameRoom?.leaveRoom(); goBack(); }} aria-label="Retour" className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Bataille de Mots</h1>
          <p className="text-sm text-muted-foreground">vs {gameRoom?.opponentName}</p>
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
            className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${(timeLeft / ROUND_TIME) * 100}%` }}
          />
        </div>

        {/* Letters */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Lettres disponibles :</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {letters.split("").map((letter, i) => (
              <span key={i} className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold flex items-center justify-center shadow-md">
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
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground text-lg uppercase focus:border-primary focus:outline-none"
            placeholder="Tapez un mot..."
            maxLength={letters.length}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button size="lg" onClick={submitWord} disabled={!input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
          <span className="text-sm text-muted-foreground">Score</span>
          <span className="text-xl font-bold text-primary">{myS} pts</span>
        </div>

        {/* Found words */}
        {myWords.length > 0 && (
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Vos mots ({myWords.length}) :</p>
            <div className="flex flex-wrap gap-2">
              {myWords.map((word, i) => (
                <span key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium uppercase">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          3 lettres = 1 pt • 4 = 3 pts • 5 = 5 pts • 6+ = 8 pts
        </div>
      </div>
    </div>
  );
}
