"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { generateRoomCode } from "@/lib/seededRandom";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

// ─── Card emojis (8 pairs = 16 cards) ────────────────────────────────────────
const EMOJIS = ["🌙", "✨", "🌹", "💌", "🫶", "🕯️", "🌊", "🎵"];

// ─── Seeded shuffle (deterministic from room code) ───────────────────────────
function seededShuffle<T>(array: T[], seed: string): T[] {
  // Mulberry32 PRNG
  let s = Math.abs([...seed].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0));
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#D4A447", "#538d4e", "#b59f3b", "#E0B458", "#F5F3EE", "#4A6FA5", "🌹"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 2 + (i / 40) * 96,
      color: CONFETTI_COLORS[i % (CONFETTI_COLORS.length - 1)],
      delay: Math.random() * 500,
      size: 5 + Math.random() * 9,
      rotation: Math.random() * 360,
    })), []);
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 overflow-hidden h-72">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`, top: -p.size,
            width: p.size, height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Flip Card ────────────────────────────────────────────────────────────────
interface FlipCardProps {
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  isWrongGuess: boolean;
  canClick: boolean;
  onClick: () => void;
  matchedBy?: "me" | "them"; // who found this pair
  myColor: string;
  theirColor: string;
}

function FlipCard({ emoji, isFlipped, isMatched, isWrongGuess, canClick, onClick, matchedBy, myColor, theirColor }: FlipCardProps) {
  const matchColor = matchedBy === "me" ? myColor : matchedBy === "them" ? theirColor : undefined;

  return (
    <button
      onClick={onClick}
      disabled={!canClick}
      className={cn(
        "relative w-full aspect-square select-none",
        "[perspective:400px]",
        canClick && "cursor-pointer active:scale-95",
        !canClick && "cursor-default",
      )}
      style={{ transition: "transform 0.15s ease" }}
    >
      {/* Card inner — rotates */}
      <div
        className={cn(
          "relative w-full h-full transition-all duration-500",
          "[transform-style:preserve-3d]",
          (isFlipped || isMatched) && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Back face (hidden face, shown when not flipped) */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 flex items-center justify-center [backface-visibility:hidden]",
            isWrongGuess
              ? "border-red-500/50 bg-red-500/10 animate-shake"
              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)]",
            canClick && !isWrongGuess && "hover:border-[rgba(212,164,71,0.3)] hover:bg-[rgba(212,164,71,0.06)]",
          )}
        >
          <span className="text-xl text-[var(--color-text-muted)] opacity-40">✦</span>
        </div>

        {/* Front face (emoji face, shown when flipped) */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl border-2 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]",
            isMatched
              ? "border-2 shadow-lg"
              : "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.07)]",
          )}
          style={isMatched && matchColor ? {
            borderColor: matchColor + "66",
            backgroundColor: matchColor + "18",
            boxShadow: `0 0 16px ${matchColor}22`,
          } : undefined}
        >
          <span className={cn("text-2xl transition-all", isMatched && "animate-cell-spring")}>
            {emoji}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MemoryMatchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { config, currentUser } = useAppConfig();
  const supabase = createClient();

  const myName    = config[currentUser === "me" ? "me"   : "them"]?.name ?? "You";
  const theirName = config[currentUser === "me" ? "them" : "me"]?.name ?? "Partner";
  const myColor   = config[currentUser === "me" ? "me"   : "them"]?.avatarColor ?? "#C49030";
  const theirColor = config[currentUser === "me" ? "them" : "me"]?.avatarColor ?? "#4A6FA5";
  const myAvatar   = myName[0]?.toUpperCase() ?? "M";
  const theirAvatar = theirName[0]?.toUpperCase() ?? "T";
  const myRole = currentUser === "me" ? "me" : "them";

  // ── Room ───────────────────────────────────────────────────────────────────
  const [room, setRoom] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Cards ──────────────────────────────────────────────────────────────────
  // cards[i] = emoji for card at position i (same on both sides via seed)
  const [cards, setCards] = useState<string[]>([]);

  // State per card index
  const [flipped, setFlipped] = useState<boolean[]>([]); // currently face-up (temp)
  const [matched, setMatched] = useState<boolean[]>([]);  // permanently matched
  const [matchedBy, setMatchedBy] = useState<Array<"me" | "them" | undefined>>([]); // who matched it

  // ── Turn / selection ───────────────────────────────────────────────────────
  const [myTurn, setMyTurn] = useState(true); // X goes first
  const [selected, setSelected] = useState<number[]>([]); // up to 2 cards I've selected this turn
  const [wrongGuess, setWrongGuess] = useState<number[]>([]); // cards showing wrong-flip shake

  // ── Scores ────────────────────────────────────────────────────────────────
  const [myScore, setMyScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);

  // ── End ───────────────────────────────────────────────────────────────────
  const [gameOver, setGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lockRef = useRef(false); // prevent double-clicks during flip animation

  // ── Room init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const code = params.get("room");
    if (code && code.length === 4) {
      setRoom(code.toUpperCase());
    } else {
      router.replace(`/games/memory?room=${generateRoomCode()}`);
    }
  }, [params, router]);

  // ── Build card deck from seed ─────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    const deck = seededShuffle([...EMOJIS, ...EMOJIS], room);
    setCards(deck);
    setFlipped(Array(16).fill(false));
    setMatched(Array(16).fill(false));
    setMatchedBy(Array(16).fill(undefined));
    setSelected([]);
    setMyScore(0);
    setTheirScore(0);
    setGameOver(false);
    setShowConfetti(false);
    setMyTurn(true);

    // Subscribe to broadcast (ephemeral — nothing written to DB)
    const ch = supabase.channel(`memory-${room}`, {
      config: { broadcast: { self: false } },
    });

    ch
      .on("broadcast", { event: "flip" }, ({ payload }) => {
        if (payload.role === myRole) return; // ignore own echoes
        handleRemoteFlip(payload.index, payload.role);
      })
      .on("broadcast", { event: "reset" }, () => {
        const newDeck = seededShuffle([...EMOJIS, ...EMOJIS], generateRoomCode());
        resetGame(newDeck);
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // ── Remote flip handler ───────────────────────────────────────────────────
  // We maintain a ref to always-fresh state for use inside channel callbacks
  const stateRef = useRef({
    cards, flipped, matched, matchedBy, myTurn, selected, myScore, theirScore,
  });
  useEffect(() => {
    stateRef.current = { cards, flipped, matched, matchedBy, myTurn, selected, myScore, theirScore };
  });

  const applyFlip = useCallback((
    index: number,
    role: "me" | "them",
    currentSelected: number[],
    currentMatched: boolean[],
    currentMatchedBy: Array<"me" | "them" | undefined>,
    myScoreNow: number,
    theirScoreNow: number,
  ) => {
    const newSelected = [...currentSelected, index];

    if (newSelected.length === 1) {
      setFlipped(prev => { const n = [...prev]; n[index] = true; return n; });
      setSelected(newSelected);
      return;
    }

    // Two cards selected
    const [first, second] = newSelected;
    const isMatch = cards[first] === cards[second];

    setFlipped(prev => { const n = [...prev]; n[index] = true; return n; });

    setTimeout(() => {
      if (isMatch) {
        // Match!
        const newMatched = [...currentMatched];
        newMatched[first] = true;
        newMatched[second] = true;
        const newMatchedBy = [...currentMatchedBy];
        newMatchedBy[first] = role;
        newMatchedBy[second] = role;
        setMatched(newMatched);
        setMatchedBy(newMatchedBy);
        setFlipped(prev => { const n = [...prev]; n[first] = false; n[second] = false; return n; });

        const newMyScore = role === "me" ? myScoreNow + 1 : myScoreNow;
        const newTheirScore = role === "them" ? theirScoreNow + 1 : theirScoreNow;
        if (role === "me") setMyScore(newMyScore);
        else setTheirScore(newTheirScore);

        const totalMatched = newMatched.filter(Boolean).length;
        if (totalMatched === 16) {
          setGameOver(true);
          const iWon = newMyScore > newTheirScore;
          if (iWon) setTimeout(() => setShowConfetti(true), 300);
        }
        // Same player goes again on match — keep turn
      } else {
        // No match — flip back
        setWrongGuess([first, second]);
        setTimeout(() => {
          setFlipped(prev => { const n = [...prev]; n[first] = false; n[second] = false; return n; });
          setWrongGuess([]);
          setMyTurn(role !== myRole); // switch turn
        }, 900);
      }
      setSelected([]);
      lockRef.current = false;
    }, 700);
  }, [cards, myRole]);

  const handleRemoteFlip = useCallback((index: number, role: "me" | "them") => {
    const { selected: sel, matched: mat, matchedBy: mby, myScore: ms, theirScore: ts } = stateRef.current;
    applyFlip(index, role, sel, mat, mby, ms, ts);
  }, [applyFlip]);

  // ── Local card click ──────────────────────────────────────────────────────
  const handleCardClick = useCallback((index: number) => {
    const { matched: mat, flipped: fl, selected: sel, matchedBy: mby, myScore: ms, theirScore: ts } = stateRef.current;
    if (!myTurn || mat[index] || fl[index] || sel.includes(index) || lockRef.current || sel.length >= 2) return;
    lockRef.current = true;

    // Broadcast (ephemeral — no DB write)
    channelRef.current?.send({
      type: "broadcast", event: "flip",
      payload: { index, role: myRole },
    });

    applyFlip(index, myRole, sel, mat, mby, ms, ts);
  }, [myTurn, myRole, applyFlip]);

  // ── Play again ────────────────────────────────────────────────────────────
  const resetGame = (newDeck?: string[]) => {
    const deck = newDeck ?? seededShuffle([...EMOJIS, ...EMOJIS], generateRoomCode());
    setCards(deck);
    setFlipped(Array(16).fill(false));
    setMatched(Array(16).fill(false));
    setMatchedBy(Array(16).fill(undefined));
    setSelected([]);
    setMyScore(0);
    setTheirScore(0);
    setGameOver(false);
    setShowConfetti(false);
    setMyTurn(true);
    lockRef.current = false;
  };

  const handlePlayAgain = () => {
    const newCode = generateRoomCode();
    channelRef.current?.send({ type: "broadcast", event: "reset", payload: {} });
    router.replace(`/games/memory?room=${newCode}`);
  };

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(`${window.location.origin}/games/memory?room=${room}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalPairs = EMOJIS.length;
  const matchedCount = matched.filter(Boolean).length / 2;
  const iWon = myScore > theirScore;
  const theyWon = theirScore > myScore;

  if (!room || cards.length === 0) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm pt-5 pb-6 flex flex-col gap-4 px-4">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/games"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Memory Match</h1>
          <p className="text-[11px] text-[var(--color-text-muted)] font-mono">Room · {room}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] border border-[rgba(212,164,71,0.25)] rounded-full px-3 py-1.5 hover:bg-[rgba(212,164,71,0.08)] transition-all active:scale-95"
        >
          {copied ? <><Check size={12} />Copied!</> : <><Share2 size={12} />Share</>}
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
        {/* Me */}
        <div className={cn(
          "flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all",
          myTurn && !gameOver && "bg-[rgba(212,164,71,0.08)]"
        )}>
          <div
            className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", myTurn && !gameOver && "animate-turn-glow")}
            style={{ background: myColor, color: "#0A0A0A" }}
          >
            {myAvatar}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{myName}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              <span className="font-bold text-[var(--color-accent)]">{myScore}</span> pair{myScore !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Center */}
        <div className="text-center shrink-0 px-1">
          <p className="text-[11px] font-bold text-[var(--color-text-muted)]">{matchedCount}/{totalPairs}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">found</p>
        </div>

        {/* Them */}
        <div className={cn(
          "flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all flex-row-reverse",
          !myTurn && !gameOver && "bg-[rgba(255,255,255,0.05)]"
        )}>
          <div
            className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", !myTurn && !gameOver && "animate-turn-glow")}
            style={{ background: theirColor, color: "#fff" }}
          >
            {theirAvatar}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{theirName}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              <span className="font-bold">{theirScore}</span> pair{theirScore !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Turn label */}
      {!gameOver && (
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          {myTurn ? "Your turn — flip two cards" : `${theirName}'s turn…`}
        </p>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((emoji, i) => (
          <FlipCard
            key={i}
            emoji={emoji}
            isFlipped={flipped[i] || selected.includes(i)}
            isMatched={matched[i]}
            isWrongGuess={wrongGuess.includes(i)}
            canClick={myTurn && !matched[i] && !flipped[i] && !selected.includes(i) && !gameOver && selected.length < 2}
            onClick={() => handleCardClick(i)}
            matchedBy={matchedBy[i]}
            myColor={myColor}
            theirColor={theirColor}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#D4A447,#E0B458)] transition-all duration-500"
          style={{ width: `${(matchedCount / totalPairs) * 100}%` }}
        />
      </div>

      {/* Game over */}
      {gameOver && (
        <div className="animate-fade-up space-y-3">
          <div className={cn(
            "rounded-2xl border px-5 py-5 text-center space-y-2",
            iWon   && "bg-[rgba(83,141,78,0.12)] border-[rgba(83,141,78,0.35)] shadow-[0_0_32px_rgba(83,141,78,0.12)]",
            theyWon && "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]",
            !iWon && !theyWon && "bg-[rgba(212,164,71,0.07)] border-[rgba(212,164,71,0.2)]",
          )}>
            <p className="text-3xl">{iWon ? "🏆" : theyWon ? "😔" : "🤝"}</p>
            <p className="text-base font-bold text-[var(--color-text-primary)]">
              {iWon ? "You win!" : theyWon ? `${theirName} wins!` : "It's a tie!"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {myName} {myScore} · {theirName} {theirScore}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 gap-1.5" onClick={handlePlayAgain}>
              <RotateCcw size={13} /> Play again
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/games">Back</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
