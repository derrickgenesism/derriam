"use client";

import { cn } from "@/lib/utils";
import { Clock, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppConfig } from "@/lib/store";

function usePartnerTime(timezone: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

export function TopBar() {
  const { config, logout } = useAppConfig();
  const time = usePartnerTime(config.them.timezone);

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-4">
      {/* Wordmark */}
      <h1 className="font-serif text-[26px] font-normal tracking-[-0.01em] text-[var(--color-text-primary)]">
        {config.appName}
      </h1>

      <div className="flex items-center gap-2">
        {/* Partner time pill */}
        {time && (
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTopColor: "rgba(255,255,255,0.14)",
            }}
          >
            {/* Live amber dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75 animate-ping" style={{ animationDuration: "2.5s" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </span>
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {config.them.city} · {time}
            </span>
          </div>
        )}

        <button 
          onClick={logout}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-white transition-colors"
          title="Sign out / Lock app"
        >
          <Lock size={14} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
