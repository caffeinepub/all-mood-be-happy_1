import { Mood } from "../backend";

export interface MoodConfig {
  key: Mood;
  label: string;
  emoji: string;
  chipClass: string;
  solutionCardClass: string;
  color: string;
  solutions: {
    title: string;
    icon: string;
    tips: string[];
  };
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    key: Mood.happy,
    label: "Happy",
    emoji: "😊",
    chipClass: "mood-chip-happy",
    solutionCardClass: "solution-card-happy",
    color: "#F6D56A",
    solutions: {
      title: "Spread the Joy! 🌻",
      icon: "🌻",
      tips: [
        "Share your happiness with someone you love",
        "Call a friend and brighten their day",
        "Do a random act of kindness today",
        "Journal about what made you happy",
      ],
    },
  },
  {
    key: Mood.sad,
    label: "Sad",
    emoji: "😢",
    chipClass: "mood-chip-sad",
    solutionCardClass: "solution-card-sad",
    color: "#8FC9FF",
    solutions: {
      title: "It's Okay to Cry 💙",
      icon: "💙",
      tips: [
        "Listen to soft, comforting music",
        "Write your feelings in a journal",
        "Watch a comforting movie or show",
        "Reach out to someone you trust",
      ],
    },
  },
  {
    key: Mood.stress,
    label: "Stress",
    emoji: "😤",
    chipClass: "mood-chip-stress",
    solutionCardClass: "solution-card-stress",
    color: "#C6A7FF",
    solutions: {
      title: "Breathe Deeply 🌿",
      icon: "🌿",
      tips: [
        "Try the 4-7-8 breathing technique",
        "Take a short walk outside",
        "Step away from screens for 10 minutes",
        "Drink a glass of cold water slowly",
      ],
    },
  },
  {
    key: Mood.love,
    label: "Love",
    emoji: "🥰",
    chipClass: "mood-chip-love",
    solutionCardClass: "solution-card-love",
    color: "#F7A3C8",
    solutions: {
      title: "Cherish It 🌸",
      icon: "🌸",
      tips: [
        "Express your feelings openly",
        "Write a heartfelt message to someone",
        "Spend quality time with loved ones",
        "Show appreciation in small gestures",
      ],
    },
  },
  {
    key: Mood.angry,
    label: "Angry",
    emoji: "😠",
    chipClass: "mood-chip-angry",
    solutionCardClass: "solution-card-angry",
    color: "#F46D63",
    solutions: {
      title: "Cool Down 🧊",
      icon: "🧊",
      tips: [
        "Count slowly to 10 before responding",
        "Go for a run or do jumping jacks",
        "Write out your feelings on paper",
        "Avoid confrontation when emotions are high",
      ],
    },
  },
  {
    key: Mood.anxious,
    label: "Anxious",
    emoji: "😰",
    chipClass: "mood-chip-anxious",
    solutionCardClass: "solution-card-anxious",
    color: "#F5B36B",
    solutions: {
      title: "Ground Yourself 🌊",
      icon: "🌊",
      tips: [
        "Try the 5-4-3-2-1 grounding technique",
        "Call a trusted friend or family member",
        "Limit news and social media today",
        "Focus only on what you can control",
      ],
    },
  },
  {
    key: Mood.hopeful,
    label: "Hopeful",
    emoji: "🌟",
    chipClass: "mood-chip-hopeful",
    solutionCardClass: "solution-card-hopeful",
    color: "#A7DEA4",
    solutions: {
      title: "Keep Going ⭐",
      icon: "⭐",
      tips: [
        "Set one small, achievable goal today",
        "Celebrate tiny wins along the way",
        "Surround yourself with positive people",
        "Visualize your best possible future",
      ],
    },
  },
];

export function getMoodConfig(mood: Mood): MoodConfig {
  return MOOD_CONFIGS.find((m) => m.key === mood) ?? MOOD_CONFIGS[0];
}

export function formatRelativeTime(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const now = Date.now();
  const diff = now - ms;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 8)}...`;
}

export const AVATAR_EMOJIS = [
  "🌸",
  "🌺",
  "🌼",
  "🌻",
  "🌈",
  "⭐",
  "🦋",
  "🌙",
  "☀️",
  "🍀",
  "🌿",
  "💫",
];

export function getAvatarEmoji(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % AVATAR_EMOJIS.length;
  }
  return AVATAR_EMOJIS[hash];
}
