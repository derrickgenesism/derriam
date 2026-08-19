// ─── Prompt types ──────────────────────────────────────────────────────────────

export type PromptCategory =
  | "daily"
  | "would-you-rather"
  | "deep"
  | "unhinged"
  | "debate"
  | "brain-teaser"
  | "custom";

export interface Prompt {
  id: string;
  question: string;
  category: PromptCategory;
  optionA?: string; // for would-you-rather
  optionB?: string;
  tags?: string[];
  createdBy: "system" | "couple";
  isActive: boolean;
}

// ─── Category metadata ─────────────────────────────────────────────────────────

export const CATEGORY_META: Record<
  PromptCategory,
  { label: string; emoji: string; description: string }
> = {
  daily:             { label: "Daily",            emoji: "✦",  description: "Today's featured question" },
  "would-you-rather":{ label: "Would You Rather", emoji: "⚡", description: "Pick a side" },
  deep:              { label: "Deep",             emoji: "◎",  description: "Real conversations" },
  unhinged:          { label: "Unhinged",         emoji: "◈",  description: "Chaos, no rules" },
  debate:            { label: "Debate",           emoji: "◌",  description: "Hot takes only" },
  "brain-teaser":    { label: "Brain Teaser",     emoji: "🧩",  description: "Who's smarter?" },
  custom:            { label: "Yours",            emoji: "★",  description: "Created by you two" },
};

// ─── Seed prompt bank ──────────────────────────────────────────────────────────

export const SEED_PROMPTS: Prompt[] = [
  // Daily
  {
    id: "d1", category: "daily", createdBy: "system", isActive: true,
    question: "What's one small thing that made you smile today?",
  },
  {
    id: "d2", category: "daily", createdBy: "system", isActive: true,
    question: "If I could send you anything right now, what would you want it to be?",
  },
  {
    id: "d3", category: "daily", createdBy: "system", isActive: true,
    question: "What's one thing you're looking forward to this week?",
  },
  {
    id: "d4", category: "daily", createdBy: "system", isActive: true,
    question: "Describe where you are right now in three words.",
  },
  {
    id: "d5", category: "daily", createdBy: "system", isActive: true,
    question: "What song has been stuck in your head lately?",
  },

  // Would You Rather
  {
    id: "w1", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Never text again, but always able to call",
    optionB: "Never call again, but always able to text",
  },
  {
    id: "w2", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Have a surprise visit from your partner tomorrow",
    optionB: "Plan a dream trip together in 3 months",
  },
  {
    id: "w3", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Read your partner's mind for one day",
    optionB: "Have them read yours",
  },
  {
    id: "w4", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Miss your partner less but also love them less",
    optionB: "Miss them more but love them even more",
  },
  {
    id: "w5", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Your partner moves to your city",
    optionB: "You move to theirs",
  },
  {
    id: "w6", category: "would-you-rather", createdBy: "system", isActive: true,
    question: "Would you rather…",
    optionA: "Never fight but also never have deep conversations",
    optionB: "Fight sometimes but always fully resolve it",
  },

  // Deep
  {
    id: "dp1", category: "deep", createdBy: "system", isActive: true,
    question: "What's something you've wanted to tell me but never found the right moment?",
  },
  {
    id: "dp2", category: "deep", createdBy: "system", isActive: true,
    question: "What does home feel like to you? And am I part of that?",
  },
  {
    id: "dp3", category: "deep", createdBy: "system", isActive: true,
    question: "What's one thing about the distance that's actually made us stronger?",
  },
  {
    id: "dp4", category: "deep", createdBy: "system", isActive: true,
    question: "When do you feel closest to me even when we're apart?",
  },
  {
    id: "dp5", category: "deep", createdBy: "system", isActive: true,
    question: "What's one version of our future you think about most?",
  },
  {
    id: "dp6", category: "deep", createdBy: "system", isActive: true,
    question: "What's something you've learned about yourself from being in this relationship?",
  },

  // Unhinged
  {
    id: "u1", category: "unhinged", createdBy: "system", isActive: true,
    question: "If our relationship was a reality TV show, what would it be called?",
  },
  {
    id: "u2", category: "unhinged", createdBy: "system", isActive: true,
    question: "What animal are you when you're hungry and what am I?",
  },
  {
    id: "u3", category: "unhinged", createdBy: "system", isActive: true,
    question: "Describe our first conversation as if you were writing a Wikipedia article.",
  },
  {
    id: "u4", category: "unhinged", createdBy: "system", isActive: true,
    question: "If we were a pair of items that belong together, what would we be?",
  },
  {
    id: "u5", category: "unhinged", createdBy: "system", isActive: true,
    question: "What's the most unhinged thing you've done because of feelings for me?",
  },

  // Debate
  {
    id: "db1", category: "debate", createdBy: "system", isActive: true,
    question: "Is it better to be the one who leaves or the one who stays behind?",
  },
  {
    id: "db2", category: "debate", createdBy: "system", isActive: true,
    question: "Long-distance makes love stronger. Agree or disagree?",
  },
  {
    id: "db3", category: "debate", createdBy: "system", isActive: true,
    question: "Video calls are better than voice calls. Make your case.",
  },
  {
    id: "db4", category: "debate", createdBy: "system", isActive: true,
    question: "Surprises are better than planned visits. Defend your position.",
  },
  {
    id: "db5", category: "debate", createdBy: "system", isActive: true,
    question: "Morning texts mean more than goodnight texts. Who's right?",
  },
];

export const NHIE_PROMPTS = [
  "Never have I ever fallen asleep on a video call with my partner.",
  "Never have I ever cried after hanging up a call.",
  "Never have I ever watched something we planned to watch together — without them.",
  "Never have I ever stalked their social media at 2am just to feel close.",
  "Never have I ever sent a voice note instead of calling because I was too nervous.",
  "Never have I ever written a message I never sent.",
  "Never have I ever googled their city's weather just to feel closer.",
  "Never have I ever saved a message to read again later on a bad day.",
  "Never have I ever rehearsed what to say before a call.",
  "Never have I ever smiled at my phone in public because of a text from them.",
];
