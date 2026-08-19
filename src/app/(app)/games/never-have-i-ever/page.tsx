"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pick = "have" | "never" | null;
type Phase = "playing" | "waiting" | "reveal";

export default function NeverHaveIEverPage() {
  const [index, setIndex]       = useState(0);
  const [myPick, setMyPick]     = useState<Pick>(null);
  const [phase, setPhase]       = useState<Phase>("playing");
  const [myScore, setMyScore]   = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const [done, setDone]         = useState(false);
  const [prompts, setPrompts]   = useState<any[]>([]);
  const [partnerPick, setPartnerPick] = useState<Pick>(null);

  const supabase = createClient();

  useState(() => {
    supabase.from("prompts").select("*").eq("category", "never-have-i-ever").then(({ data }) => {
      if (data) {
        const shuffled = data.sort(() => 0.5 - Math.random());
        setPrompts(shuffled);
      }
    });
  });

  const handlePick = (pick: "have" | "never") => {
    setMyPick(pick);
    setPhase("waiting");
    const fakePartner = Math.random() > 0.5 ? "have" : "never";
    setPartnerPick(fakePartner);
    if (pick === "have") setMyScore((s) => s + 1);
    if (fakePartner === "have") setTheirScore((s) => s + 1);
    setTimeout(() => setPhase("reveal"), 1000);
  };

  const handleNext = () => {
    if (index + 1 >= prompts.length) { setDone(true); return; }
    setIndex((i) => i + 1);
    setMyPick(null);
    setPartnerPick(null);
    setPhase("playing");
  };

  if (prompts.length === 0) return null;

  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center space-y-4">
        <span className="text-5xl text-[var(--color-accent)]">◎</span>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Round complete</h2>
        <div className="flex gap-8 mt-2">
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--color-accent)]">{myScore}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">you've done</p>
          </div>
          <div className="w-px bg-[rgba(255,255,255,0.08)]" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{theirScore}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">they've done</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-xs">
          {myScore > theirScore ? "You've lived more — or confessed more. Respect." : myScore < theirScore ? "Your partner has been busy. We'll let that sit." : "Equally lived. Equally mysterious."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/games">Back to games</Link>
        </Button>
      </div>
    );
  }

  const statement = prompts[index];

  return (
    <div className="mx-auto max-w-lg pt-6 pb-4 space-y-6">

      {/* Header */}
      <div className="px-5 flex items-center gap-3">
        <Link href="/games" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Never Have I Ever</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Round {index + 1} of {prompts.length}</p>
        </div>
        {/* Score */}
        <div className="ml-auto flex items-center gap-3 text-xs font-medium">
          <div className="text-center">
            <p className="text-[var(--color-accent)] font-bold">{myScore}</p>
            <p className="text-[var(--color-text-muted)] text-[10px]">you</p>
          </div>
          <div className="text-center">
            <p className="text-[var(--color-text-secondary)] font-bold">{theirScore}</p>
            <p className="text-[var(--color-text-muted)] text-[10px]">them</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#D4A447,#E0B458)] transition-all duration-500"
            style={{ width: `${(index / prompts.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Statement card */}
      <div className="px-5">
        <Card variant="raised">
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                ◎ Never Have I Ever
              </p>
              <p className="text-xl font-semibold leading-snug text-[var(--color-text-primary)]">
                {statement.replace("Never have I ever ", "")}
              </p>
            </div>

            {/* Pick buttons */}
            {phase === "playing" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handlePick("have")}
                  className="flex-1 flex flex-col items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] py-5 transition-all hover:border-[rgba(212,164,71,0.3)] hover:bg-[rgba(212,164,71,0.07)] active:scale-95"
                >
                  <span className="text-2xl">🙋</span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">I have</span>
                </button>
                <button
                  onClick={() => handlePick("never")}
                  className="flex-1 flex flex-col items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] py-5 transition-all hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.07)] active:scale-95"
                >
                  <span className="text-2xl">🙅</span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Never</span>
                </button>
              </div>
            )}

            {/* Waiting */}
            {phase === "waiting" && (
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <p className="text-sm text-[var(--color-text-muted)]">Waiting for your partner…</p>
              </div>
            )}

            {/* Reveal */}
            {phase === "reveal" && (
              <div className="space-y-3 animate-fade-up">
                <div className="flex gap-3">
                  <div className={cn(
                    "flex-1 rounded-2xl border py-4 text-center",
                    myPick === "have"
                      ? "bg-[rgba(212,164,71,0.12)] border-[rgba(212,164,71,0.25)]"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                  )}>
                    <p className="text-lg">{myPick === "have" ? "🙋" : "🙅"}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">you</p>
                  </div>
                  <div className={cn(
                    "flex-1 rounded-2xl border py-4 text-center",
                    partnerPick === "have"
                      ? "bg-[rgba(212,164,71,0.12)] border-[rgba(212,164,71,0.25)]"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                  )}>
                    <p className="text-lg">{partnerPick === "have" ? "🙋" : "🙅"}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">them</p>
                  </div>
                </div>

                <p className="text-center text-sm text-[var(--color-text-secondary)]">
                  {myPick === "have" && partnerPick === "have" && "You've both done it. No judgment. 👀"}
                  {myPick === "never" && partnerPick === "never" && "Two innocents. Suspicious."}
                  {myPick === "have" && partnerPick === "never" && "You have, they haven't. You owe them a story."}
                  {myPick === "never" && partnerPick === "have" && "They have, you haven't. Ask them later."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next */}
      {phase === "reveal" && (
        <div className="px-5 animate-fade-up">
          <Button className="w-full" onClick={handleNext}>
            {index + 1 < prompts.length ? <>Next round <ChevronRight size={16} /></> : "See results ✦"}
          </Button>
        </div>
      )}
    </div>
  );
}
