"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAppConfig } from "@/lib/store";

export default function LandingPage() {
  const { config } = useAppConfig();
  
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
        <div className="mt-10 flex w-full flex-col gap-3">
          <Button size="lg" className="w-full" asChild>
            <Link href="/home">
              Enter our space
              <ArrowRight size={17} />
            </Link>
          </Button>
        </div>

        {/* Trust */}
        <p className="mt-8 text-[11px] text-[var(--color-text-muted)] tracking-wide">
          Just the two of ours.
        </p>
      </div>

    </div>
  );
}
