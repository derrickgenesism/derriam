"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Video, Phone, MapPin, Plus, Clock, ChevronRight,
  Sparkles, Star, Plane, Coffee, X, Check
} from "lucide-react";
import { useAppConfig } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType = "call" | "video" | "visit" | "milestone" | "custom";

interface PlanEvent {
  id: string;
  type: EventType;
  title: string;
  event_date: string;
  note?: string;
}

// ─── Event type config ─────────────────────────────────────────────────────────
const EVENT_META: Record<EventType, { icon: typeof Video; color: string; label: string }> = {
  video:     { icon: Video,        color: "text-[var(--color-accent)]",    label: "Video call" },
  call:      { icon: Phone,        color: "text-[var(--color-text-secondary)]", label: "Voice call" },
  visit:     { icon: Plane,        color: "text-[var(--color-accent)]",    label: "Visit" },
  milestone: { icon: Star,         color: "text-[var(--color-accent)]",    label: "Milestone" },
  custom:    { icon: Coffee,       color: "text-[var(--color-text-secondary)]", label: "Event" },
};

function formatInTZ(dateStr: string, tz: string, opts?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts }).format(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ReunionHero({ event, myTZ, theirTZ }: { event: PlanEvent; myTZ: string; theirTZ: string }) {
  const targetDate = new Date(event.event_date);
  const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / 86_400_000));
  const progress = Math.max(0, Math.min(100, 100 - (daysLeft / 90) * 100));

  return (
    <Card className="overflow-hidden border-[var(--color-accent-muted)] mx-5">
      <div
        className="h-1 bg-[var(--color-accent-muted)]"
        style={{ background: `linear-gradient(to right, var(--color-accent) ${progress}%, var(--color-surface-raised) ${progress}%)` }}
      />
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">
              Next reunion
            </p>
            <h2 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              {daysLeft}{" "}
              <span className="text-lg font-normal text-[var(--color-text-secondary)]">days</span>
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{event.title}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)]">
            <Plane size={22} className="text-[var(--color-accent)]" strokeWidth={1.75} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-[var(--color-surface-raised)] px-3 py-2.5">
            <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">your date</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {formatInTZ(event.event_date, myTZ, { day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-[var(--color-surface-raised)] px-3 py-2.5">
            <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">their date</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {formatInTZ(event.event_date, theirTZ, { day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {event.note && <p className="text-xs text-[var(--color-text-muted)] italic">{event.note}</p>}
      </CardContent>
    </Card>
  );
}

function NextCallCard({ event, myTZ, theirTZ, onDelete }: { event: PlanEvent; myTZ: string; theirTZ: string, onDelete: (id: string) => void }) {
  const meta = EVENT_META[event.type] || EVENT_META.custom;
  const Icon = meta.icon;
  const hoursUntil = Math.max(0, Math.round((new Date(event.event_date).getTime() - Date.now()) / 3_600_000));
  const label = hoursUntil < 24 ? `in ${hoursUntil}h` : `in ${Math.ceil(hoursUntil / 24)}d`;

  return (
    <Card variant="raised" className="mx-5 relative group">
      <button onClick={() => onDelete(event.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface-raised)] p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-400">
        <X size={12} />
      </button>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-overlay)]">
              <Icon size={18} strokeWidth={1.75} className={meta.color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] pr-6">{event.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{meta.label}</p>
            </div>
          </div>
          <Badge variant="muted">{label}</Badge>
        </div>

        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <Clock size={11} strokeWidth={1.75} />
            <span>You: <span className="text-[var(--color-text-primary)] font-medium">
              {formatInTZ(event.event_date, myTZ, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
            </span></span>
          </div>
          <span className="text-[var(--color-border)]">·</span>
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
            <MapPin size={11} strokeWidth={1.75} />
            <span>Them: <span className="text-[var(--color-text-primary)] font-medium">
              {formatInTZ(event.event_date, theirTZ, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
            </span></span>
          </div>
        </div>

        {event.note && (
          <p className="text-xs text-[var(--color-text-muted)] border-l-2 border-[var(--color-accent-muted)] pl-3 italic">
            {event.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { config, currentUser } = useAppConfig();
  const myTZ = currentUser === "me" ? config.me.timezone : config.them.timezone;
  const theirTZ = currentUser === "me" ? config.them.timezone : config.me.timezone;
  const supabase = createClient();

  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [addTitle, setAddTitle] = useState("");
  const [addType, setAddType] = useState<EventType>("video");
  const [addDate, setAddDate] = useState("");
  const [addNote, setAddNote] = useState("");

  useEffect(() => {
    async function loadPlans() {
      const { data, error } = await supabase.from('plans').select('*').order('event_date', { ascending: true });
      if (data) {
        // Filter out very old events
        const now = new Date();
        now.setDate(now.getDate() - 2); // Keep events up to 2 days old
        setEvents(data.filter(e => new Date(e.event_date) >= now));
      }
    }
    loadPlans();

    const channel = supabase.channel('plans_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
        loadPlans();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleSave = async () => {
    if (!addTitle.trim() || !addDate) return;
    
    await supabase.from('plans').insert({
      title: addTitle.trim(),
      type: addType,
      event_date: new Date(addDate).toISOString(),
      note: addNote.trim() || null
    });
    
    setIsAdding(false);
    setAddTitle("");
    setAddDate("");
    setAddNote("");
  };

  const handleDelete = async (id: string) => {
    await supabase.from('plans').delete().eq('id', id);
  };

  const visit = events.find((e) => e.type === "visit");
  const upcoming = events.filter((e) => e.type !== "visit");

  return (
    <div className="mx-auto max-w-lg pt-6 space-y-7 pb-4">
      <div className="px-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Plans</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Calls, visits & moments</p>
        </div>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X size={15} /> : <Plus size={15} strokeWidth={2} />}
          {isAdding ? "Cancel" : "Add"}
        </Button>
      </div>

      {isAdding && (
        <Card variant="raised" className="mx-5 border-[var(--color-accent)] animate-fade-in">
          <CardContent className="py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-2">Schedule Plan</h3>
            <div className="space-y-2">
              <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Event Title (e.g. Friday Call)" className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none" />
              <div className="flex gap-2">
                <select value={addType} onChange={e => setAddType(e.target.value as EventType)} className="w-1/3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-2 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none">
                  <option value="video">Video</option>
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="custom">Custom</option>
                </select>
                <input type="datetime-local" value={addDate} onChange={e => setAddDate(e.target.value)} className="w-2/3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none" />
              </div>
              <input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="Note (optional)" className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] outline-none" />
              <Button className="w-full h-9 mt-1" onClick={handleSave} disabled={!addTitle || !addDate}>Save Plan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {visit && <ReunionHero event={visit} myTZ={myTZ} theirTZ={theirTZ} />}

      <section className="space-y-3">
        <h2 className="px-5 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Upcoming calls
        </h2>
        {upcoming.length === 0 ? (
          <div className="px-5">
            <button onClick={() => setIsAdding(true)} className="w-full rounded-2xl border border-dashed border-[var(--color-border)] py-5 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors active:scale-95">
              <Sparkles size={16} className="inline mr-2" strokeWidth={1.75} />
              Schedule your next call together
            </button>
          </div>
        ) : (
          upcoming.map((event) => (
            <NextCallCard key={event.id} event={event} myTZ={myTZ} theirTZ={theirTZ} onDelete={handleDelete} />
          ))
        )}
      </section>
    </div>
  );
}
