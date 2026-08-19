import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Laugh, ChevronRight, Lock } from "lucide-react";

const GAMES = [
  {
    id: "would-you-rather",
    title: "Would You Rather",
    description: "Pick a side. See if you match — or spectacularly disagree.",
    symbol: "⚡",
    icon: Zap,
    count: "30+ dilemmas",
    href: "/games/would-you-rather",
    available: true,
  },
  {
    id: "never-have-i-ever",
    title: "Never Have I Ever",
    description: "LDR edition. Find out what you've secretly been up to.",
    symbol: "◎",
    icon: Laugh,
    count: "10 rounds",
    href: "/games/never-have-i-ever",
    available: true,
  },
  {
    id: "caption-this",
    title: "Caption This",
    description: "Post a photo. Partner writes a caption. You rate it.",
    symbol: "◈",
    icon: null,
    count: "Coming soon",
    href: "#",
    available: false,
  },
  {
    id: "how-well",
    title: "How Well Do You Know Me?",
    description: "Set 5 questions about yourself. See how many they get right.",
    symbol: "○",
    icon: null,
    count: "Coming soon",
    href: "#",
    available: false,
  },
];

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-lg pt-6 space-y-6 pb-4">

      {/* Header */}
      <div className="px-5">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Games</h1>
        <p className="text-xs text-[var(--color-text-muted)]">Play together, any time zone</p>
      </div>

      {/* Game cards */}
      <div className="px-5 space-y-3">
        {GAMES.map((game) => (
          <Card
            key={game.id}
            className={!game.available ? "opacity-50" : ""}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                {/* Symbol */}
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{
                    background: game.available
                      ? "rgba(212,164,71,0.10)"
                      : "rgba(255,255,255,0.04)",
                    border: game.available
                      ? "1px solid rgba(212,164,71,0.20)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className={game.available ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}>
                    {game.symbol}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {game.title}
                    </p>
                    {!game.available && (
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)] border border-[rgba(255,255,255,0.08)] rounded-full px-2 py-0.5">
                        soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-0.5">
                    {game.description}
                  </p>
                  <p className="text-[10px] text-[var(--color-accent)] font-medium mt-1">
                    {game.count}
                  </p>
                </div>

                {/* Arrow */}
                {game.available ? (
                  <Link href={game.href}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(212,164,71,0.10)] border border-[rgba(212,164,71,0.20)]">
                      <ChevronRight size={15} className="text-[var(--color-accent)]" strokeWidth={2.5} />
                    </div>
                  </Link>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                    <Lock size={13} className="text-[var(--color-text-muted)]" strokeWidth={1.75} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
