"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Share2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORDS, VALID_GUESSES } from "@/lib/words";
import { seededPick, generateRoomCode } from "@/lib/seededRandom";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type LetterState = "correct" | "present" | "absent" | "empty" | "tbd";

interface OpponentStatus {
  guessCount: number;
  solved: boolean;
  failed: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = "#";
      guessChars[i] = "*";
    }
  }
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === "*") continue;
    const idx = answerChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerChars[idx] = "#";
    }
  }
  return result;
}

function buildKeyboardMap(guesses: string[], evaluations: LetterState[][]): Record<string, LetterState> {
  const map: Record<string, LetterState> = {};
  const priority: Record<LetterState, number> = { correct: 3, present: 2, absent: 1, empty: 0, tbd: 0 };
  guesses.forEach((guess, gi) => {
    guess.split("").forEach((ch, ci) => {
      const state = evaluations[gi][ci];
      if ((priority[state] ?? 0) > (priority[map[ch]] ?? 0)) map[ch] = state;
    });
  });
  return map;
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#D4A447", "#538d4e", "#b59f3b", "#E0B458", "#F5F3EE", "#4A6FA5"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo<ConfettiPiece[]>(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: 5 + (i / 36) * 90,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 400,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })), []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center overflow-hidden h-64">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: -p.size,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : p.id % 3 === 1 ? "2px" : "0",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── FlipTile ─────────────────────────────────────────────────────────────────
interface FlipTileProps {
  letter: string;
  state: LetterState;
  flipDelay?: number; // ms, triggers 3-D flip when defined and state is set
  isNew?: boolean;    // pop animation when letter was just typed
}

const STATE_COLORS: Record<LetterState, { bg: string; border: string; text: string }> = {
  correct: { bg: "#538d4e",                    border: "#538d4e",                    text: "#fff" },
  present: { bg: "#b59f3b",                    border: "#b59f3b",                    text: "#fff" },
  absent:  { bg: "rgba(255,255,255,0.10)",     border: "rgba(255,255,255,0.14)",     text: "#8A8A94" },
  empty:   { bg: "transparent",               border: "rgba(255,255,255,0.10)",     text: "#F5F3EE" },
  tbd:     { bg: "transparent",               border: "rgba(255,255,255,0.35)",     text: "#F5F3EE" },
};

function FlipTile({ letter, state, flipDelay, isNew }: FlipTileProps) {
  const [phase, setPhase] = useState<"idle" | "flipout" | "flipin" | "done">("idle");
  const [displayState, setDisplayState] = useState<LetterState>(state === "empty" || state === "tbd" ? state : "tbd");

  // When flipDelay arrives and state is a revealed state, trigger the flip
  useEffect(() => {
    if (flipDelay === undefined) return;
    if (state === "correct" || state === "present" || state === "absent") {
      const t1 = setTimeout(() => setPhase("flipout"), flipDelay);
      const t2 = setTimeout(() => {
        setDisplayState(state);
        setPhase("flipin");
      }, flipDelay + 150);
      const t3 = setTimeout(() => setPhase("done"), flipDelay + 300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [flipDelay, state]);

  // For rows that are not yet being revealed, keep state in sync
  useEffect(() => {
    if (flipDelay === undefined) setDisplayState(state);
  }, [state, flipDelay]);

  const col = STATE_COLORS[displayState];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-[52px] h-[52px] border-2 text-[1.2rem] font-bold rounded-xl select-none",
        "transition-colors duration-0",
        isNew && letter && "animate-tile-pop",
        phase === "flipout" && "[animation:tile-flip-out_0.15s_ease-in_forwards]",
        phase === "flipin"  && "[animation:tile-flip-in_0.15s_ease-out_forwards]",
      )}
      style={{
        backgroundColor: col.bg,
        borderColor: col.border,
        color: col.text,
        perspective: "250px",
      }}
    >
      {letter}
    </div>
  );
}

// ─── Keyboard ────────────────────────────────────────────────────────────────
const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const KB_COLORS: Record<LetterState, string> = {
  correct: "bg-[#538d4e] text-white shadow-[0_0_12px_rgba(83,141,78,0.5)]",
  present: "bg-[#b59f3b] text-white shadow-[0_0_12px_rgba(181,159,59,0.4)]",
  absent:  "bg-[rgba(255,255,255,0.05)] text-[#4A4A54]",
  empty:   "bg-[rgba(255,255,255,0.09)] text-[#F5F3EE] hover:bg-[rgba(255,255,255,0.14)]",
  tbd:     "bg-[rgba(255,255,255,0.09)] text-[#F5F3EE] hover:bg-[rgba(255,255,255,0.14)]",
};

function Keyboard({ keyMap, onKey }: { keyMap: Record<string, LetterState>; onKey: (k: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(key => {
            const state = keyMap[key] ?? "empty";
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                onMouseDown={e => { e.preventDefault(); onKey(key); }}
                className={cn(
                  "flex items-center justify-center rounded-lg font-bold text-[11px] transition-all duration-200 active:scale-90 select-none",
                  isWide ? "w-[52px] h-12" : "w-9 h-12",
                  KB_COLORS[state]
                )}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WordlePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { config, currentUser } = useAppConfig();
  const supabase = createClient();

  const [room, setRoom] = useState("");
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState("");

  // Board state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<LetterState[][]>([]);
  const [current, setCurrent] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [revealRow, setRevealRow] = useState<number | null>(null); // row currently being flipped
  const [newLetterPos, setNewLetterPos] = useState<number | null>(null); // position that just got a letter

  // Opponent
  const [opponent, setOpponent] = useState<OpponentStatus>({ guessCount: 0, solved: false, failed: false });
  const [showConfetti, setShowConfetti] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myRole = currentUser === "me" ? "partner1" : "partner2";
  const myName = config[currentUser === "me" ? "me" : "them"]?.name ?? "You";
  const theirName = config[currentUser === "me" ? "them" : "me"]?.name ?? "Partner";

  // ── Room / word init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const code = params.get("room");
    if (code && code.length === 4) {
      setRoom(code.toUpperCase());
    } else {
      router.replace(`/games/wordle?room=${generateRoomCode()}`);
    }
  }, [params, router]);

  useEffect(() => {
    if (!room) return;
    setAnswer(seededPick(WORDS, room));

    const channel = supabase.channel(`wordle-${room}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "move" }, ({ payload }) => {
        if (payload.role !== myRole) {
          setOpponent({ guessCount: payload.guessCount, solved: payload.solved, failed: payload.failed });
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [room, myRole, supabase]);

  const broadcast = useCallback((guessCount: number, solved: boolean, failed: boolean) => {
    channelRef.current?.send({
      type: "broadcast", event: "move",
      payload: { role: myRole, guessCount, solved, failed },
    });
  }, [myRole]);

  // ── Physical keyboard ────────────────────────────────────────────────────────
  const handleKeyRef = useRef<(k: string) => void>(() => {});

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    if (key === "⌫") {
      setCurrent(prev => prev.slice(0, -1));
      setNewLetterPos(null);
    } else if (key === "ENTER") {
      setCurrent(prev => {
        if (prev.length !== 5) {
          setShakeRow(guesses.length);
          setTimeout(() => setShakeRow(null), 420);
          showToast("5 letters needed");
          return prev;
        }
        const eval_ = evaluateGuess(prev, answer);
        const newGuesses = [...guesses, prev];
        const newEvals = [...evaluations, eval_];
        setGuesses(newGuesses);
        setEvaluations(newEvals);
        setRevealRow(newGuesses.length - 1);
        setNewLetterPos(null);

        const solved = eval_.every(s => s === "correct");
        const failed = !solved && newGuesses.length >= 6;
        if (solved || failed) {
          setGameOver(true);
          setWon(solved);
          const delay = 5 * 150 + 350;
          setTimeout(() => {
            showToast(solved ? `✨ ${myName} got it!` : `The word was ${answer}`);
            if (solved) setShowConfetti(true);
          }, delay);
        }
        broadcast(newGuesses.length, solved, failed);
        return "";
      });
    } else if (key.length === 1 && /[A-Z]/.test(key)) {
      setCurrent(prev => {
        if (prev.length >= 5) return prev;
        setNewLetterPos(prev.length);
        return prev + key;
      });
    }
  }, [gameOver, guesses, evaluations, answer, broadcast, myName]);

  handleKeyRef.current = handleKey;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") handleKeyRef.current("ENTER");
      else if (e.key === "Backspace") handleKeyRef.current("⌫");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyRef.current(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(`${window.location.origin}/games/wordle?room=${room}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const keyMap = buildKeyboardMap(guesses, evaluations);

  // Build rows for rendering
  const rows = Array(6).fill(null).map((_, ri) => {
    if (ri < guesses.length) {
      return {
        letters: guesses[ri].split(""),
        states: evaluations[ri],
        isRevealRow: ri === revealRow,
        isCurrentRow: false,
      };
    } else if (ri === guesses.length && !gameOver) {
      const letters = current.split("");
      return {
        letters: Array(5).fill("").map((_, ci) => letters[ci] ?? ""),
        states: Array(5).fill("").map((_, ci) => (letters[ci] ? "tbd" : "empty")) as LetterState[],
        isRevealRow: false,
        isCurrentRow: true,
      };
    }
    return {
      letters: Array(5).fill(""),
      states: Array(5).fill("empty") as LetterState[],
      isRevealRow: false,
      isCurrentRow: false,
    };
  });

  // Opponent progress %
  const opponentPct = opponent.guessCount > 0 ? Math.min((opponent.guessCount / 6) * 100, 100) : 0;

  return (
    <div className="mx-auto max-w-lg pt-5 pb-6 flex flex-col gap-3 select-none">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="px-4 flex items-center gap-3">
        <Link href="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0">
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Wordle Race</h1>
          <p className="text-[11px] text-[var(--color-text-muted)] font-mono">Room · {room}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] border border-[rgba(212,164,71,0.25)] rounded-full px-3 py-1.5 hover:bg-[rgba(212,164,71,0.08)] transition-all active:scale-95"
        >
          {copied ? <><Check size={12} />Copied!</> : <><Share2 size={12} />Share</>}
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className="mx-4 text-center text-sm font-bold text-[var(--color-text-primary)] glass rounded-2xl px-4 py-2.5 animate-toast z-10">
          {message}
        </div>
      )}

      {/* Opponent strip */}
      <div className="mx-4 glass rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", opponent.solved ? "bg-[#538d4e]" : opponent.failed ? "bg-red-400" : "bg-green-400 animate-pulse")} />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{theirName}</span>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {opponent.solved ? "✅ Solved!" : opponent.failed ? "❌ Didn't get it" : opponent.guessCount > 0 ? `${opponent.guessCount} / 6` : "Hasn't started…"}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", opponent.solved ? "bg-[#538d4e]" : opponent.guessCount > 0 ? "shimmer" : "")}
            style={{ width: `${opponentPct}%` }}
          />
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-col items-center gap-1.5 px-4">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={cn(
              "flex gap-1.5",
              shakeRow === ri && "animate-shake"
            )}
          >
            {row.letters.map((letter, ci) => (
              <FlipTile
                key={`${ri}-${ci}`}
                letter={letter}
                state={row.states[ci]}
                flipDelay={row.isRevealRow ? ci * 150 : undefined}
                isNew={row.isCurrentRow && newLetterPos === ci}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="px-2 mt-1">
        <Keyboard keyMap={keyMap} onKey={handleKey} />
      </div>

      {/* Game over card */}
      {gameOver && (
        <div className="mx-4 animate-fade-up">
          <div className={cn(
            "rounded-2xl border px-5 py-5 text-center space-y-3",
            won
              ? "bg-[rgba(83,141,78,0.12)] border-[rgba(83,141,78,0.35)] shadow-[0_0_32px_rgba(83,141,78,0.15)]"
              : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]"
          )}>
            <p className="text-3xl">{won ? "🎉" : "😔"}</p>
            <div>
              <p className="text-base font-bold text-[var(--color-text-primary)]">
                {won ? `Got it in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}!` : `The word was ${answer}`}
              </p>
              {opponent.solved && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {theirName} solved it in {opponent.guessCount} {opponent.guessCount === 1 ? "guess" : "guesses"}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm" variant="secondary"
                className="gap-1.5"
                onClick={() => router.replace(`/games/wordle?room=${generateRoomCode()}`)}
              >
                <RotateCcw size={13} /> New word
              </Button>
              <Button size="sm" asChild>
                <Link href="/games">Back</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
