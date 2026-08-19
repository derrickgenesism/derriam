"use client";

import { cn } from "@/lib/utils";
import { Home, Flame, Gamepad2, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home",    icon: Home,         label: "Home" },
  { href: "/prompt",  icon: Flame,        label: "Prompts" },
  { href: "/games",   icon: Gamepad2,     label: "Games" },
  { href: "/plans",   icon: CalendarDays, label: "Plans" },
  { href: "/profile", icon: Users,        label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Glass nav bar with strong blur */}
      <div
        className="border-t border-[rgba(255,255,255,0.07)] px-1 pt-2 pb-3"
        style={{
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="mx-auto flex max-w-sm items-center justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5",
                  "transition-all duration-200 active:scale-90"
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={cn(
                    "transition-all duration-200",
                    active
                      ? "text-[var(--color-accent)] drop-shadow-[0_0_8px_rgba(212,164,71,0.6)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                />
                {/* Active dot */}
                <span
                  className={cn(
                    "h-[3px] w-[3px] rounded-full transition-all duration-300",
                    active
                      ? "bg-[var(--color-accent)] shadow-[0_0_6px_rgba(212,164,71,0.8)] scale-100"
                      : "scale-0 bg-transparent"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
