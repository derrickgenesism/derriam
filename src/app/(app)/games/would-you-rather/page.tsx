"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type GamePhase = "playing" | "my-pick" | "waiting" | "reveal" | "done";

export default function WouldYouRatherPage() {
  const [index, setIndex]         = useState(0);
  const [myPick, setMyPick]       = useState<"A" | "B" | null>(null);
  const [phase, setPhase]         = useState<GamePhase>("playing");
  const [score, setScore]         = useState({ match: 0, split: 0 });
  const [prompts, setPrompts]     = useState<any[]>([]);
  const [partnerPick, setPartnerPick] = useState<"A" | "B" | null>(null);

  const supabase = createClient();

  // Load prompts
  useState(() => {
    supabase.from("prompts").select("*").eq("category", "would-you-rather").then(({ data }) => {
      if (data) {
        // shuffle
        const shuffled = data.sort(() => 0.5 - Math.random());
        setPrompts(shuffled);
      }
    });
  });

  const current = prompts[index];

  const handlePick = (pick: "A" | "B") => {
    setMyPick(pick);
    setPhase("waiting");
    // Simulate partner responding after 1.2s
    const fakePartner = Math.random() > 0.5 ? "A" : "B";
    setPartnerPick(fakePartner);
    setTimeout(() => {
      setPhase("reveal");
      if (pick === fakePartner) setScore((s) => ({ ...s, match: s.match + 1 }));
      else setScore((s) => ({ ...s, split: s.split + 1 }));
    }, 1200);
  };

  const handleNext = () => {
    if (index + 1 >= prompts.length) { setPhase("done"); return; }
    setIndex((i) => i + 1);
    setMyPick(null);
    setPartnerPick(null);
    setPhase("playing");
  };

  if (!current || phase === "done") {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center space-y-4">
        <span className="text-5xl text-[var(--color-accent)]">⚡</span>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">All done!</h2>
        <p className="text-[var(--color-text-secondary)]">
          You matched on <span className="text-[var(--color-accent)] font-semibold">{score.match}</span> out of {prompts.length} dilemmas.
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {score.match >= prompts.length * 0.7 ? "You two are dangerously aligned." : score.match >= prompts.length * 0.4 ? "Perfectly balanced — opposites attract." : "You love to disagree. We respect it."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/games">Back to games</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-6 pb-4 space-y-6">

      {/* Header */}
      <div className="px-5 flex items-center gap-3">
        <Link href="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Would You Rather</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Round {index + 1} of {prompts.length}</p>
        </div>
        {/* Score */}
        <div className="ml-auto flex items-center gap-2 text-xs font-medium">
          <span className="text-[var(--color-accent)]">{score.match} match</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="text-[var(--color-text-secondary)]">{score.split} split</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#D4A447,#E0B458)] transition-all duration-500"
            style={{ width: `${((index) / prompts.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="px-5">
        <Card variant="raised">
          <CardContent className="py-6 space-y-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              ⚡ Would You Rather…
            </p>

            {/* Options */}
            <div className="space-y-3">
              {[
                { key: "A" as const, text: current.optionA! },
                { key: "B" as const, text: current.optionB! },
              ].map(({ key, text }) => {
                const isPicked   = myPick === key;
                const isPartner  = phase === "reveal" && partnerPick === key;
                const isRevealed = phase === "reveal";

                return (
                  <button
                    key={key}
                    onClick={() => phase === "playing" && handlePick(key)}
                    disabled={phase !== "playing"}
                    className={cn(
                      "w-full text-left rounded-2xl border px-5 py-4 transition-all duration-300 active:scale-[0.98]",
                      "disabled:cursor-default",
                      // playing — normal glass
                      phase === "playing" && "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.07)]",
                      // my pick highlight
                      isPicked && phase !== "playing" && "bg-[rgba(212,164,71,0.12)] border-[rgba(212,164,71,0.30)]",
                      // not picked — dim
                      !isPicked && phase !== "playing" && "opacity-50 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          isPicked
                            ? "bg-[var(--color-accent)] text-[#0A0A0A]"
                            : "bg-[rgba(255,255,255,0.08)] text-[var(--color-text-muted)]"
                        )}
                      >
                        {key}
                      </span>
                      <span className={cn("text-sm leading-relaxed", isPicked ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-secondary)]")}>
                        {text}
                      </span>
                    </div>

                    {/* Reveal badges */}
                    {isRevealed && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {isPicked && (
                          <span className="text-[10px] font-semibold bg-[rgba(212,164,71,0.15)] text-[var(--color-accent)] border border-[rgba(212,164,71,0.20)] rounded-full px-2.5 py-1">
                            You ✦
                          </span>
                        )}
                        {isPartner && (
                          <span className="text-[10px] font-semibold bg-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] border border-[rgba(255,255,255,0.10)] rounded-full px-2.5 py-1">
                            Them ◎
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* State messages */}
            {phase === "waiting" && (
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <p className="text-sm text-[var(--color-text-muted)]">Waiting for your partner…</p>
              </div>
            )}

            {phase === "reveal" && (
              <div className={cn(
                "rounded-2xl px-5 py-4 text-center border",
                myPick === partnerPick
                  ? "bg-[rgba(212,164,71,0.10)] border-[rgba(212,164,71,0.25)]"
                  : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
              )}>
                <p className="text-base font-bold text-[var(--color-text-primary)]">
                  {myPick === partnerPick ? "✦ You both chose " + myPick + "!" : "You split! You: " + myPick + " · Them: " + partnerPick}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {myPick === partnerPick ? "Dangerously in sync." : "Opposites attract — or create chaos."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next button */}
      {phase === "reveal" && (
        <div className="px-5 animate-fade-up">
          <Button className="w-full" onClick={handleNext}>
            Next dilemma <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
