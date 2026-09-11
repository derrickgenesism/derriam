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

// ─── Constants ────────────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 7;
const EMPTY = null;

type Cell = "X" | "O" | null;
type Board = Cell[][];  // [row][col], row 0 = top
type Phase = "lobby" | "waiting" | "playing";

// ─── Win detection ────────────────────────────────────────────────────────────
function checkWin(board: Board, mark: Cell): number[][] | null {
  if (!mark) return null;
  const winning: number[][] = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r][c+i] === mark)) {
        return [[r,c],[r,c+1],[r,c+2],[r,c+3]];
      }
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      if ([0,1,2,3].every(i => board[r+i][c] === mark)) {
        return [[r,c],[r+1,c],[r+2,c],[r+3,c]];
      }
    }
  }
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if ([0,1,2,3].every(i => board[r+i][c+i] === mark)) {
        return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
      }
    }
  }
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if ([0,1,2,3].every(i => board[r+i][c-i] === mark)) {
        return [[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]];
      }
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board[0].every(cell => cell !== EMPTY);
}

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function dropPiece(board: Board, col: number, mark: Cell): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      const next = board.map(row => [...row]);
      next[r][col] = mark;
      return next;
    }
  }
  return null; // column full
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#D4A447","#538d4e","#b59f3b","#E0B458","#F5F3EE","#4A6FA5"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i, x: 2 + (i/40)*96,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 400, size: 5 + Math.random() * 9,
      rotation: Math.random() * 360,
    })), []);
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 overflow-hidden h-72">
      {pieces.map(p => (
        <div key={p.id} className="absolute animate-confetti"
          style={{ left:`${p.x}%`, top:-p.size, width:p.size, height:p.size,
            backgroundColor:p.color, borderRadius:p.id%3===0?"50%":"2px",
            transform:`rotate(${p.rotation}deg)`, animationDelay:`${p.delay}ms` }} />
      ))}
    </div>
  );
}

