export type LeaderboardEntry = {
  playerName: string;
  score: number;
  mode: string; // "Solo" | "Duo A" | "Duo B"
  levelId: number;
  won: boolean;
  date: string; // ISO date string
};

const STORAGE_KEY = "maze_leaderboard";
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveScore(entry: LeaderboardEntry): void {
  try {
    const current = getLeaderboard();
    const updated = [...current, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function getModeLabel(mode: string): string {
  switch (mode) {
    case "solo":
      return "Solo";
    case "duo1v1":
      return "Duo A";
    case "duo2v1":
      return "Duo B";
    default:
      return mode;
  }
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return isoDate;
  }
}
