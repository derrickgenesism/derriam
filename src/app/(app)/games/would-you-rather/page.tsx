"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

export default function WouldYouRatherPage() {
  const { currentUser } = useAppConfig();
  const supabase = createClient();
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data and setup realtime
  useEffect(() => {
    async function fetchData() {
      const pRes = await supabase.from("prompts").select("*").eq("category", "would-you-rather").eq('is_active', true).order('created_at', { ascending: true }).order('id', { ascending: true });
      const aRes = await supabase.from("prompt_answers").select("*");
      
      if (pRes.data) setPrompts(pRes.data);
      if (aRes.data) setAnswers(aRes.data);
      
      setIsLoading(false);
    }
    fetchData();

    const channel = supabase
      .channel('public:prompt_answers_wyr')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompt_answers' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setAnswers(prev => {
            const existing = prev.findIndex(a => a.id === payload.new.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = payload.new;
              return updated;
            }
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setAnswers(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    // Mobile fallback: refetch on window focus
    const handleFocus = async () => {
      const aRes = await supabase.from('prompt_answers').select('*');
      if (aRes.data) setAnswers(aRes.data);
    };
    window.addEventListener('focus', handleFocus);

    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('focus', handleFocus);
    };
  }, [supabase]);

  const firstUnansweredIndex = prompts.findIndex(p => {
    const myAns = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
    const theirAns = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
    return !(myAns && theirAns);
  });
  
  const targetIndex = firstUnansweredIndex === -1 ? prompts.length : firstUnansweredIndex;
  const [index, setIndex] = useState(targetIndex);

  // Sync index if history was reset
  useEffect(() => {
    if (targetIndex < index) {
      setIndex(targetIndex);
    }
  }, [targetIndex, index]);

  // Initial sync once loaded
  useEffect(() => {
    if (!isLoading && targetIndex < prompts.length) setIndex(targetIndex);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const matchScore = prompts.filter(p => {
    const my = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
    const their = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
    return my && their && my.answer === their.answer;
  }).length;

  const splitScore = prompts.filter(p => {
    const my = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
    const their = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
    return my && their && my.answer !== their.answer;
  }).length;

  const current = prompts[index];
  
  if (!current || targetIndex === prompts.length) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center space-y-4">
        <span className="text-5xl text-[var(--color-accent)]">⚡</span>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">All done!</h2>
        <p className="text-[var(--color-text-secondary)]">
          You matched on <span className="text-[var(--color-accent)] font-semibold">{matchScore}</span> out of {prompts.length} dilemmas.
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {matchScore >= prompts.length * 0.7 ? "You two are dangerously aligned." : matchScore >= prompts.length * 0.4 ? "Perfectly balanced — opposites attract." : "You love to disagree. We respect it."}
        </p>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={async () => {
            if (confirm("Reset ALL Would You Rather questions?")) {
              const ids = prompts.map(p => p.id);
              await supabase.from('prompt_answers').delete().in('prompt_id', ids);
            }
          }}>
            <RotateCcw size={15} /> Play again
          </Button>
          <Button asChild>
            <Link href="/games">Back to games</Link>
          </Button>
        </div>
      </div>
    );
  }

  const myAns = answers.find(a => a.prompt_id === current.id && a.user_identity === currentUser);
  const theirAns = answers.find(a => a.prompt_id === current.id && a.user_identity !== currentUser);
  
  const myPick = myAns?.answer;
  const partnerPick = theirAns?.answer;
  
  const isWaiting = myPick && !partnerPick;
  const isRevealed = myPick && partnerPick;

  const handlePick = async (pick: "A" | "B") => {
    if (myPick) return;
    await supabase.from('prompt_answers').insert({
      prompt_id: current.id,
      user_identity: currentUser,
      answer: pick
    });
  };

  const handleNext = () => {
    setIndex(targetIndex);
  };

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
          <span className="text-[var(--color-accent)]">{matchScore} match</span>
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="text-[var(--color-text-secondary)]">{splitScore} split</span>
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
                { key: "A" as const, text: current.option_a! },
                { key: "B" as const, text: current.option_b! },
              ].map(({ key, text }) => {
                const isPicked   = myPick === key;
                const isPartner  = isRevealed && partnerPick === key;

                return (
                  <button
                    key={key}
                    onClick={() => !myPick && handlePick(key)}
                    disabled={!!myPick}
                    className={cn(
                      "w-full text-left rounded-2xl border px-5 py-4 transition-all duration-300 active:scale-[0.98]",
                      "disabled:cursor-default",
                      // playing — normal glass
                      !myPick && "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.07)]",
                      // my pick highlight
                      isPicked && "bg-[rgba(212,164,71,0.12)] border-[rgba(212,164,71,0.30)]",
                      // not picked — dim
                      !isPicked && !!myPick && "opacity-50 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)]",
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
            {isWaiting && (
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <p className="text-sm text-[var(--color-text-muted)]">Waiting for your partner…</p>
              </div>
            )}

            {isRevealed && (
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
      {isRevealed && (
        <div className="px-5 animate-fade-up">
          <Button className="w-full" onClick={handleNext}>
            Next dilemma <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
