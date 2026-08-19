"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginScreen({ onLogin, config }: { onLogin: (user: "me" | "them") => void, config: any }) {
  const [selectedUser, setSelectedUser] = useState<"me" | "them" | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUserSelect = (user: "me" | "them") => {
    setSelectedUser(user);
    setPin("");
    setError(false);
  };

  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const handleKeypad = (num: string) => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    if (pin.length >= 4) return;
    
    const newPin = pin + num;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDelete = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (enteredPin: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const correctPin = selectedUser === "me" ? config.me.pin : config.them.pin;
      
      if (enteredPin === correctPin) {
        setAttempts(0);
        onLogin(selectedUser!);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(true);
        setPin("");
        
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 60000); // 1 minute lockout
        }
      }
      setIsVerifying(false);
    }, 400);
  };

  // If they haven't selected a user yet
  if (!selectedUser) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080808] px-6">
        {/* Large atmospheric glow behind wordmark */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 h-[500px] w-[500px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #D4A447 0%, transparent 65%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
          {/* Wordmark */}
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] opacity-80">
            Private · Intimate · Ours
          </div>
          <h1 className="font-serif text-6xl font-normal tracking-[-0.02em] text-[var(--color-text-primary)] mb-8">
            {config.appName}
          </h1>

          <div className="flex w-full flex-col gap-4">
            <button
              onClick={() => handleUserSelect("me")}
              className="flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-left hover:border-[var(--color-accent)] hover:bg-[rgba(212,164,71,0.05)] transition-all active:scale-[0.98]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner"
                style={{ background: `radial-gradient(135deg, ${config.me.avatarColor}cc, ${config.me.avatarColor}66)` }}
              >
                {config.me.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-base font-medium text-[var(--color-text-primary)]">{config.me.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Enter PIN to access</p>
              </div>
            </button>

            <button
              onClick={() => handleUserSelect("them")}
              className="flex items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-left hover:border-[var(--color-accent)] hover:bg-[rgba(212,164,71,0.05)] transition-all active:scale-[0.98]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-inner"
                style={{ background: `radial-gradient(135deg, ${config.them.avatarColor}cc, ${config.them.avatarColor}66)` }}
              >
                {config.them.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-base font-medium text-[var(--color-text-primary)]">{config.them.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Enter PIN to access</p>
              </div>
            </button>
          </div>

          <p className="mt-8 text-[11px] text-[var(--color-text-muted)] tracking-wide">
            Just the two of ours.
          </p>
        </div>
      </div>
    );
  }

  const name = selectedUser === "me" ? config.me.name : config.them.name;
  const avatarColor = selectedUser === "me" ? config.me.avatarColor : config.them.avatarColor;

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] p-6">
      <header className="pt-4">
        <button onClick={() => setSelectedUser(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--color-text-secondary)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        
        {/* User Badge */}
        <div className="flex flex-col items-center space-y-4 mb-10">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            style={{ background: `radial-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)` }}
          >
            {name[0]?.toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-medium text-[var(--color-text-primary)]">Welcome, {name}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {lockoutUntil && Date.now() < lockoutUntil ? (
                <span className="text-[var(--color-destructive)]">Too many attempts. Try again in 1 minute.</span>
              ) : error ? (
                <span className="text-[var(--color-destructive)]">Incorrect PIN. Try again.</span>
              ) : (
                "Enter your 4-digit PIN"
              )}
            </p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className={cn("flex gap-4 mb-12", error && "animate-shake")}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-4 w-4 rounded-full border transition-all duration-200",
                pin.length > i 
                  ? "bg-[var(--color-accent)] border-[var(--color-accent)] shadow-[0_0_12px_rgba(212,164,71,0.5)]" 
                  : "bg-transparent border-[rgba(255,255,255,0.15)]"
              )}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-6 gap-x-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypad(num.toString())}
              disabled={isVerifying}
              className="flex h-[72px] w-full items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-2xl font-light text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handleKeypad("0")}
            disabled={isVerifying}
            className="flex h-[72px] w-full items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-2xl font-light text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="flex h-[72px] w-full items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] active:scale-95 transition-all disabled:opacity-30"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        {isVerifying && (
          <div className="mt-8 flex items-center justify-center text-[var(--color-accent)] animate-pulse">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

      </div>
    </div>
  );
}
