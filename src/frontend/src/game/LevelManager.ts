// ============================================================
// Level Manager — Infinite scaling level configurations
// ============================================================

import type { BgTheme, Difficulty, LevelConfig } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const difficultyMultipliers: Record<
  Difficulty,
  { speedMult: number; aggression: number }
> = {
  easy: { speedMult: 0.8, aggression: 0.6 },
  hard: { speedMult: 1.2, aggression: 1.1 },
  extreme: { speedMult: 1.5, aggression: 1.4 },
};

export function getBgTheme(level: number): BgTheme {
  if (level <= 5) return "dawn";
  if (level <= 15) return "shadow";
  if (level <= 30) return "horror";
  return "extreme";
}

export function getLevelLabel(level: number): string {
  if (level <= 5) return "⚔️ HARDCORE START";
  if (level <= 10) return "🔥 SPEED ZONE";
  if (level <= 20) return "🧠 MIND BREAKER";
  if (level <= 30) return "⚡ INSANE REACTION";
  if (level <= 40) return "💥 CHAOS MODE";
  if (level <= 50) return "💀 ULTIMATE DEATH ZONE";
  return "👹 BEYOND DEATH";
}

export function getLevelConfig(
  level: number,
  difficulty: Difficulty = "easy",
): LevelConfig {
  const l = Math.max(1, level);
  const diff = difficultyMultipliers[difficulty];

  // Scale parameters
  const rotationSpeedMult = clamp(0.8 + l * 0.06, 0.8, 10.0);
  const gateSpeedMult = clamp(0.8 + l * 0.05, 0.8, 8.0);
  const baseSeekerSpeed = clamp(0.7 + l * 0.05, 0.7, 5.0);
  const seekerSpeedMult = clamp(baseSeekerSpeed * diff.speedMult, 0.5, 7.0);
  const fogRadius = l > 7 ? clamp(300 - l * 4, 80, 300) : null;

  // Feature thresholds scale with difficulty
  const featureScale =
    difficulty === "easy" ? 1.4 : difficulty === "hard" ? 1.1 : 0.9;

  const hasFakeWalls = l > Math.floor(8 * featureScale);
  const hasMovingFireZones = l > Math.floor(9 * featureScale);
  const seekerTrapResistant = l > Math.floor(9 * featureScale);
  const multiScan = l > Math.floor(10 * featureScale);
  const hasGravityShift = l > Math.floor(35 * featureScale);
  const hasTeleportPortals = l > Math.floor(31 * featureScale);
  const reverseControlsRandom = l > Math.floor(32 * featureScale);
  const timeFreezeZones = l > Math.floor(21 * featureScale);
  const pathCollapseEnabled = l > Math.floor(12 * featureScale);
  const trapExplosionEnabled = l > Math.floor(22 * featureScale);
  const rotationDirectionRandom = l > Math.floor(11 * featureScale);
  const shrinkingMaze = l > Math.floor(42 * featureScale);
  const blackoutInterval =
    l > Math.floor(41 * featureScale) ? clamp(20 - l * 0.3, 4, 18) : null;
  const mazeShiftInterval =
    l > Math.floor(33 * featureScale) ? clamp(12 - l * 0.1, 2, 10) : null;

  const multipleSeekersCount =
    l > Math.floor(36 * featureScale)
      ? 3
      : l > Math.floor(31 * featureScale)
        ? 2
        : 1;

  // Time limit (reduces with level)
  const timeLimit = clamp(90 - l * 0.8, 10, 90);

  // Level names by range
  const name = getLevelName(l);
  const description = getLevelDescription(l, difficulty);

  return {
    id: l,
    name,
    description,
    rotationSpeedMult,
    gateSpeedMult,
    seekerSpeedMult,
    fogRadius,
    hasFakeWalls,
    hasMovingFireZones,
    seekerTrapResistant,
    multiScan,
    timeLimit,
    hasGravityShift,
    hasTeleportPortals,
    reverseControlsRandom,
    multipleSeekersCount,
    mazeShiftInterval,
    blackoutInterval,
    shrinkingMaze,
    timeFreezeZones,
    rotationDirectionRandom,
    pathCollapseEnabled,
    trapExplosionEnabled,
    bgTheme: getBgTheme(l),
  };
}

function getLevelName(l: number): string {
  const names: Record<number, string> = {
    1: "Chakravyuh Entry",
    2: "Rising Spiral",
    3: "Warrior's Trial",
    4: "Chakra Storm",
    5: "Fierce Vortex",
    6: "Speed Chaos",
    7: "Dark Trap",
    8: "Mirror Maze",
    9: "Fire Zone",
    10: "Ultimate Chakravyuh",
    11: "Illusion Gate",
    12: "Collapsing Paths",
    13: "Vanishing Act",
    14: "Spinning Fire",
    15: "Blind Illusion",
    16: "Multi-Scan Hunt",
    17: "Smoke & Mirrors",
    18: "Chaos Reversal",
    19: "Blind Pursuit",
    20: "Mind Breaker",
    21: "Freeze Panic",
    22: "Explosive Fire",
    23: "Hyper Spin",
    24: "Frozen Bombs",
    25: "Velocity Gate",
    26: "Inferno Scan",
    27: "Phantom Ice",
    28: "Collapse Bomb",
    29: "Blind Inferno",
    30: "Insane Reaction",
    31: "Twin Seekers",
    32: "Reverse Hunt",
    33: "Shifting Maze",
    34: "Double Chaos",
    35: "Gravity Warp",
    36: "Triple Threat",
    37: "Flip Fire",
    38: "Gravity Bomb",
    39: "Triple Fog",
    40: "Chaos Mode",
    41: "Blackout Strike",
    42: "Shrinking World",
    43: "Dark Reversal",
    44: "Death Shrink",
    45: "Triple Blackout",
    46: "Nightmare Protocol",
    47: "Eclipse Mode",
    48: "Void Maze",
    49: "Armageddon",
    50: "ULTIMATE DEATH",
  };
  if (names[l]) return names[l];
  // Infinite levels beyond 50
  const tier = Math.floor((l - 51) / 10);
  const tiers = [
    "BEYOND DEATH",
    "HELL MODE",
    "GOD SLAYER",
    "INFINITE CHAOS",
    "OMEGA VOID",
  ];
  return `${tiers[tier % tiers.length]} L${l}`;
}

function getLevelDescription(l: number, difficulty: Difficulty): string {
  const diffLabel =
    difficulty === "extreme"
      ? "EXTREME AI hunts you."
      : difficulty === "hard"
        ? "HARD AI predicts you."
        : "";
  if (l <= 5) return `Learn the rotating rings. Survive. ${diffLabel}`.trim();
  if (l <= 10) return `Speed and traps increase. ${diffLabel}`.trim();
  if (l <= 20) return `Fake walls, fog, mind games. ${diffLabel}`.trim();
  if (l <= 30)
    return `Max speed, explosions, freeze zones. ${diffLabel}`.trim();
  if (l <= 40)
    return `Multiple seekers, portals, gravity shifts. ${diffLabel}`.trim();
  if (l <= 50) return `All mechanics combined. No mercy. ${diffLabel}`.trim();
  return `Level ${l} — Beyond all limits. ${diffLabel}`.trim();
}
