"use client";

import { TopBar } from "@/components/layout/TopBar";
import { MoodBeacon } from "@/components/features/MoodBeacon";
import { DailyPromptCard } from "@/components/features/DailyPromptCard";
import { NudgeButton } from "@/components/features/NudgeButton";
import { Card, CardContent } from "@/components/ui/card";
import { Video, ChevronRight, Plane, MessageCircleHeart, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useAppConfig } from "@/lib/store";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const { config, currentUser, updateMe, updateThem } = useAppConfig();
  const supabase = createClient();
  const [dailyPrompt, setDailyPrompt] = useState<any>(null);
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch one active daily prompt (or just any deep prompt)
      const { data: prompts } = await supabase.from('prompts')
        .select('*')
        .eq('is_active', true)
        .limit(20);
        
      const { data: answers } = await supabase.from('prompt_answers').select('*');

      if (prompts && answers) {
        // Find a prompt we haven't both answered yet
        const unanswered = prompts.find(p => {
          const myAns = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
          const theirAns = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
          return !(myAns && theirAns);
        });
        
        if (unanswered) {
          const myAns = answers.find(a => a.prompt_id === unanswered.id && a.user_identity === currentUser);
          setDailyPrompt({
            question: unanswered.question,
            hasAnswered: !!myAns,
            bothAnswered: false
          });
        }

        // Build History (Prompts where both answered)
        const history: any[] = [];
        prompts.forEach(p => {
          const myAns = answers.find(a => a.prompt_id === p.id && a.user_identity === currentUser);
          const theirAns = answers.find(a => a.prompt_id === p.id && a.user_identity !== currentUser);
          if (myAns && theirAns) {
            history.push({ prompt: p, myAns, theirAns });
          }
        });
        setRecentPrompts(history.slice(-5).reverse()); // Last 5
      }

      // 2. Fetch upcoming plans
      const { data: plansData } = await supabase.from("plans")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(2);
      
      if (plansData) {
        setUpcomingPlans(plansData);
      }
    }
    loadData();

    // Set up realtime updates for answers
    const channel = supabase.channel('home_answers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompt_answers' }, () => {
        loadData();
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, supabase]);

  // Calculate days until reunion
  let daysUntil = 0;
  if (config.nextReunionDate) {
    const target = new Date(config.nextReunionDate);
    const now = new Date();
    daysUntil = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <>
      <TopBar />

      <main className="mx-auto max-w-lg space-y-6 pt-2 pb-10">

        {/* Nudge button */}
        <div className="flex justify-center">
          <NudgeButton />
        </div>

        {/* Mood Beacons */}
        <MoodBeacon 
          currentMood={currentUser === 'me' ? config.me.mood : config.them.mood} 
          onSelect={async (mood) => {
            if (currentUser === 'me') {
              await updateMe({ mood });
            } else {
              await updateThem({ mood });
            }
          }}
        />

        {/* Daily Prompt */}
        <Link href="/prompt" className="block">
          <DailyPromptCard
            question={dailyPrompt ? dailyPrompt.question : "Check out all 800 new prompts!"}
            bothAnswered={false}
            hasAnswered={dailyPrompt ? dailyPrompt.hasAnswered : false}
          />
        </Link>

        {/* Next up */}
        <section className="px-5">
          <Card variant="raised" className="hover:border-[var(--color-accent-muted)] transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  Next up
                </p>
                <Link href="/plans" className="text-xs text-[var(--color-accent)] hover:underline">See all</Link>
              </div>
              <div className="flex gap-4">
                {upcomingPlans.length > 0 ? (
                  upcomingPlans.map((plan, i) => (
                    <div key={plan.id} className="flex-1 flex items-center gap-2.5 relative">
                      {i > 0 && <div className="absolute -left-2 top-0 bottom-0 w-px bg-[var(--color-border)]" />}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-overlay)]">
                        {plan.type === 'call' ? (
                          <Video size={15} className="text-[var(--color-accent)]" strokeWidth={1.75} />
                        ) : plan.type === 'visit' ? (
                          <Plane size={15} className="text-[var(--color-accent)]" strokeWidth={1.75} />
                        ) : (
                          <CalendarDays size={15} className="text-[var(--color-accent)]" strokeWidth={1.75} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate max-w-[100px]">{plan.title}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(plan.event_date))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] italic py-2">No upcoming plans. Schedule something!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prompt History */}
        <section className="px-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              Prompt History
            </h2>
            <Link href="/prompt" className="text-xs text-[var(--color-accent)] hover:underline">
              Answer more
            </Link>
          </div>

          <div className="space-y-3">
            {recentPrompts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-6 border border-[rgba(255,255,255,0.05)] rounded-2xl bg-[rgba(255,255,255,0.02)]">
                No history yet. Answer a prompt together!
              </p>
            ) : (
              recentPrompts.map((h, i) => (
                <Card key={i} variant="default">
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug flex gap-2">
                      <MessageCircleHeart size={14} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                      {h.prompt.question}
                    </p>
                    
                    {h.prompt.category === "brain-teaser" && h.prompt.option_a && (
                      <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(212,164,71,0.3)] mx-1">
                        <p className="text-[9px] font-bold text-[var(--color-accent)] uppercase tracking-widest text-center mb-0.5 flex items-center justify-center gap-1">🧩 Correct Answer</p>
                        <p className="text-xs text-center text-[var(--color-text-primary)] font-medium">{h.prompt.option_a}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-[rgba(212,164,71,0.1)] border border-[rgba(212,164,71,0.15)]">
                        <p className="text-[9px] font-bold text-[var(--color-accent)] uppercase tracking-wider mb-0.5">You</p>
                        <p className="text-xs text-[var(--color-text-primary)]">{h.myAns.answer}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">{currentUser === 'me' ? config.them.name : config.me.name}</p>
                        <p className="text-xs text-[var(--color-text-primary)]">{h.theirAns.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

      </main>
    </>
  );
}
