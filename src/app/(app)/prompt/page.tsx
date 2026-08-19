"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ChevronRight, X } from "lucide-react";
import { CATEGORY_META, type Prompt, type PromptCategory } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/client";
import { useAppConfig } from "@/lib/store";

const TABS: PromptCategory[] = ["daily", "would-you-rather", "deep", "unhinged", "debate", "brain-teaser"];

function CategoryTabs({ active, onChange }: { active: PromptCategory; onChange: (c: PromptCategory) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
      {TABS.map((cat) => {
        const meta = CATEGORY_META[cat];
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium",
              "border transition-all duration-200 active:scale-95",
              isActive
                ? "bg-[linear-gradient(135deg,#E0B458,#C49030)] border-transparent text-[#0A0A0A] font-semibold shadow-[0_0_16px_rgba(212,164,71,0.35)]"
                : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[rgba(255,255,255,0.14)]"
            )}
          >
            <span className={cn("text-[10px]", isActive ? "text-[#0A0A0A]" : "text-[var(--color-accent)]")}>{meta.emoji}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

type CardState = "idle" | "answering" | "submitted" | "skipping" | "revealed";

function PromptCardStack({ prompts, answers }: { prompts: Prompt[], answers: any[] }) {
  const [index, setIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>("idle");
  const [answer, setAnswer] = useState("");
  const [exitAnim, setExitAnim] = useState<"skip" | "respond" | null>(null);
  
  const { currentUser, config } = useAppConfig();
  const supabase = createClient();

  const current = prompts[index];
  const next    = prompts[index + 1];
  const after   = prompts[index + 2];

  // Check if current prompt is answered
  const myAnswer = current ? answers.find(a => a.prompt_id === current.id && a.user_identity === currentUser) : null;
  const theirAnswer = current ? answers.find(a => a.prompt_id === current.id && a.user_identity !== currentUser) : null;

  useEffect(() => {
    if (myAnswer && theirAnswer) setCardState("revealed");
    else if (myAnswer) setCardState("submitted");
    else setCardState("idle");
    setAnswer("");
  }, [current, myAnswer, theirAnswer]);

  if (!current) {
    return (
      <div className="px-5 flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-4xl text-[var(--color-accent)]">✦</span>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">All caught up</p>
        <p className="text-sm text-[var(--color-text-muted)]">You've gone through all prompts in this category.</p>
      </div>
    );
  }

  const advance = () => {
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExitAnim(null);
    }, 320);
  };

  const handleSkip = () => {
    setExitAnim("skip");
    advance();
  };

  const handleRespond = async (optionOrText?: string) => {
    if (cardState === "idle" && !optionOrText) { 
      setCardState("answering"); 
      return; 
    }
    
    const finalAnswer = optionOrText || answer.trim();
    if (!finalAnswer) return;

    // Optimistic UI update handled by DB realtime or local state reload, but let's visually submit instantly
    setCardState("submitted");

    // Save to Supabase
    await supabase.from('prompt_answers').insert({
      prompt_id: current.id,
      user_identity: currentUser,
      answer: finalAnswer
    });
    
    // If they already answered, we don't advance, we reveal!
    if (!theirAnswer) {
      setExitAnim("respond");
      advance();
    }
  };

  return (
    <div className="px-5 space-y-4">
      <div className="relative h-72">
        {after && <div className="absolute inset-x-0 top-4 mx-auto scale-[0.88] opacity-30 glass h-64 rounded-2xl pointer-events-none" />}
        {next && <div className="absolute inset-x-0 top-2 mx-auto scale-[0.94] opacity-60 glass h-64 rounded-2xl pointer-events-none" />}

        <Card className={cn(
          "absolute inset-0 overflow-hidden",
          exitAnim === "skip" && "animate-card-skip",
          exitAnim === "respond" && "animate-card-respond",
          !exitAnim && "animate-card-enter"
        )}>
          <CardContent className="h-full flex flex-col justify-between py-5">
            <div className="space-y-3">
              <CardTitle>{CATEGORY_META[current.category].emoji} {CATEGORY_META[current.category].label}</CardTitle>

              {/* Reveal State */}
              {cardState === "revealed" ? (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">{current.question}</p>
                  
                  {current.category === "brain-teaser" && current.optionA && (
                    <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[var(--color-accent)] mb-2 text-center shadow-[0_0_15px_rgba(212,164,71,0.2)]">
                      <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        🧩 Correct Answer
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{current.optionA}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[rgba(212,164,71,0.12)] border border-[rgba(212,164,71,0.25)]">
                      <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider mb-1">You</p>
                      <p className="text-sm text-[var(--color-text-primary)]">{myAnswer?.answer}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{currentUser === 'me' ? config.them.name : config.me.name}</p>
                      <p className="text-sm text-[var(--color-text-primary)]">{theirAnswer?.answer}</p>
                    </div>
                  </div>
                </div>
              ) : current.optionA && current.optionB && current.category !== 'brain-teaser' ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[13px] text-[var(--color-text-muted)]">Would you rather…</p>
                  {[current.optionA, current.optionB].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleRespond(i === 0 ? "A" : "B")}
                      disabled={cardState !== "idle"}
                      className="w-full text-left rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:bg-[rgba(212,164,71,0.07)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="mr-2 font-bold text-[var(--color-accent)]">{i === 0 ? "A" : "B"}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xl font-semibold leading-snug text-[var(--color-text-primary)] pt-1">{current.question}</p>
              )}
            </div>

            {cardState === "answering" && !(current.optionA && current.optionB && current.category !== 'brain-teaser') && (
              <textarea
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer…"
                rows={2}
                className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
            )}

            {cardState === "submitted" && (
              <div className="flex items-center gap-2 rounded-xl bg-[rgba(212,164,71,0.08)] border border-[rgba(212,164,71,0.15)] px-4 py-3">
                <Lock size={13} className="text-[var(--color-accent)]" strokeWidth={2} />
                <span className="text-xs text-[var(--color-text-secondary)]">Waiting for {currentUser === 'me' ? config.them.name : config.me.name}…</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {cardState === "revealed" ? (
          <Button className="w-full h-12" onClick={advance}>Next Prompt <ChevronRight size={16} /></Button>
        ) : (
          <>
            <button
              onClick={handleSkip}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all active:scale-95"
            >
              <X size={18} strokeWidth={2} />
            </button>
            <Button
              className="flex-1 h-12"
              onClick={() => handleRespond()}
              disabled={cardState === "submitted" || (current.optionA && current.optionB && current.category !== 'brain-teaser' ? true : false)}
            >
              {cardState === "idle"      && <>Answer <ChevronRight size={16} /></>}
              {cardState === "answering" && (answer.trim() ? "Submit answer" : "Type your answer…")}
              {cardState === "submitted" && "✓ Answered"}
            </Button>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-[var(--color-text-muted)]">
        {index + 1} of {prompts.length} · swipe or tap skip
      </p>
    </div>
  );
}

export default function PromptPage() {
  const { config, currentUser, setCurrentUser } = useAppConfig();
  const [activeCategory, setActiveCategory] = useState<PromptCategory>("daily");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const pRes = await supabase.from('prompts').select('*').eq('is_active', true);
      const aRes = await supabase.from('prompt_answers').select('*');
      
      if (pRes.data) {
        setPrompts(pRes.data.map((p: any) => ({
          id: p.id, category: p.category as PromptCategory, question: p.question,
          optionA: p.option_a, optionB: p.option_b, isActive: p.is_active, createdBy: "system"
        })));
      }
      if (aRes.data) setAnswers(aRes.data);
      
      setIsLoading(false);
    }
    fetchData();

    // Listen for real-time answers!
    const channel = supabase
      .channel('public:prompt_answers')
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

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const filtered = prompts.filter((p) => p.category === activeCategory);

  return (
    <div className="mx-auto max-w-lg pt-6 space-y-5 pb-4">
      <div className="px-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Prompts</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Answer together · reveal together</p>
        </div>
        <span className="text-[10px] uppercase font-bold text-[var(--color-accent)] tracking-widest bg-[rgba(212,164,71,0.1)] px-2.5 py-1 rounded-full border border-[rgba(212,164,71,0.2)]">
          {currentUser === 'me' ? config.me.name : config.them.name}
        </span>
      </div>

      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {isLoading ? (
        <div className="px-5 py-20 flex justify-center items-center">
          <span className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <PromptCardStack prompts={filtered} answers={answers} />
      )}
    </div>
  );
}
