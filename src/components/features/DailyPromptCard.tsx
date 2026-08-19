"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface DailyPromptCardProps {
  question: string;
  myAnswer?: string;
  partnerAnswer?: string;
  bothAnswered?: boolean;
  hasAnswered?: boolean;
}

export function DailyPromptCard({
  question,
  myAnswer,
  partnerAnswer,
  bothAnswered = false,
  hasAnswered = false,
}: DailyPromptCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [answer, setAnswer] = useState(myAnswer ?? "");
  const [submitted, setSubmitted] = useState(hasAnswered);

  // Sync state with props in case they load asynchronously
  useEffect(() => {
    setSubmitted(hasAnswered);
    if (myAnswer) setAnswer(myAnswer);
  }, [hasAnswered, myAnswer]);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    setShowInput(false);
    // TODO: persist to Supabase
  };

  return (
    <section className="px-5">
      <Card className="overflow-hidden">
        {/* Header strip */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <CardTitle>Today&apos;s Prompt</CardTitle>
          {submitted && !bothAnswered && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse-soft" />
              waiting for partner
            </span>
          )}
        </div>

        <CardContent className="pt-0 space-y-4">
          {/* Question */}
          <p className="text-xl font-semibold leading-snug text-[var(--color-text-primary)]">
            {question}
          </p>

          {/* Reveal zone */}
          {bothAnswered ? (
            // Both answered — show both
            <div className="space-y-3 animate-fade-in">
              <AnswerBubble label="you" answer={answer || myAnswer || ""} />
              <AnswerBubble label="them" answer={partnerAnswer || ""} isPartner />
            </div>
          ) : submitted ? (
            // Only I answered — blur partner side
            <div className="space-y-3">
              <AnswerBubble label="you" answer={answer} />
              <BlurredAnswer />
            </div>
          ) : showInput ? (
            // Writing mode
            <div className="space-y-3 animate-fade-in">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer…"
                rows={3}
                className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                >
                  Send answer
                </Button>
              </div>
            </div>
          ) : (
            // Neither answered yet
            <div className="space-y-3">
              <BlurredAnswer />
              <Button
                className="w-full"
                onClick={() => setShowInput(true)}
              >
                Answer today&apos;s prompt
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AnswerBubble({
  label,
  answer,
  isPartner = false,
}: {
  label: string;
  answer: string;
  isPartner?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 text-sm leading-relaxed",
        isPartner
          ? "bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)]"
          : "bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)] text-[var(--color-text-primary)]"
      )}
    >
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </span>
      {answer}
    </div>
  );
}

function BlurredAnswer() {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="bg-[var(--color-surface-overlay)] p-4 text-sm blur-sm select-none opacity-60">
        This is where the other answer will appear once both of you have responded to the question
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <Lock size={18} className="text-[var(--color-accent)]" strokeWidth={1.75} />
        <span className="text-xs text-[var(--color-text-secondary)]">
          Waiting for both of you…
        </span>
      </div>
    </div>
  );
}


