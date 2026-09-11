"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Share2, RefreshCw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { generateRoomCode } from "@/lib/seededRandom";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mark = "X" | "O" | null;
type Board = Mark[];
type Phase = "lobby" | "waiting" | "playing";

interface GameState {
  board: Board;
  turn: "X" | "O";
  winner: Mark | "draw" | null;
  winLine: number[] | null;
}

// ─── Win detection ────────────────────────────────────────────────────────────
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: Board): { winner: Mark | "draw" | null; line: number[] | null } {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { winner: "draw", line: null };
  return { winner: null, line: null };
}

const EMPTY_GAME: GameState = { board: Array(9).fill(null), turn: "X", winner: null, winLine: null };

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#D4A447","#538d4e","#b59f3b","#E0B458","#F5F3EE","#4A6FA5"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: 5 + (i / 32) * 90,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 300,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })), []);
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 overflow-hidden h-64">
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

// ─── Win strike line overlay ──────────────────────────────────────────────────
/** Maps each winning line to its CSS positioning on the 3×3 grid */
const WIN_LINE_STYLE: Record<string, React.CSSProperties & { className?: string }> = {
  "0,1,2": { top: "16.6%",  left: "4%", right: "4%", height: 3, transform: "translateY(-50%)" },
  "3,4,5": { top: "50%",    left: "4%", right: "4%", height: 3, transform: "translateY(-50%)" },
  "6,7,8": { top: "83.3%",  left: "4%", right: "4%", height: 3, transform: "translateY(-50%)" },
  "0,3,6": { top: "4%",  bottom: "4%", left: "16.6%", width: 3, transform: "translateX(-50%)" },
  "1,4,7": { top: "4%",  bottom: "4%", left: "50%",   width: 3, transform: "translateX(-50%)" },
  "2,5,8": { top: "4%",  bottom: "4%", left: "83.3%", width: 3, transform: "translateX(-50%)" },
  "0,4,8": { top: "4%", left: "4%", right: "4%", bottom: "4%", height: 3, transform: "rotate(45deg) translateY(-50%)", transformOrigin: "left center" },
  "2,4,6": { top: "4%", left: "4%", right: "4%", bottom: "4%", height: 3, transform: "rotate(-45deg) translateY(-50%)", transformOrigin: "right center" },
};

// ─── Board Cell ───────────────────────────────────────────────────────────────
interface CellProps {
  mark: Mark;
  index: number;
  isWin: boolean;
  isNew: boolean;
  isMyTurn: boolean;
  gameOver: boolean;
  onClick: () => void;
}