// ─── Hover column indicator ───────────────────────────────────────────────────
function HoverDot({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex h-5 items-center justify-center">
      <div
        className={cn("h-3 w-3 rounded-full transition-all duration-150", active ? "scale-100 opacity-100" : "scale-0 opacity-0")}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// ─── Board Cell ───────────────────────────────────────────────────────────────
interface PieceProps {
  cell: Cell;
  isWin: boolean;
  isNew: boolean;
  myColor: string;
  theirColor: string;
  myMark: "X" | "O";
}

function Piece({ cell, isWin, isNew, myColor, theirColor, myMark }: PieceProps) {
  const color = cell === myMark ? myColor : theirColor;
  return (
    <div className="flex items-center justify-center w-full aspect-square">
      <div
        className={cn(
          "w-[85%] h-[85%] rounded-full transition-all duration-200",
          !cell && "bg-[rgba(255,255,255,0.04)]",
          cell && isNew && "animate-cell-spring",
          cell && isWin && "shadow-[0_0_16px_4px_currentColor] scale-105",
        )}
        style={cell ? { backgroundColor: color, color } : undefined}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConnectFourPage() {
  const { config, currentUser } = useAppConfig();
  const supabase = createClient();

  const myName     = config[currentUser === "me" ? "me"   : "them"]?.name ?? "You";
  const theirName  = config[currentUser === "me" ? "them" : "me"]?.name  ?? "Partner";
  const myColor    = config[currentUser === "me" ? "me"   : "them"]?.avatarColor ?? "#C49030";
  const theirColor = config[currentUser === "me" ? "them" : "me"]?.avatarColor  ?? "#4A6FA5";
  const myAvatar   = myName[0]?.toUpperCase()    ?? "M";
  const theirAvatar = theirName[0]?.toUpperCase() ?? "T";

  const [phase, setPhase]     = useState<Phase>("lobby");
  const [room, setRoom]       = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [myMark, setMyMark]   = useState<"X" | "O">("X");
  const [copied, setCopied]   = useState(false);

  const [board, setBoard]     = useState<Board>(emptyBoard());
  const [turn, setTurn]       = useState<"X" | "O">("X");
  const [winner, setWinner]   = useState<Cell | "draw" | null>(null);
  const [winCells, setWinCells] = useState<number[][] | null>(null);
  const [newCell, setNewCell] = useState<[number,number] | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const subscribe = useCallback((roomCode: string, iAmX: boolean) => {
    const ch = supabase.channel(`c4-${roomCode}`, {
      config: { broadcast: { self: false } },
    });
    ch
      .on("broadcast", { event: "join" }, () => setPhase("playing"))
      .on("broadcast", { event: "drop" }, ({ payload }) => {
        setBoard(prev => {
          const next = dropPiece(prev, payload.col, payload.mark);
          if (!next) return prev;
          const row = next.reduce((found, r, ri) =>
            r[payload.col] === payload.mark && (found === -1 || ri > found) ? ri : found, -1);
          setNewCell([row, payload.col]);
          const win = checkWin(next, payload.mark);
          if (win) { setWinner(payload.mark); setWinCells(win); setTimeout(() => setShowConfetti(payload.mark !== myMark), 300); }
          else if (isDraw(next)) setWinner("draw");
          else setTurn(prev => prev === "X" ? "O" : "X");
          return next;
        });
      })
      .on("broadcast", { event: "rematch" }, () => {
        setBoard(emptyBoard()); setTurn("X"); setWinner(null);
        setWinCells(null); setNewCell(null); setShowConfetti(false);
        setMyMark(m => m === "X" ? "O" : "X");
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED" && !iAmX) {
          ch.send({ type: "broadcast", event: "join", payload: {} });
          setPhase("playing");
        }
      });
    channelRef.current = ch;
  }, [supabase, myMark]);

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current); }, [supabase]);

  const handleCreate = () => {
    const code = generateRoomCode();
    setRoom(code); setMyMark("X"); setPhase("waiting"); subscribe(code, true);
  };

  const handleJoin = () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) return;
    setRoom(code); setMyMark("O"); subscribe(code, false);
  };

  const handleDrop = useCallback((col: number) => {
    if (winner || turn !== myMark || phase !== "playing") return;
    const next = dropPiece(board, col, myMark);
    if (!next) return;

    // Find which row piece landed
    const row = next.reduce((found, r, ri) =>
      r[col] === myMark && (found === -1 || ri > found) ? ri : found, -1);
    setNewCell([row, col]);
    setBoard(next);

    const win = checkWin(next, myMark);
    if (win) {
      setWinner(myMark); setWinCells(win);
      setTimeout(() => setShowConfetti(true), 300);
    } else if (isDraw(next)) {
      setWinner("draw");
    } else {
      setTurn(prev => prev === "X" ? "O" : "X");
    }

    channelRef.current?.send({
      type: "broadcast", event: "drop",
      payload: { col, mark: myMark },
    });
  }, [board, myMark, turn, winner, phase]);

  const handleRematch = () => {
    setBoard(emptyBoard()); setTurn("X"); setWinner(null);
    setWinCells(null); setNewCell(null); setShowConfetti(false);
    setMyMark(m => m === "X" ? "O" : "X");
    channelRef.current?.send({ type: "broadcast", event: "rematch", payload: {} });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const isMyTurn = turn === myMark && !winner && phase === "playing";
  const iWon     = winner && winner !== "draw" && winner === myMark;
  const theyWon  = winner && winner !== "draw" && winner !== myMark;

  let statusText = "";
  if (phase === "waiting") statusText = `Waiting for ${theirName}…`;
  else if (phase === "playing") {
    if (winner === "draw")   statusText = "It's a draw! 🤝";
    else if (iWon)    statusText = "You win! 🎉";
    else if (theyWon) statusText = `${theirName} wins!`;
    else              statusText = isMyTurn ? "Your turn — pick a column" : `${theirName} is thinking…`;
  }

  return (
    <div className="mx-auto max-w-sm pt-5 pb-6 flex flex-col gap-4 px-4">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0">
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Connect Four</h1>
          <p className="text-[11px] text-[var(--color-text-muted)]">Real-time · No database</p>
        </div>
        {room && phase !== "lobby" && (
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] border border-[rgba(212,164,71,0.25)] rounded-full px-3 py-1.5 hover:bg-[rgba(212,164,71,0.08)] transition-all active:scale-95">
            {copied ? <><Check size={12}/>Copied!</> : <><Copy size={12}/>{room}</>}
          </button>
        )}
      </div>

      {/* ── Lobby ── */}
      {phase === "lobby" && (
        <Card variant="raised">
          <CardContent className="py-8 space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: myColor, color: "#0A0A0A" }}>{myAvatar}</div>
                <span className="text-[11px] text-[var(--color-text-muted)]">{myName}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Swords size={24} className="text-[var(--color-accent)]" />
                <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">vs</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: theirColor, color: "#fff" }}>{theirAvatar}</div>
                <span className="text-[11px] text-[var(--color-text-muted)]">{theirName}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Get 4 in a row</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Create a room or enter their code</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={handleCreate}><Swords size={15}/>Create room</Button>
              <div className="flex gap-2">
                <input type="text" value={joinInput} onChange={e => setJoinInput(e.target.value.toUpperCase().slice(0,4))}
                  onKeyDown={e => e.key==="Enter" && handleJoin()} placeholder="Room code" maxLength={4}
                  className="flex-1 h-11 px-4 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)] text-sm font-mono tracking-[0.3em] text-center placeholder:text-[var(--color-text-muted)] placeholder:tracking-normal focus:outline-none focus:border-[var(--color-accent)] transition-colors"/>
                <Button variant="secondary" onClick={handleJoin} disabled={joinInput.length !== 4}>Join</Button>
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
              <span className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin"/>
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
              {copied ? <><Check size={12}/>Copied!</> : <><Share2 size={12}/>Copy code</>}
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Playing ── */}
      {phase === "playing" && (
        <>
          {/* Turn indicator */}
          <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
            <div className={cn("flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all", isMyTurn && "bg-[rgba(212,164,71,0.08)]")}>
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", isMyTurn && "animate-turn-glow")}
                style={{ background: myColor, color: "#0A0A0A" }}>{myAvatar}</div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{myName}</p>
                <div className="flex items-center gap-1">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: myColor }}/>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{myMark}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] text-center shrink-0 max-w-[80px] leading-tight">{statusText}</p>
            <div className={cn("flex items-center gap-2 flex-1 rounded-xl px-2 py-1.5 transition-all flex-row-reverse", !isMyTurn && !winner && "bg-[rgba(255,255,255,0.05)]")}>
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", !isMyTurn && !winner && "animate-turn-glow")}
                style={{ background: theirColor, color:"#fff" }}>{theirAvatar}</div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{theirName}</p>
                <div className="flex items-center gap-1 justify-end">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theirColor }}/>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{myMark === "X" ? "O" : "X"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hover row */}
          <div className="flex gap-1 px-0.5">
            {Array.from({ length: COLS }, (_, c) => (
              <div key={c} className="flex-1">
                <HoverDot active={hoverCol === c && isMyTurn} color={myColor} />
              </div>
            ))}
          </div>

          {/* Board */}
          <div
            className="glass rounded-2xl p-2 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            onMouseLeave={() => setHoverCol(null)}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinCell = winCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;
                const isNew = newCell?.[0] === r && newCell?.[1] === c;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn("rounded-xl cursor-pointer transition-colors", isMyTurn && !winner && "hover:bg-[rgba(255,255,255,0.04)]")}
                    onClick={() => handleDrop(c)}
                    onMouseEnter={() => isMyTurn && setHoverCol(c)}
                  >
                    <Piece cell={cell} isWin={isWinCell} isNew={!!isNew} myColor={myColor} theirColor={theirColor} myMark={myMark} />
                  </div>
                );
              })
            )}
          </div>

          {/* Column tap zones (mobile — full-height invisible buttons) */}
          <div className="sr-only" aria-hidden>
            {Array.from({ length: COLS }, (_, c) => (
              <button key={c} onClick={() => handleDrop(c)}>Column {c+1}</button>
            ))}
          </div>

          {/* Result */}
          {winner && (
            <div className="space-y-3 animate-fade-up">
              <div className={cn("rounded-2xl border px-4 py-4 text-center",
                iWon     && "bg-[rgba(83,141,78,0.12)] border-[rgba(83,141,78,0.35)] shadow-[0_0_32px_rgba(83,141,78,0.12)]",
                theyWon  && "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]",
                winner==="draw" && "bg-[rgba(212,164,71,0.07)] border-[rgba(212,164,71,0.2)]",
              )}>
                <p className="text-2xl mb-1">{iWon ? "🏆" : theyWon ? "😔" : "🤝"}</p>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{statusText}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 gap-1.5" onClick={handleRematch}><RefreshCw size={13}/>Rematch</Button>
                <Button className="flex-1" asChild><Link href="/games">Back</Link></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
