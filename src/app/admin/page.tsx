"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type Prompt, type PromptCategory } from "@/lib/prompts";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppConfig } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

const ALL_CATS: PromptCategory[] = ["daily","would-you-rather","deep","unhinged","debate","custom"];

export default function AdminPage() {
  const supabase = createClient();
  const { config, updateConfig } = useAppConfig();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filter, setFilter]   = useState<PromptCategory | "all">("all");
  const [search, setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // App Config form state
  const [appName, setAppName] = useState(config.appName);
  const [meName, setMeName] = useState(config.me.name);
  const [meCity, setMeCity] = useState(config.me.city);
  const [meCountry, setMeCountry] = useState(config.me.country);
  const [mePin, setMePin] = useState(config.me.pin);
  
  const [themName, setThemName] = useState(config.them.name);
  const [themCity, setThemCity] = useState(config.them.city);
  const [themCountry, setThemCountry] = useState(config.them.country);
  const [themPin, setThemPin] = useState(config.them.pin);
  
  const [customDistance, setCustomDistance] = useState(config.customDistance || "3,132 km");
  const [startDate, setStartDate] = useState(config.startDate || "March 14, 2024");

  // Form state
  const [form, setForm] = useState({
    question: "", category: "daily" as PromptCategory,
    optionA: "", optionB: "",
  });

  // Fetch prompts on mount
  useEffect(() => {
    async function fetchPrompts() {
      const { data, error } = await supabase.from('prompts').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        setPrompts(data.map(p => ({
          id: p.id,
          category: p.category as PromptCategory,
          question: p.question,
          optionA: p.option_a,
          optionB: p.option_b,
          isActive: p.is_active,
          createdBy: "system"
        })));
      }
      setIsLoading(false);
    }
    fetchPrompts();
  }, [supabase]);

  const filtered = prompts.filter((p) => {
    const matchCat = filter === "all" || p.category === filter;
    const matchSearch = p.question.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleActive = async (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    // Optimistic
    setPrompts((ps) => ps.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));
    
    // DB Update
    await supabase.from('prompts').update({ is_active: !prompt.isActive }).eq('id', id);
  };

  const deletePrompt = async (id: string) => {
    // Optimistic
    setPrompts((ps) => ps.filter((p) => p.id !== id));
    
    // DB Delete
    await supabase.from('prompts').delete().eq('id', id);
  };

  const addPrompt = async () => {
    if (!form.question.trim()) return;
    
    const dbPayload = {
      question: form.question,
      category: form.category,
      option_a: form.category === "would-you-rather" ? form.optionA : null,
      option_b: form.category === "would-you-rather" ? form.optionB : null,
      is_active: true
    };

    const { data, error } = await supabase.from('prompts').insert(dbPayload).select().single();
    
    if (data && !error) {
      const newPrompt: Prompt = {
        id: data.id,
        question: data.question,
        category: data.category as PromptCategory,
        optionA: data.option_a,
        optionB: data.option_b,
        createdBy: "system",
        isActive: data.is_active,
      };
      setPrompts((ps) => [newPrompt, ...ps]);
    }

    setForm({ question: "", category: "daily", optionA: "", optionB: "" });
    setShowForm(false);
  };

  const saveSettings = async () => {
    await updateConfig({
      appName: appName.trim() || "derriam",
      customDistance: customDistance.trim() || "0 km",
      startDate: startDate.trim() || "March 14, 2024",
      me: { ...config.me, name: meName.trim() || config.me.name, city: meCity.trim(), country: meCountry.trim(), pin: mePin.trim() || "0000" },
      them: { ...config.them, name: themName.trim() || config.them.name, city: themCity.trim(), country: themCountry.trim(), pin: themPin.trim() || "0000" }
    });
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Admin header */}
      <header className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-0.5">
            Derriam Admin
          </p>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Control Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={15} strokeWidth={2.5} className="mr-1" />
            App Setup
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} strokeWidth={2.5} className="mr-1" />
            Add prompt
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-5">

        {/* App Settings Modal */}
        {showSettings && (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-5 space-y-4 animate-fade-up">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Global App Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">App Name</label>
                <input value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Together Since</label>
                <input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" placeholder="e.g. March 14, 2024" />
              </div>
              
              {/* Partner 1 */}
              <div className="space-y-3 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Partner 1 (You)</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Name</label>
                  <input value={meName} onChange={(e) => setMeName(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">City</label>
                    <input value={meCity} onChange={(e) => setMeCity(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Country</label>
                    <input value={meCountry} onChange={(e) => setMeCountry(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Login PIN</label>
                  <input type="text" maxLength={4} value={mePin} onChange={(e) => setMePin(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none font-mono" />
                </div>
              </div>

              {/* Partner 2 */}
              <div className="space-y-3 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Partner 2 (Them)</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Name</label>
                  <input value={themName} onChange={(e) => setThemName(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">City</label>
                    <input value={themCity} onChange={(e) => setThemCity(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Country</label>
                    <input value={themCountry} onChange={(e) => setThemCountry(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Login PIN</label>
                  <input type="text" maxLength={4} value={themPin} onChange={(e) => setThemPin(e.target.value)} className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none font-mono" />
                </div>
              </div>
              
              {/* Distance Override */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Custom Distance Display</label>
                <input value={customDistance} onChange={(e) => setCustomDistance(e.target.value)} className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none max-w-[200px]" placeholder="e.g. 3,132 km" />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">This will show exactly as typed on your profile page.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)] mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button size="sm" onClick={saveSettings} className="mt-2">Save config</Button>
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-2xl border border-[rgba(212,164,71,0.20)] bg-[rgba(212,164,71,0.05)] p-5 space-y-4 animate-fade-up">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">New prompt</h2>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Category</label>
              <div className="flex gap-2 flex-wrap">
                {ALL_CATS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                      form.category === cat
                        ? "bg-[rgba(212,164,71,0.15)] border-[rgba(212,164,71,0.30)] text-[var(--color-accent)]"
                        : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)]"
                    )}
                  >
                    {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Question</label>
              <textarea
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder={form.category === "would-you-rather" ? "Would you rather… (leave as the header)" : "Write the prompt question…"}
                rows={2}
                className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
            </div>

            {/* WYR options */}
            {form.category === "would-you-rather" && (
              <div className="grid grid-cols-2 gap-3">
                {["A","B"].map((letter, i) => (
                  <div key={letter} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Option {letter}</label>
                    <input
                      value={i === 0 ? form.optionA : form.optionB}
                      onChange={(e) => setForm((f) => i === 0 ? { ...f, optionA: e.target.value } : { ...f, optionB: e.target.value })}
                      placeholder={`Option ${letter}…`}
                      className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={addPrompt} disabled={!form.question.trim()}>Save prompt</Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" strokeWidth={2} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-9 pr-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                filter === "all"
                  ? "bg-[rgba(212,164,71,0.15)] border-[rgba(212,164,71,0.30)] text-[var(--color-accent)]"
                  : "bg-transparent border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)]"
              )}
            >All</button>
            {ALL_CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                  filter === cat
                    ? "bg-[rgba(212,164,71,0.15)] border-[rgba(212,164,71,0.30)] text-[var(--color-accent)]"
                    : "bg-transparent border-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)]"
                )}
              >
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts table */}
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          {/* Table head */}
          <div className="grid grid-cols-[1fr_120px_80px_96px] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Question</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Category</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Actions</span>
          </div>

          {isLoading ? (
             <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
               Loading prompts from Supabase...
             </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
              No prompts found. Add one above!
            </div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "grid grid-cols-[1fr_120px_80px_96px] gap-4 items-center px-5 py-4",
                  "border-b border-[rgba(255,255,255,0.04)] last:border-0",
                  !p.isActive && "opacity-40"
                )}
              >
                {/* Question */}
                <div className="min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)] truncate">{p.question}</p>
                  {p.optionA && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                      A: {p.optionA} · B: {p.optionB}
                    </p>
                  )}
                </div>

                {/* Category */}
                <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                  {CATEGORY_META[p.category].emoji} {CATEGORY_META[p.category].label}
                </span>

                {/* Status toggle */}
                <button onClick={() => toggleActive(p.id)} className="flex items-center gap-1.5 transition-opacity">
                  {p.isActive
                    ? <ToggleRight size={20} className="text-[var(--color-accent)]" strokeWidth={1.75} />
                    : <ToggleLeft size={20} className="text-[var(--color-text-muted)]" strokeWidth={1.75} />
                  }
                  <span className={cn("text-[11px] font-medium", p.isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]")}>
                    {p.isActive ? "On" : "Off"}
                  </span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all">
                    <Pencil size={13} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => deletePrompt(p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] hover:bg-[rgba(180,60,60,0.10)] transition-all"
                  >
                    <Trash2 size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Showing {filtered.length} of {prompts.length} prompts
        </p>
      </div>
    </div>
  );
}