function Cell({ mark, isWin, isNew, isMyTurn, gameOver, onClick }: CellProps) {
  const canClick = !mark && isMyTurn && !gameOver;
  return (
    <button
      onClick={onClick}
      disabled={!canClick}
      className={cn(
        "relative flex items-center justify-center w-full aspect-square rounded-2xl border-2 transition-all duration-200",
        // Empty + my turn
        canClick && "cursor-pointer hover:border-[rgba(212,164,71,0.4)] hover:bg-[rgba(212,164,71,0.06)] active:scale-[0.93]",
        // Empty + not my turn
        !mark && !canClick && "cursor-default border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]",
        // X mark
        mark === "X" && !isWin && "border-[rgba(212,164,71,0.35)] bg-[rgba(212,164,71,0.08)]",
        mark === "X" && isWin  && "border-[#538d4e] bg-[rgba(83,141,78,0.18)] shadow-[0_0_20px_rgba(83,141,78,0.3)]",
        // O mark
        mark === "O" && !isWin && "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)]",
        mark === "O" && isWin  && "border-[#538d4e] bg-[rgba(83,141,78,0.18)] shadow-[0_0_20px_rgba(83,141,78,0.3)]",
      )}
    >
      {mark && (
        <span
          className={cn(
            "text-[2rem] font-black leading-none",
            isNew && "animate-cell-spring",
            mark === "X" ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]",
            isWin && "text-[#6fcf6f]",
          )}
        >
          {mark === "X" ? "×" : "○"}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TicTacToePage() {
  const { config, currentUser } = useAppConfig();
  const supabase = createClient();

  const myName  = config[currentUser === "me" ? "me"   : "them"]?.name ?? "You";
  const theirName = config[currentUser === "me" ? "them" : "me"]?.name ?? "Partner";
  const myAvatar  = config[currentUser === "me" ? "me"   : "them"]?.name?.[0]?.toUpperCase() ?? "M";
  const theirAvatar = config[currentUser === "me" ? "them" : "me"]?.name?.[0]?.toUpperCase() ?? "T";
  const myColor    = config[currentUser === "me" ? "me"   : "them"]?.avatarColor ?? "#C49030";
  const theirColor = config[currentUser === "me" ? "them" : "me"]?.avatarColor ?? "#4A6FA5";

  const [phase, setPhase] = useState<Phase>("lobby");
  const [room, setRoom] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [myMark, setMyMark] = useState<"X" | "O">("X");
  const [copied, setCopied] = useState(false);
  const [game, setGame] = useState<GameState>(EMPTY_GAME);
  const [newCell, setNewCell] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribe = useCallback((roomCode: string, iAmX: boolean) => {
    const ch = supabase.channel(`ttt-${roomCode}`, {
      config: { broadcast: { self: false } },
    });
    ch
      .on("broadcast", { event: "join" }, () => {
        setPhase("playing");
      })
      .on("broadcast", { event: "move" }, ({ payload }) => {
        setNewCell(payload.index);
        setGame(prev => {
          if (prev.winner || prev.board[payload.index]) return prev;
          const newBoard = [...prev.board] as Board;
          newBoard[payload.index] = payload.mark;
          const { winner, line } = checkWinner(newBoard);
          return { board: newBoard, turn: prev.turn === "X" ? "O" : "X", winner, winLine: line };
        });
      })
      .on("broadcast", { event: "rematch" }, () => {
        setGame(EMPTY_GAME);
        setNewCell(null);
        setShowConfetti(false);
        setMyMark(m => m === "X" ? "O" : "X");
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED" && !iAmX) {
          ch.send({ type: "broadcast", event: "join", payload: {} });
          setPhase("playing");
        }
      });
    channelRef.current = ch;
  }, [supabase]);

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current); }, [supabase]);

  const handleCreate = () => {
    const code = generateRoomCode();
    setRoom(code);
    setMyMark("X");
    setPhase("waiting");
    subscribe(code, true);
  };

  const handleJoin = () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) return;
    setRoom(code);
    setMyMark("O");
    subscribe(code, false);
  };

  const handleCell = (index: number) => {
    if (game.board[index] || game.winner || game.turn !== myMark || phase !== "playing") return;
    const newBoard = [...game.board] as Board;
    newBoard[index] = myMark;
    const { winner, line } = checkWinner(newBoard);
    setNewCell(index);
    setGame({ board: newBoard, turn: game.turn === "X" ? "O" : "X", winner, winLine: line });
    channelRef.current?.send({ type: "broadcast", event: "move", payload: { index, mark: myMark } });
    if (winner && winner !== "draw") {
      setTimeout(() => setShowConfetti(true), 400);
    }
  };

  const handleRematch = () => {
    setGame(EMPTY_GAME);
    setNewCell(null);
    setShowConfetti(false);
    setMyMark(m => m === "X" ? "O" : "X");
    channelRef.current?.send({ type: "broadcast", event: "rematch", payload: {} });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // Derive status
  const iMyTurn = game.turn === myMark && !game.winner && phase === "playing";
  const didIWin = game.winner && game.winner !== "draw" && game.winner === myMark;
  const didTheyWin = game.winner && game.winner !== "draw" && game.winner !== myMark;

  let statusLine = "";
  if (phase === "waiting") statusLine = `Waiting for ${theirName}…`;
  else if (phase === "playing") {
    if (game.winner === "draw") statusLine = "It's a draw! 🤝";
    else if (didIWin)   statusLine = `You win! 🎉`;
    else if (didTheyWin) statusLine = `${theirName} wins!`;
    else statusLine = iMyTurn ? "Your turn" : `${theirName}'s turn…`;
  }

  const winLineKey = game.winLine?.join(",") ?? "";

  return (
    <div className="mx-auto max-w-sm pt-5 pb-6 flex flex-col gap-4 px-4">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0">
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Tic-Tac-Toe</h1>
          <p className="text-[11px] text-[var(--color-text-muted)]">Real-time · No database</p>
        </div>
        {room && phase !== "lobby" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] border border-[rgba(212,164,71,0.25)] rounded-full px-3 py-1.5 hover:bg-[rgba(212,164,71,0.08)] transition-all active:scale-95"
          >
            {copied ? <><Check size={12} />Copied!</> : <><Copy size={12} />{room}</>}
          </button>
        )}
      </div>

      {/* ── Lobby ── */}
      {phase === "lobby" && (
        <Card variant="raised">
          <CardContent className="py-8 space-y-6">
            {/* Avatars */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: myColor, color: "#0A0A0A" }}>
                  {myAvatar}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">{myName}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Swords size={24} className="text-[var(--color-accent)]" />
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">vs</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: theirColor, color: "#fff" }}>
                  {theirAvatar}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">{theirName}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Start a match</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Create a room or enter their code</p>
            </div>

            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={handleCreate}>
                <Swords size={15} /> Create room
              </Button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0, 4))}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  placeholder="Room code"
                  maxLength={4}
                  className="flex-1 h-11 px-4 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)] text-sm font-mono tracking-[0.3em] text-center placeholder:text-[var(--color-text-muted)] placeholder:tracking-normal focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <Button variant="secondary" onClick={handleJoin} disabled={joinInput.length !== 4}>
                  Join
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Waiting ── */}
      {phase === "waiting" && (
        <Card variant="raised">
          <CardContent className="py-10 text-center space-y-5">
            <div className="relative mx-auto w-16 h-16">
              <span className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: myColor }}>
                <span className="text-base font-bold text-[#0A0A0A]">{myAvatar}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Waiting for {theirName}…</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Share this code:</p>
              <p className="text-4xl font-black font-mono tracking-[0.3em] text-[var(--color-accent)] mt-3">{room}</p>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mx-auto hover:text-[var(--color-text-primary)] transition-colors">
              {copied ? <><Check size={12} />Copied!</> : <><Share2 size={12} />Copy code</>}
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Playing ── */}
      {phase === "playing" && (
        <>
          {/* Turn indicator */}
          <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
            {/* Me */}
            <div className={cn("flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all", iMyTurn && "bg-[rgba(212,164,71,0.1)]")}>
              <div
                className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all", iMyTurn && "animate-turn-glow")}
                style={{ background: myColor, color: "#0A0A0A" }}
              >
                {myAvatar}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{myName}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">plays <span className="font-bold text-[var(--color-accent)]">{myMark === "X" ? "×" : "○"}</span></p>
              </div>
            </div>
            {/* Status */}
            <div className="text-center shrink-0 px-1">
              <p className="text-[11px] text-[var(--color-text-muted)] font-medium">{statusLine}</p>
            </div>
            {/* Them */}
            <div className={cn("flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all flex-row-reverse", !iMyTurn && !game.winner && "bg-[rgba(255,255,255,0.05)]")}>
              <div
                className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all", !iMyTurn && !game.winner && "animate-turn-glow")}
                style={{ background: theirColor, color: "#fff" }}
              >
                {theirAvatar}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{theirName}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">plays <span className="font-bold">{myMark === "X" ? "○" : "×"}</span></p>
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="relative grid grid-cols-3 gap-2.5">
            {game.board.map((mark, i) => (
              <Cell
                key={i}
                index={i}
                mark={mark}
                isWin={game.winLine?.includes(i) ?? false}
                isNew={newCell === i}
                isMyTurn={iMyTurn}
                gameOver={!!game.winner}
                onClick={() => handleCell(i)}
              />
            ))}

            {/* Win strike-through line */}
            {game.winLine && (
              <div
                className="absolute bg-[#538d4e] rounded-full animate-line-draw origin-left"
                style={{
                  opacity: 0,
                  ...WIN_LINE_STYLE[winLineKey],
                }}
              />
            )}
          </div>

          {/* End actions */}
          {game.winner && (
            <div className="space-y-3 animate-fade-up">
              <div className={cn(
                "rounded-2xl border px-4 py-4 text-center",
                didIWin   && "bg-[rgba(83,141,78,0.12)] border-[rgba(83,141,78,0.35)] shadow-[0_0_32px_rgba(83,141,78,0.15)]",
                didTheyWin && "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]",
                game.winner === "draw" && "bg-[rgba(212,164,71,0.07)] border-[rgba(212,164,71,0.2)]",
              )}>
                <p className="text-2xl mb-1">{didIWin ? "🏆" : didTheyWin ? "😔" : "🤝"}</p>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{statusLine}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 gap-1.5" onClick={handleRematch}>
                  <RefreshCw size={13} /> Rematch
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/games">Back</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
