"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface NudgeButtonProps {
  onNudge?: () => void;
  cooldownSeconds?: number;
}

export function NudgeButton({ onNudge, cooldownSeconds = 60 }: NudgeButtonProps) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "cooldown">("idle");
  const [ripples, setRipples] = useState(0);

  const handleNudge = async () => {
    if (state !== "idle") return;
    setState("sending");
    setRipples((n) => n + 1);
    await new Promise((r) => setTimeout(r, 700));
    setState("sent");
    onNudge?.();
    setTimeout(() => {
      setState("cooldown");
      setTimeout(() => setState("idle"), cooldownSeconds * 1000);
    }, 1500);
  };

  const isIdle = state === "idle";
  const isSent = state === "sent";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Ambient ring (always shown, pulsing when idle) */}
        <span
          className={cn(
            "absolute h-20 w-20 rounded-full border border-[rgba(212,164,71,0.15)] transition-all duration-500",
            isIdle && "animate-pulse-glow"
          )}
        />
        <span
          className={cn(
            "absolute h-28 w-28 rounded-full border border-[rgba(212,164,71,0.07)] transition-all duration-500",
            isIdle && "animate-pulse-glow delay-150"
          )}
        />

        {/* Ripple rings on tap */}
        {ripples > 0 && (
          <>
            <span className="absolute h-16 w-16 rounded-full bg-[rgba(212,164,71,0.3)] animate-ripple" />
            <span className="absolute h-16 w-16 rounded-full bg-[rgba(212,164,71,0.2)] animate-ripple delay-150" />
          </>
        )}

        {/* Main button */}
        <button
          onClick={handleNudge}
          disabled={state !== "idle"}
          aria-label="Send a nudge to your partner"
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full",
            "transition-all duration-300 active:scale-90 disabled:cursor-not-allowed",
            "text-2xl font-light select-none",
            isIdle && [
              "border-2 border-[var(--color-accent)]",
              "bg-[rgba(212,164,71,0.08)]",
              "text-[var(--color-accent)]",
              "shadow-[0_0_0_0_rgba(212,164,71,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
              "animate-pulse-glow",
            ].join(" "),
            isSent && [
              "border-2 border-[var(--color-accent)]",
              "bg-[linear-gradient(135deg,#E0B458,#C49030)]",
              "text-[#0A0A0A]",
              "shadow-[0_0_24px_rgba(212,164,71,0.5)]",
            ].join(" "),
            state === "cooldown" && [
              "border border-[rgba(255,255,255,0.08)]",
              "bg-[rgba(255,255,255,0.04)]",
              "text-[var(--color-text-muted)]",
            ].join(" "),
            state === "sending" && [
              "border-2 border-[var(--color-accent)]",
              "bg-[rgba(212,164,71,0.12)]",
              "text-[var(--color-accent)]",
            ].join(" ")
          )}
        >
          {isSent ? "✓" : "✦"}
        </button>
      </div>

      <span className="text-[11px] tracking-wider text-[var(--color-text-muted)] uppercase font-medium">
        {state === "idle"     && "thinking of you"}
        {state === "sending"  && "sending…"}
        {state === "sent"     && "✦ nudge sent"}
        {state === "cooldown" && "sent · resting"}
      </span>
    </div>
  );
}
