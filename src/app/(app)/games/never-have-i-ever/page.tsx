"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

export default function NeverHaveIEverPage() {
  const { currentUser } = useAppConfig();
  const supabase = createClient();

  const [prompts, setPrompts] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data and setup realtime
  useEffect(() => {
    async function fetchData() {
      const pRes = await supabase.from("prompts").select("*").eq("category", "never-have-i-ever").eq('is_active', true).order('created_at', { ascending: true });
      const aRes = await supabase.from("prompt_answers").select("*");
      
      if (pRes.data) setPrompts(pRes.data);
      if (aRes.data) setAnswers(aRes.data);
      
      setIsLoading(false);
    }
    fetchData();

    const channel = supabase
      .channel('public:prompt_answers_nhie')
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

  const myScore = prompts.filter(p => {
    const my = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
    return my && my.answer === "have";
  }).length;

  const theirScore = prompts.filter(p => {
    const their = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
    return their && their.answer === "have";
  }).length;

  const current = prompts[index];

  if (!current || targetIndex === prompts.length) {
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
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={async () => {
            if (confirm("Reset ALL Never Have I Ever questions?")) {
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

  const statement = current.question;

  const myAns = answers.find(a => a.prompt_id === current.id && a.user_identity === currentUser);
  const theirAns = answers.find(a => a.prompt_id === current.id && a.user_identity !== currentUser);
  
  const myPick = myAns?.answer;
  const partnerPick = theirAns?.answer;
  
  const isWaiting = myPick && !partnerPick;
  const isRevealed = myPick && partnerPick;

  const handlePick = async (pick: "have" | "never") => {
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
            style={{ width: `${((index) / prompts.length) * 100}%` }}
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
            {!myPick && (
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
            {isWaiting && (
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <p className="text-sm text-[var(--color-text-muted)]">Waiting for your partner…</p>
              </div>
            )}

            {/* Reveal */}
            {isRevealed && (
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
      {isRevealed && (
        <div className="px-5 animate-fade-up">
          <Button className="w-full" onClick={handleNext}>
            {targetIndex < prompts.length ? <>Next round <ChevronRight size={16} /></> : "See results ✦"}
          </Button>
        </div>
      )}
    </div>
  );
}
