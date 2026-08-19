"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Download, ChevronRight, LogOut, MapPin, Edit3, X, Check } from "lucide-react";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { distanceBetweenTimezones, formatDistance, CITY_COORDS } from "@/lib/distance";
import { cn } from "@/lib/utils";
import { useAppConfig } from "@/lib/store";

const SETTINGS = [
  { icon: Bell,     label: "Notifications",  sub: "Quiet hours · alert preferences" },
  { icon: Shield,   label: "Privacy",        sub: "Who sees what, data controls" },
  { icon: Download, label: "Export my data", sub: "Download everything you've shared" },
];

const ACHIEVEMENT_CATEGORIES = ["connection", "prompts", "games", "milestones"] as const;

export default function ProfilePage() {
  const { config, currentUser, setCurrentUser, logout, updateMe, updateThem, updateConfig } = useAppConfig();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editMe, setEditMe] = useState(config.me.name);
  const [editMePin, setEditMePin] = useState(config.me.pin);
  const [editMeCity, setEditMeCity] = useState(config.me.city);
  const [editMeCountry, setEditMeCountry] = useState(config.me.country);
  
  const [editThem, setEditThem] = useState(config.them.name);
  const [editThemPin, setEditThemPin] = useState(config.them.pin);
  const [editThemCity, setEditThemCity] = useState(config.them.city);
  const [editThemCountry, setEditThemCountry] = useState(config.them.country);

  const [editStartDate, setEditStartDate] = useState(config.startDate || "");
  const [editDistance, setEditDistance] = useState(config.customDistance || "");
  const [editReunionDate, setEditReunionDate] = useState(config.nextReunionDate || "");
  const [editReunionLocation, setEditReunionLocation] = useState(config.nextReunionLocation || "");
  const [editCallTitle, setEditCallTitle] = useState(config.nextCallTitle || "");
  const [editCallTimeMe, setEditCallTimeMe] = useState(config.nextCallTimeMe || "");
  const [editCallTimeThem, setEditCallTimeThem] = useState(config.nextCallTimeThem || "");

  const earned = ALL_ACHIEVEMENTS.filter((a) => a.earned);

  const handleSave = () => {
    updateMe({ 
      name: editMe.trim() || config.me.name, 
      pin: editMePin.trim() || "0000",
      city: editMeCity.trim() || config.me.city,
      country: editMeCountry.trim() || config.me.country
    });
    updateThem({ 
      name: editThem.trim() || config.them.name, 
      pin: editThemPin.trim() || "0000",
      city: editThemCity.trim() || config.them.city,
      country: editThemCountry.trim() || config.them.country
    });
    updateConfig({ 
      startDate: editStartDate.trim() || config.startDate,
      customDistance: editDistance.trim() || config.customDistance,
      nextReunionDate: editReunionDate.trim() || config.nextReunionDate,
      nextReunionLocation: editReunionLocation.trim() || config.nextReunionLocation,
      nextCallTitle: editCallTitle.trim() || config.nextCallTitle,
      nextCallTimeMe: editCallTimeMe.trim() || config.nextCallTimeMe,
      nextCallTimeThem: editCallTimeThem.trim() || config.nextCallTimeThem
    });
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-lg pt-6 pb-4 space-y-8">

      {/* ── Couple identity ───────────────────────────────────────────────── */}
      <section className="px-5">
        {/* Intertwined avatars */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center">
            {/* My avatar */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.10)] text-2xl font-bold text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{ background: `radial-gradient(135deg, ${config.me.avatarColor}cc, ${config.me.avatarColor}66)` }}
            >
              {config.me.name[0]?.toUpperCase()}
            </div>
            {/* Overlap ring */}
            <div className="relative -mx-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.08)] bg-[#080808]">
              <span className="text-[10px] text-[var(--color-accent)]">✦</span>
            </div>
            {/* Partner avatar */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.10)] text-2xl font-bold text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{ background: `radial-gradient(135deg, ${config.them.avatarColor}cc, ${config.them.avatarColor}66)` }}
            >
              {config.them.name[0]?.toUpperCase()}
            </div>
          </div>

          {/* Couple name + edit */}
          <div className="text-center w-full max-w-xs">
            {isEditing ? (
              <div className="space-y-3 animate-fade-in bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-4 rounded-2xl">
                {/* Your Settings */}
                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Your Name</label>
                    <input 
                      value={editMe} onChange={e => setEditMe(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Your City</label>
                      <input 
                        value={editMeCity} onChange={e => setEditMeCity(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Your Country</label>
                      <input 
                        value={editMeCountry} onChange={e => setEditMeCountry(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Your PIN</label>
                    <input 
                      type="text" maxLength={4}
                      value={editMePin} onChange={e => setEditMePin(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none font-mono"
                    />
                  </div>
                </div>
                
                <hr className="border-[rgba(255,255,255,0.08)] my-4" />

                {/* Their Settings */}
                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Their Name</label>
                    <input 
                      value={editThem} onChange={e => setEditThem(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Their City</label>
                      <input 
                        value={editThemCity} onChange={e => setEditThemCity(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Their Country</label>
                      <input 
                        value={editThemCountry} onChange={e => setEditThemCountry(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Their PIN</label>
                    <input 
                      type="text" maxLength={4}
                      value={editThemPin} onChange={e => setEditThemPin(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none font-mono"
                    />
                  </div>
                </div>

                <hr className="border-[rgba(255,255,255,0.08)] my-4" />
                
                {/* Global Info */}
                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Been together since</label>
                    <input 
                      type="text" 
                      value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                      placeholder="e.g. March 14, 2024"
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Custom Distance Text</label>
                    <input 
                      type="text" 
                      value={editDistance} onChange={e => setEditDistance(e.target.value)}
                      placeholder="e.g. 3,132 km"
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                    />
                  </div>
                </div>

                <hr className="border-[rgba(255,255,255,0.08)] my-4" />
                
                {/* Up Next Info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Next Reunion Date</label>
                      <input 
                        type="date" 
                        value={editReunionDate} onChange={e => setEditReunionDate(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Next Reunion City</label>
                      <input 
                        type="text" 
                        value={editReunionLocation} onChange={e => setEditReunionLocation(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Next Call Title</label>
                    <input 
                      type="text" 
                      value={editCallTitle} onChange={e => setEditCallTitle(e.target.value)}
                      placeholder="e.g. Friday night call"
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Call Time (You)</label>
                      <input 
                        type="text" 
                        value={editCallTimeMe} onChange={e => setEditCallTimeMe(e.target.value)}
                        placeholder="e.g. 11:00 PM EST"
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-bold tracking-wider">Call Time (Them)</label>
                      <input 
                        type="text" 
                        value={editCallTimeThem} onChange={e => setEditCallTimeThem(e.target.value)}
                        placeholder="e.g. 9:00 PM GMT"
                        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8"><X size={14} /></Button>
                  <Button size="sm" onClick={handleSave} className="h-8"><Check size={14} /></Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{config.me.name} & {config.them.name}</h1>
                  <button onClick={() => setIsEditing(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                    <Edit3 size={14} strokeWidth={1.75} />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Together since {config.startDate}</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Achievements ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="px-5 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Achievements
          </h2>
          <span className="text-xs text-[var(--color-accent)] font-medium">
            {earned.length} of {ALL_ACHIEVEMENTS.length} earned
          </span>
        </div>

        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const items = ALL_ACHIEVEMENTS.filter((a) => a.category === cat);
          return (
            <div key={cat} className="px-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 capitalize">
                {cat}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {items.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "shrink-0 w-28 rounded-2xl border p-3 text-center space-y-1.5 transition-all",
                      a.earned
                        ? "border-[rgba(212,164,71,0.25)] bg-[rgba(212,164,71,0.08)]"
                        : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] opacity-50"
                    )}
                  >
                    <span className={cn("block text-xl", a.earned ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]")}>
                      {a.symbol}
                    </span>
                    <p className={cn("text-[11px] font-semibold leading-tight", a.earned ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")}>
                      {a.title}
                    </p>
                    {a.earned && a.earnedDate && (
                      <p className="text-[9px] text-[var(--color-text-muted)]">{a.earnedDate}</p>
                    )}
                    {!a.earned && (
                      <p className="text-[9px] text-[var(--color-text-muted)] leading-tight">{a.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <section className="px-5 space-y-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
          Settings
        </h2>
        
        {/* Device Identity is locked to the logged-in user (auth PIN) */}


        {SETTINGS.map(({ icon: Icon, label, sub }) => (
          <Card key={label} variant="default">
            <CardContent className="py-0">
              <button className="flex w-full items-center gap-4 py-4 text-left active:opacity-70">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]">
                  <Icon size={15} className="text-[var(--color-text-secondary)]" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>
                </div>
                <ChevronRight size={15} className="text-[var(--color-text-muted)]" strokeWidth={1.5} />
              </button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── Distance apart ────────────────────────────────────────────────── */}
      {config.customDistance && (
        <section className="px-5">
          <Card variant="ghost" className="border border-dashed border-[rgba(255,255,255,0.08)]">
            <CardContent className="py-5 text-center space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Distance apart right now
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                {config.customDistance}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1.5 mt-1">
                <MapPin size={10} strokeWidth={2} />
                {config.me.city}, {config.me.country} → {config.them.city}, {config.them.country}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Sign out ─────────────────────────────────────────────────────── */}
      <div className="px-5 pb-2">
        <Button variant="ghost" onClick={logout} className="w-full text-[var(--color-destructive)] hover:text-[var(--color-destructive)]">
          <LogOut size={15} strokeWidth={1.75} />
          Sign out
        </Button>
      </div>

    </div>
  );
}
