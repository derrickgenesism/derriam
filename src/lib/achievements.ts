export interface Achievement {
  id: string;
  title: string;
  description: string;
  symbol: string; // geometric symbol or emoji
  earned: boolean;
  earnedDate?: string;
  category: "connection" | "prompts" | "games" | "milestones";
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Connection
  { id: "first_pair",   title: "Connected",       symbol: "◈", category: "connection", earned: true,  earnedDate: "Mar 2025", description: "Paired with your partner" },
  { id: "first_nudge",  title: "First Spark",     symbol: "✦", category: "connection", earned: true,  earnedDate: "Mar 2025", description: "Sent your first nudge" },
  { id: "ten_nudges",   title: "Always There",    symbol: "✦", category: "connection", earned: false, description: "Send 10 nudges" },
  // Prompts
  { id: "first_prompt", title: "First Words",     symbol: "◎", category: "prompts",    earned: true,  earnedDate: "Mar 2025", description: "Answered your first prompt together" },
  { id: "ten_prompts",  title: "Story Builders",  symbol: "◎", category: "prompts",    earned: true,  earnedDate: "Apr 2025", description: "Answered 10 prompts together" },
  { id: "fifty_prompts",title: "Deep Roots",      symbol: "◎", category: "prompts",    earned: false, description: "Answer 50 prompts together" },
  { id: "deep_five",    title: "Deep Divers",     symbol: "○", category: "prompts",    earned: false, description: "Answer 5 Deep prompts" },
  // Games
  { id: "first_game",   title: "Game On",         symbol: "◌", category: "games",      earned: false, description: "Play your first game together" },
  { id: "wyr_ten",      title: "Decisive",        symbol: "⚡", category: "games",      earned: false, description: "Play 10 Would You Rather rounds" },
  // Milestones
  { id: "days_30",      title: "One Month",       symbol: "★", category: "milestones", earned: true,  earnedDate: "Apr 2025", description: "30 days on Derriam together" },
  { id: "days_100",     title: "Hundred Days",    symbol: "★", category: "milestones", earned: false, description: "100 days on Derriam together" },
  { id: "reunion_set",  title: "The Countdown",   symbol: "★", category: "milestones", earned: true,  earnedDate: "Mar 2025", description: "Set a reunion date" },
];
