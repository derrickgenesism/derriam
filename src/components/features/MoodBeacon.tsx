"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "thinking_of_you", label: "thinking of you", symbol: "✦" },
  { id: "need_a_hug",      label: "need a hug",      symbol: "◌" },
  { id: "missing_you",     label: "missing you",     symbol: "✧" },
  { id: "flirty",          label: "flirty",          symbol: "🔥" },
  { id: "stressed",        label: "stressed",        symbol: "〰" },
  { id: "need_space",      label: "need space",      symbol: "○" },
  { id: "excited",         label: "excited",         symbol: "◈" },
  { id: "tired",           label: "tired",           symbol: "◎" },
  { id: "lonely",          label: "lonely",          symbol: "雨" },
  { id: "cozy",            label: "cozy",            symbol: "☕" },
];

interface MoodBeaconProps {
  currentMood?: string;
  onSelect?: (moodId: string) => void;
}

export function MoodBeacon({ currentMood, onSelect }: MoodBeaconProps) {
  const [selected, setSelected] = useState<string | undefined>(currentMood);

  const handleSelect = (id: string) => {
    const next = selected === id ? undefined : id;
    setSelected(next);
    onSelect?.(next ?? "");
  };

  return (
    <section className="px-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        how you&apos;re feeling
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {MOODS.map((mood) => {
          const active = selected === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => handleSelect(mood.id)}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium",
                "border transition-all duration-200 active:scale-95",
                active
                  ? [
                      "text-[#0A0A0A] font-semibold",
                      "bg-[linear-gradient(135deg,#E0B458,#C49030)]",
                      "border-transparent",
                      "shadow-[0_0_16px_rgba(212,164,71,0.4),0_2px_8px_rgba(0,0,0,0.3)]",
                    ].join(" ")
                  : [
                      "text-[var(--color-text-secondary)]",
                      "bg-[rgba(255,255,255,0.04)]",
                      "border-[rgba(255,255,255,0.08)]",
                      "hover:border-[rgba(255,255,255,0.14)]",
                      "hover:text-[var(--color-text-primary)]",
                    ].join(" ")
              )}
            >
              <span className={cn("text-[10px] leading-none", active ? "text-[#0A0A0A]" : "text-[var(--color-accent)]")}>
                {mood.symbol}
              </span>
              {mood.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
