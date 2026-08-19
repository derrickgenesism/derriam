"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useAppConfig } from "@/lib/store";

export default function LandingPage() {
  const { config } = useAppConfig();
  const router = useRouter();
  const [skipNextTime, setSkipNextTime] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user previously checked "skip next time"
    if (localStorage.getItem("derriam_skip_welcome") === "true") {
      router.replace("/home");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (skipNextTime) {
      localStorage.setItem("derriam_skip_welcome", "true");
    }
    router.push("/home");
  };

  if (isChecking) return null; // Prevent flash of welcome screen if skipping

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Large atmospheric glow behind wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 h-[500px] w-[500px] rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #D4A447 0%, transparent 65%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
        {/* Wordmark */}
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] opacity-80">
          Private · Intimate · Ours
        </div>
        <h1 className="font-serif text-6xl font-normal tracking-[-0.02em] text-[var(--color-text-primary)]">
          {config.appName}
        </h1>

        {/* Tagline */}
        <p className="mt-5 text-lg text-[var(--color-text-secondary)] leading-relaxed font-light">
          Our private space.<br />
          <span className="text-[var(--color-text-primary)]">Close, even from far.</span>
        </p>

        <p className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
          Only the two of us. There is no one else talking, we are only us.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex w-full flex-col gap-4">
          <Button size="lg" className="w-full" onClick={handleEnter}>
            Enter our space
            <ArrowRight size={17} />
          </Button>

          {/* Don't show again toggle */}
          <button 
            onClick={() => setSkipNextTime(!skipNextTime)}
            className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors active:scale-95"
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${skipNextTime ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[#0A0A0A]' : 'border-[var(--color-border)] bg-transparent'}`}>
              {skipNextTime && <Check size={12} strokeWidth={3} />}
            </div>
            Don't show this again
          </button>
        </div>

        {/* Trust */}
        <p className="mt-8 text-[11px] text-[var(--color-text-muted)] tracking-wide">
          Just the two of ours.
        </p>
      </div>
    </div>
  );
}
