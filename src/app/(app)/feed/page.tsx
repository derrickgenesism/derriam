import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Mic, Type, Plus } from "lucide-react";

const MOCK_FEED = [
  {
    id: "1",
    author: "them",
    text: "Finally found that coffee shop you always talk about ☕",
    time: "17 min ago",
    hasPhoto: true,
  },
  {
    id: "2",
    author: "you",
    text: "Made your mum's recipe tonight. Turned out alright actually.",
    time: "2 hrs ago",
    hasPhoto: false,
  },
  {
    id: "3",
    author: "them",
    text: "The sunset here was unreal today. Wish you could've seen it.",
    time: "Yesterday",
    hasPhoto: true,
  },
  {
    id: "4",
    author: "you",
    text: "Can't sleep. Thinking about our next trip.",
    time: "Yesterday",
    hasPhoto: false,
  },
];

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-lg pt-6 space-y-6">

      {/* Header */}
      <div className="px-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Life Feed</h1>
          <p className="text-xs text-[var(--color-text-muted)]">Your shared daily moments</p>
        </div>
        <Button size="icon" variant="secondary" className="rounded-xl">
          <Plus size={18} strokeWidth={2} />
        </Button>
      </div>

      {/* Post type row */}
      <div className="px-5 flex gap-2">
        {[
          { icon: Type, label: "Text" },
          { icon: ImageIcon, label: "Photo" },
          { icon: Mic, label: "Voice" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-95"
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <div className="px-5 space-y-3">
        {MOCK_FEED.map((post) => (
          <Card key={post.id} variant="default">
            <CardContent className="flex gap-3 py-4">
              {post.hasPhoto && (
                <div className="h-16 w-16 shrink-0 rounded-xl bg-[var(--color-surface-overlay)] flex items-center justify-center">
                  <ImageIcon size={18} className="text-[var(--color-text-muted)]" strokeWidth={1.5} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                  {post.author === "you" ? "you" : "them"}
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
                  {post.text}
                </p>
                <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                  {post.time}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
