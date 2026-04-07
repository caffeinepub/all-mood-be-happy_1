import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { initBackground } from "../game/BackgroundEngine";
import { getLevelConfig } from "../game/LevelManager";
import {
  initAudio,
  playSoundEffect,
  resumeAudio,
  startGameMusic,
  startMenuMusic,
  stopAllMusic,
  stopHeartbeat,
} from "../game/audio";
import {
  createGameState,
  getCoinsEarned,
  initAI,
  renderFrame,
  renderMenuBackground,
  resetCamera,
  updateGame,
} from "../game/engine";
import { getModeLabel, saveScore } from "../game/leaderboard";
import type {
  Difficulty,
  GameMode,
  GamePhase,
  GameState,
  InputState,
  JoystickState,
  LevelConfig,
  ProgressState,
  UpgradeState,
} from "../game/types";
import LeaderboardModal from "./LeaderboardModal";

// ───────────────────────────────────────────────────────────────
// Constants & Config
// ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "maze-abhimanyu-progress";

const defaultUpgrades: UpgradeState = {
  invisDuration: 5,
  speedBoostUnlocked: false,
  speedBoostLevel: 1,
  dashUnlocked: false,
  trapImmunityUnlocked: false,
  trapImmunityDuration: 3,
  cooldownReduction: 0,
  hyperDashUnlocked: false,
  phaseWalkUnlocked: false,
  timeSlowUnlocked: false,
  energyShieldUnlocked: false,
  energyShieldCharges: 1,
  timeSlowDuration: 3,
};

const defaultProgress: ProgressState = {
  unlockedLevels: [1, 2, 3],
  coins: 0,
  upgrades: defaultUpgrades,
  bestTimes: {},
};

// Helper to build a LevelConfig with all defaults
function mkLevel(
  id: number,
  name: string,
  description: string,
  overrides: Partial<Omit<LevelConfig, "id" | "name" | "description">>,
): LevelConfig {
  return {
    id,
    name,
    description,
    rotationSpeedMult: 1.0,
    gateSpeedMult: 1.0,
    seekerSpeedMult: 1.0,
    fogRadius: null,
    hasFakeWalls: false,
    hasMovingFireZones: false,
    seekerTrapResistant: false,
    multiScan: false,
    timeLimit: 90,
    hasGravityShift: false,
    hasTeleportPortals: false,
    reverseControlsRandom: false,
    multipleSeekersCount: 1,
    mazeShiftInterval: null,
    blackoutInterval: null,
    shrinkingMaze: false,
    timeFreezeZones: false,
    rotationDirectionRandom: false,
    pathCollapseEnabled: false,
    trapExplosionEnabled: false,
    bgTheme: "dawn",
    ...overrides,
  };
}

const LEVEL_CONFIGS: LevelConfig[] = [
  // ─── L1-10: HARDCORE START ────────────────────────────────────────────
  mkLevel(1, "Chakravyuh Entry", "Learn the rotating rings. Survive.", {
    rotationSpeedMult: 1.2,
    gateSpeedMult: 1.5,
    timeLimit: 80,
  }),
  mkLevel(2, "Rising Spiral", "Faster rings. Narrower windows.", {
    rotationSpeedMult: 1.5,
    gateSpeedMult: 1.8,
    seekerSpeedMult: 1.1,
    timeLimit: 75,
  }),
  mkLevel(3, "Warrior's Trial", "Seeker gains speed advantage.", {
    rotationSpeedMult: 2.0,
    gateSpeedMult: 2.2,
    seekerSpeedMult: 1.2,
    timeLimit: 70,
  }),
  mkLevel(4, "Chakra Storm", "Gates slam shut unpredictably.", {
    rotationSpeedMult: 2.3,
    gateSpeedMult: 2.5,
    seekerSpeedMult: 1.25,
    timeLimit: 65,
  }),
  mkLevel(5, "Fierce Vortex", "Max spin. No mercy.", {
    rotationSpeedMult: 2.6,
    gateSpeedMult: 2.8,
    seekerSpeedMult: 1.3,
    timeLimit: 60,
  }),
  mkLevel(6, "Speed Chaos", "Everything moves faster. React or die.", {
    rotationSpeedMult: 2.8,
    gateSpeedMult: 3.0,
    seekerSpeedMult: 1.35,
    timeLimit: 55,
  }),
  mkLevel(7, "Dark Trap", "Only nearby paths are visible.", {
    fogRadius: 100,
    rotationSpeedMult: 2.0,
    seekerSpeedMult: 1.3,
    timeLimit: 60,
  }),
  mkLevel(8, "Mirror Maze", "Fake walls and vanishing paths.", {
    hasFakeWalls: true,
    rotationSpeedMult: 2.2,
    timeLimit: 60,
  }),
  mkLevel(9, "Fire Zone", "Moving flames that burn. Seeker immune.", {
    hasMovingFireZones: true,
    seekerTrapResistant: true,
    rotationSpeedMult: 2.4,
    timeLimit: 55,
  }),
  mkLevel(10, "Ultimate Chakravyuh", "All features. Fast. Unforgiving.", {
    rotationSpeedMult: 3.2,
    gateSpeedMult: 3.8,
    fogRadius: 120,
    hasFakeWalls: true,
    hasMovingFireZones: true,
    seekerTrapResistant: true,
    multiScan: true,
    seekerSpeedMult: 1.5,
    timeLimit: 50,
  }),

  // ─── L11-20: MIND BREAKER ─────────────────────────────────────────────
  mkLevel(11, "Illusion Gate", "Fake paths everywhere. Trust nothing.", {
    hasFakeWalls: true,
    rotationDirectionRandom: true,
    seekerSpeedMult: 1.4,
    timeLimit: 55,
  }),
  mkLevel(12, "Collapsing Paths", "Walls randomly fall. Adapt fast.", {
    fogRadius: 90,
    pathCollapseEnabled: true,
    seekerSpeedMult: 1.45,
    timeLimit: 50,
  }),
  mkLevel(13, "Vanishing Act", "Fake walls + sudden collapses.", {
    hasFakeWalls: true,
    pathCollapseEnabled: true,
    rotationSpeedMult: 2.5,
    seekerSpeedMult: 1.5,
    timeLimit: 50,
  }),
  mkLevel(14, "Spinning Fire", "Direction reverses. Fire moves.", {
    rotationDirectionRandom: true,
    hasMovingFireZones: true,
    seekerSpeedMult: 1.5,
    timeLimit: 48,
  }),
  mkLevel(15, "Blind Illusion", "Fog + fake walls + spinning reversal.", {
    fogRadius: 80,
    hasFakeWalls: true,
    rotationDirectionRandom: true,
    seekerSpeedMult: 1.55,
    timeLimit: 45,
  }),
  mkLevel(16, "Multi-Scan Hunt", "Seeker sweeps wide. Paths collapse.", {
    pathCollapseEnabled: true,
    multiScan: true,
    seekerSpeedMult: 1.6,
    timeLimit: 45,
  }),
  mkLevel(17, "Smoke & Mirrors", "Fake walls + fire + fog.", {
    hasFakeWalls: true,
    hasMovingFireZones: true,
    fogRadius: 95,
    seekerSpeedMult: 1.6,
    timeLimit: 43,
  }),
  mkLevel(18, "Chaos Reversal", "Rings reverse + paths collapse.", {
    rotationDirectionRandom: true,
    pathCollapseEnabled: true,
    seekerTrapResistant: true,
    seekerSpeedMult: 1.65,
    timeLimit: 42,
  }),
  mkLevel(19, "Blind Pursuit", "Fog + fake walls + ultra-seeker.", {
    fogRadius: 75,
    hasFakeWalls: true,
    seekerSpeedMult: 1.7,
    multiScan: true,
    timeLimit: 40,
  }),
  mkLevel(20, "Mind Breaker", "Every L11-19 mechanic combined.", {
    fogRadius: 80,
    hasFakeWalls: true,
    rotationDirectionRandom: true,
    pathCollapseEnabled: true,
    hasMovingFireZones: true,
    rotationSpeedMult: 3.0,
    seekerSpeedMult: 1.75,
    multiScan: true,
    timeLimit: 38,
  }),

  // ─── L21-30: INSANE REACTION ──────────────────────────────────────────
  mkLevel(21, "Freeze Panic", "Time freeze zones stun you mid-run.", {
    rotationSpeedMult: 3.5,
    seekerSpeedMult: 1.8,
    timeFreezeZones: true,
    timeLimit: 45,
  }),
  mkLevel(22, "Explosive Fire", "Traps explode. Fire moves fast.", {
    hasMovingFireZones: true,
    trapExplosionEnabled: true,
    seekerSpeedMult: 1.85,
    timeLimit: 42,
  }),
  mkLevel(23, "Hyper Spin", "Rings spin faster every second.", {
    rotationSpeedMult: 3.8,
    fogRadius: 85,
    seekerSpeedMult: 1.9,
    timeLimit: 40,
  }),
  mkLevel(24, "Frozen Bombs", "Freeze zones + explosive traps.", {
    hasFakeWalls: true,
    timeFreezeZones: true,
    trapExplosionEnabled: true,
    seekerSpeedMult: 1.9,
    timeLimit: 38,
  }),
  mkLevel(25, "Velocity Gate", "Ultra-fast rings. Paths collapse constantly.", {
    rotationSpeedMult: 4.0,
    pathCollapseEnabled: true,
    seekerSpeedMult: 2.0,
    timeLimit: 35,
  }),
  mkLevel(26, "Inferno Scan", "Fire + bombs + seeker sweeps area.", {
    fogRadius: 70,
    hasMovingFireZones: true,
    trapExplosionEnabled: true,
    multiScan: true,
    seekerSpeedMult: 2.0,
    timeLimit: 35,
  }),
  mkLevel(27, "Phantom Ice", "Fake walls + freeze zones at max speed.", {
    rotationSpeedMult: 4.2,
    hasFakeWalls: true,
    timeFreezeZones: true,
    seekerSpeedMult: 2.1,
    timeLimit: 32,
  }),
  mkLevel(28, "Collapse Bomb", "Paths fall + traps explode + rings flip.", {
    pathCollapseEnabled: true,
    trapExplosionEnabled: true,
    rotationDirectionRandom: true,
    seekerSpeedMult: 2.15,
    timeLimit: 30,
  }),
  mkLevel(29, "Blind Inferno", "Fog + max speed + fire + seeker charges.", {
    fogRadius: 60,
    rotationSpeedMult: 4.5,
    seekerSpeedMult: 2.2,
    hasMovingFireZones: true,
    timeLimit: 28,
  }),
  mkLevel(30, "Insane Reaction", "Everything so far. Time: 25s.", {
    fogRadius: 70,
    hasFakeWalls: true,
    hasMovingFireZones: true,
    timeFreezeZones: true,
    trapExplosionEnabled: true,
    pathCollapseEnabled: true,
    rotationDirectionRandom: true,
    rotationSpeedMult: 5.0,
    seekerSpeedMult: 2.3,
    multiScan: true,
    timeLimit: 25,
  }),

  // ─── L31-40: CHAOS MODE ───────────────────────────────────────────────
  mkLevel(31, "Twin Seekers", "Two hunters. Nowhere to hide.", {
    multipleSeekersCount: 2,
    hasTeleportPortals: true,
    seekerSpeedMult: 1.8,
    timeLimit: 45,
  }),
  mkLevel(32, "Reverse Hunt", "Controls flip randomly. Two seekers.", {
    reverseControlsRandom: true,
    multipleSeekersCount: 2,
    seekerSpeedMult: 1.85,
    timeLimit: 42,
  }),
  mkLevel(33, "Shifting Maze", "Gates reshuffle. Portals everywhere.", {
    mazeShiftInterval: 8,
    hasTeleportPortals: true,
    seekerSpeedMult: 2.3,
    timeLimit: 40,
  }),
  mkLevel(34, "Double Chaos", "Two seekers + reverse + explosions.", {
    multipleSeekersCount: 2,
    reverseControlsRandom: true,
    trapExplosionEnabled: true,
    seekerSpeedMult: 2.0,
    timeLimit: 38,
  }),
  mkLevel(35, "Gravity Warp", "Gravity shifts + maze reshuffles + portals.", {
    hasGravityShift: true,
    mazeShiftInterval: 6,
    hasTeleportPortals: true,
    seekerSpeedMult: 2.1,
    timeLimit: 35,
  }),
  mkLevel(36, "Triple Threat", "Three seekers. Fog. Rings reverse.", {
    multipleSeekersCount: 3,
    rotationDirectionRandom: true,
    fogRadius: 80,
    seekerSpeedMult: 2.0,
    timeLimit: 35,
  }),
  mkLevel(37, "Flip Fire", "Reverse controls + maze shift + fire.", {
    reverseControlsRandom: true,
    mazeShiftInterval: 5,
    hasMovingFireZones: true,
    seekerSpeedMult: 2.2,
    timeLimit: 32,
  }),
  mkLevel(38, "Gravity Bomb", "Two seekers + gravity + portals + explosions.", {
    multipleSeekersCount: 2,
    hasGravityShift: true,
    trapExplosionEnabled: true,
    hasTeleportPortals: true,
    seekerSpeedMult: 2.3,
    timeLimit: 30,
  }),
  mkLevel(39, "Triple Fog", "Three seekers. Reverse. Fog. Fast.", {
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    fogRadius: 65,
    seekerSpeedMult: 2.5,
    timeLimit: 28,
  }),
  mkLevel(
    40,
    "Chaos Mode",
    "All chaos: 3 seekers + shift + portals + gravity.",
    {
      multipleSeekersCount: 3,
      mazeShiftInterval: 4,
      hasTeleportPortals: true,
      hasGravityShift: true,
      reverseControlsRandom: true,
      rotationSpeedMult: 4.0,
      seekerSpeedMult: 2.6,
      timeLimit: 25,
    },
  ),

  // ─── L41-50: ULTIMATE DEATH ZONE ─────────────────────────────────────
  mkLevel(41, "Blackout Strike", "Sudden darkness. Two seekers hunt.", {
    blackoutInterval: 15,
    multipleSeekersCount: 2,
    rotationSpeedMult: 5.5,
    seekerSpeedMult: 2.7,
    timeLimit: 35,
  }),
  mkLevel(42, "Shrinking World", "The maze closes in. Gravity shifts.", {
    shrinkingMaze: true,
    hasGravityShift: true,
    multipleSeekersCount: 2,
    seekerSpeedMult: 2.8,
    timeLimit: 32,
  }),
  mkLevel(43, "Dark Reversal", "Blackout + reverse + three seekers.", {
    blackoutInterval: 12,
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    seekerSpeedMult: 2.8,
    timeLimit: 30,
  }),
  mkLevel(
    44,
    "Death Shrink",
    "Maze shrinks + explosions + fog + seeker rampages.",
    {
      shrinkingMaze: true,
      trapExplosionEnabled: true,
      seekerSpeedMult: 3.0,
      fogRadius: 60,
      timeLimit: 28,
    },
  ),
  mkLevel(45, "Triple Blackout", "Blackout + shrink + 3 seekers + gravity.", {
    blackoutInterval: 10,
    shrinkingMaze: true,
    multipleSeekersCount: 3,
    hasGravityShift: true,
    seekerSpeedMult: 3.0,
    timeLimit: 25,
  }),
  mkLevel(46, "Nightmare Protocol", "All ultimate features. Six-star danger.", {
    blackoutInterval: 10,
    shrinkingMaze: true,
    hasGravityShift: true,
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    hasTeleportPortals: true,
    trapExplosionEnabled: true,
    rotationSpeedMult: 6.0,
    seekerSpeedMult: 3.2,
    timeLimit: 22,
  }),
  mkLevel(47, "Eclipse Mode", "Blackout every 8s. Shrink. Reverse. Portals.", {
    blackoutInterval: 8,
    shrinkingMaze: true,
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    hasTeleportPortals: true,
    seekerSpeedMult: 3.3,
    timeLimit: 20,
  }),
  mkLevel(48, "Void Maze", "Near-zero visibility. Blackout. Seeker gods.", {
    fogRadius: 50,
    blackoutInterval: 6,
    seekerSpeedMult: 3.5,
    shrinkingMaze: true,
    multipleSeekersCount: 3,
    timeLimit: 18,
  }),
  mkLevel(49, "Armageddon", "ALL mechanics. 3 seekers. 15 seconds.", {
    blackoutInterval: 8,
    shrinkingMaze: true,
    hasGravityShift: true,
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    hasTeleportPortals: true,
    trapExplosionEnabled: true,
    timeFreezeZones: true,
    pathCollapseEnabled: true,
    hasFakeWalls: true,
    hasMovingFireZones: true,
    rotationDirectionRandom: true,
    mazeShiftInterval: 5,
    rotationSpeedMult: 7.0,
    seekerSpeedMult: 3.7,
    fogRadius: 55,
    multiScan: true,
    timeLimit: 15,
  }),
  mkLevel(50, "ULTIMATE DEATH", "No mercy. No escape. No hope.", {
    blackoutInterval: 5,
    shrinkingMaze: true,
    hasGravityShift: true,
    reverseControlsRandom: true,
    multipleSeekersCount: 3,
    hasTeleportPortals: true,
    trapExplosionEnabled: true,
    timeFreezeZones: true,
    pathCollapseEnabled: true,
    hasFakeWalls: true,
    hasMovingFireZones: true,
    rotationDirectionRandom: true,
    mazeShiftInterval: 3,
    rotationSpeedMult: 8.0,
    seekerSpeedMult: 4.0,
    fogRadius: 40,
    multiScan: true,
    seekerTrapResistant: true,
    timeLimit: 12,
  }),
];

// Tier groups
const TIER_GROUPS = [
  { label: "⚔️ HARDCORE START", color: "#00E6FF", range: [1, 10] },
  { label: "🧠 MIND BREAKER", color: "#7CFF00", range: [11, 20] },
  { label: "⚡ INSANE REACTION", color: "#FFD700", range: [21, 30] },
  { label: "💥 CHAOS MODE", color: "#FF8C00", range: [31, 40] },
  { label: "💀 ULTIMATE DEATH ZONE", color: "#FF2244", range: [41, 50] },
] as const;

function getDifficultyStars(levelId: number): number {
  if (levelId <= 5) return 1;
  if (levelId <= 10) return 2;
  if (levelId <= 20) return 3;
  if (levelId <= 30) return 4;
  if (levelId <= 40) return 5;
  return 6;
}

function getLevelBorderColor(levelId: number): string {
  if (levelId <= 10) return "#00E6FF";
  if (levelId <= 20) return "#7CFF00";
  if (levelId <= 30) return "#FFD700";
  if (levelId <= 40) return "#FF8C00";
  return "#FF2244";
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress, upgrades: { ...defaultUpgrades } };
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      ...defaultProgress,
      ...parsed,
      upgrades: { ...defaultUpgrades, ...parsed.upgrades },
    };
  } catch {
    return { ...defaultProgress, upgrades: { ...defaultUpgrades } };
  }
}

function saveProgress(progress: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

// ───────────────────────────────────────────────────────────────
// UI Components
// ───────────────────────────────────────────────────────────────

interface PowerButtonProps {
  label: string;
  icon: string;
  cooldown: number;
  maxCooldown: number;
  timer: number;
  maxTimer: number;
  active: boolean;
  selected: boolean;
  color: string;
  onClick: () => void;
  dataOcid: string;
}

function PowerButton({
  label,
  icon,
  cooldown,
  maxCooldown,
  timer,
  maxTimer,
  active,
  selected,
  color,
  onClick,
  dataOcid,
}: PowerButtonProps) {
  const progress = active
    ? timer / Math.max(maxTimer, 0.001)
    : cooldown > 0
      ? 1 - cooldown / Math.max(maxCooldown, 0.001)
      : 1;

  const circumference = 2 * Math.PI * 22;
  const strokeDash = circumference * Math.max(0, Math.min(1, progress));

  return (
    <button
      type="button"
      data-ocid={dataOcid}
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 group"
      style={{
        touchAction: "none",
        outline: selected ? `2px solid ${color}` : "none",
        borderRadius: "4px",
        padding: "2px",
      }}
    >
      <div className="relative w-14 h-14">
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 56 56"
        >
          <polygon
            points="28,4 52,16 52,40 28,52 4,40 4,16"
            fill={selected ? `${color}22` : "rgba(0,0,0,0.6)"}
            stroke={color}
            strokeWidth="2"
            opacity="0.5"
          />
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${strokeDash} ${circumference}`}
            opacity={active ? 1 : cooldown > 0 ? 0.4 : 0.9}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base leading-none">{icon}</span>
          <span
            className="text-[8px] font-bold uppercase text-center leading-tight mt-0.5"
            style={{
              color,
              fontFamily: "Orbitron, monospace",
              textShadow: `0 0 8px ${color}`,
            }}
          >
            {active ? "ON" : cooldown > 0 ? Math.ceil(cooldown) : "RDY"}
          </span>
        </div>
      </div>
      <span
        className="text-[8px] uppercase tracking-widest"
        style={{ color, fontFamily: "Orbitron, monospace" }}
      >
        {label}
      </span>
    </button>
  );
}

interface JoystickComponentProps {
  onJoystickChange: (state: JoystickState) => void;
}

function JoystickComponent({ onJoystickChange }: JoystickComponentProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const baseRadius = 60;
  const knobRadius = 24;

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current || !knobRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = baseRadius - knobRadius;
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      onJoystickChange({
        active: true,
        dx: dist > 8 ? dx / maxDist : 0,
        dy: dist > 8 ? dy / maxDist : 0,
      });
    },
    [onJoystickChange],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      updateKnob(touch.clientX, touch.clientY);
    },
    [updateKnob],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current,
      );
      if (touch) updateKnob(touch.clientX, touch.clientY);
    },
    [updateKnob],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current,
      );
      if (touch) {
        touchIdRef.current = null;
        if (knobRef.current) {
          knobRef.current.style.transform = "translate(-50%, -50%)";
        }
        onJoystickChange({ active: false, dx: 0, dy: 0 });
      }
    },
    [onJoystickChange],
  );

  return (
    <div
      data-ocid="joystick.canvas_target"
      ref={baseRef}
      className="relative select-none"
      style={{
        width: baseRadius * 2,
        height: baseRadius * 2,
        borderRadius: "50%",
        background: "rgba(0,230,255,0.05)",
        border: "2px solid rgba(0,230,255,0.35)",
        boxShadow: "0 0 20px rgba(0,230,255,0.15)",
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {["\u25b2", "\u25bc", "\u25c4", "\u25ba"].map((arrow, i) => {
        const positions = [
          { top: "6px", left: "50%", transform: "translateX(-50%)" },
          { bottom: "6px", left: "50%", transform: "translateX(-50%)" },
          { left: "6px", top: "50%", transform: "translateY(-50%)" },
          { right: "6px", top: "50%", transform: "translateY(-50%)" },
        ] as const;
        return (
          <span
            key={arrow}
            className="absolute text-[10px] opacity-50"
            style={{ color: "#00E6FF", ...positions[i] }}
          >
            {arrow}
          </span>
        );
      })}
      <div
        ref={knobRef}
        className="absolute rounded-full"
        style={{
          width: knobRadius * 2,
          height: knobRadius * 2,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(0,230,255,0.8) 0%, rgba(0,150,200,0.5) 100%)",
          boxShadow:
            "0 0 12px rgba(0,230,255,0.6), inset 0 0 8px rgba(255,255,255,0.2)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// Level card
interface LevelCardProps {
  config: LevelConfig;
  locked: boolean;
  bestTime?: number;
  onClick: () => void;
  dataOcid: string;
}

function LevelCard({
  config,
  locked,
  bestTime,
  onClick,
  dataOcid,
}: LevelCardProps) {
  const borderColor = getLevelBorderColor(config.id);
  const stars = getDifficultyStars(config.id);

  const featureIcons: string[] = [];
  if (config.fogRadius !== null) featureIcons.push("🌑");
  if (config.hasFakeWalls) featureIcons.push("👁");
  if (config.hasMovingFireZones) featureIcons.push("🔥");
  if (config.multipleSeekersCount >= 2) featureIcons.push("👥");
  if (config.hasGravityShift) featureIcons.push("🌀");
  if (config.blackoutInterval !== null) featureIcons.push("💀");
  if (config.reverseControlsRandom) featureIcons.push("🔄");
  if (config.shrinkingMaze) featureIcons.push("⬛");

  const isDeath = config.id >= 41;
  const starDisplay = isDeath ? "☠" : "★".repeat(stars);

  return (
    <motion.button
      type="button"
      data-ocid={dataOcid}
      onClick={locked ? undefined : onClick}
      whileHover={locked ? {} : { scale: 1.03 }}
      whileTap={locked ? {} : { scale: 0.97 }}
      className="relative flex flex-col items-start p-3 rounded-sm text-left"
      style={{
        border: `2px solid ${locked ? "rgba(100,100,120,0.4)" : borderColor}`,
        background: locked ? "rgba(10,10,20,0.6)" : "rgba(5,5,15,0.9)",
        boxShadow: locked ? "none" : `0 0 12px ${borderColor}33`,
        filter: locked ? "grayscale(0.8) brightness(0.5)" : "none",
        cursor: locked ? "not-allowed" : "pointer",
        minHeight: "100px",
      }}
    >
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-sm z-10">
          <span className="text-2xl opacity-70">🔒</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-1 w-full">
        <span
          className="text-xs font-bold"
          style={{
            color: borderColor,
            fontFamily: "Orbitron, monospace",
            textShadow: `0 0 8px ${borderColor}`,
          }}
        >
          L{config.id}
        </span>
        <span
          className="text-[10px]"
          style={{ color: isDeath ? "#FF2244" : "#FFD700" }}
        >
          {starDisplay}
        </span>
        {featureIcons.length > 0 && (
          <span className="text-[9px] ml-auto opacity-70">
            {featureIcons.slice(0, 4).join("")}
          </span>
        )}
      </div>
      <p
        className="text-xs font-bold mb-0.5"
        style={{
          color: locked ? "#555" : "#e0e0f0",
          fontFamily: "Orbitron, monospace",
        }}
      >
        {config.name}
      </p>
      <p className="text-[10px] leading-tight" style={{ color: "#6a7090" }}>
        {config.description}
      </p>
      {bestTime !== undefined && (
        <p className="text-[10px] mt-1" style={{ color: "#00E6FF" }}>
          Best: {formatTime(bestTime)}
        </p>
      )}
    </motion.button>
  );
}

// Upgrade shop modal
interface UpgradeShopProps {
  coins: number;
  upgrades: UpgradeState;
  onUpgrade: (type: string) => void;
  onClose: () => void;
}

function UpgradeShop({
  coins,
  upgrades,
  onUpgrade,
  onClose,
}: UpgradeShopProps) {
  const upgradeDefs = [
    // Existing upgrades
    {
      id: "invis1",
      name: "Invisibility+",
      icon: "👻",
      desc: "Extend invisible duration to 6s",
      cost: 30,
      available: upgrades.invisDuration < 6,
    },
    {
      id: "invis2",
      name: "Invisibility++",
      icon: "👻",
      desc: "Extend invisible duration to 7s",
      cost: 60,
      available: upgrades.invisDuration >= 6 && upgrades.invisDuration < 7,
    },
    {
      id: "speedboost",
      name: "Speed Boost",
      icon: "⚡",
      desc: "Unlock speed boost ability (3s burst)",
      cost: 25,
      available: !upgrades.speedBoostUnlocked,
    },
    {
      id: "speedboost2",
      name: "Speed Boost II",
      icon: "⚡",
      desc: "Upgrade speed boost (75% faster)",
      cost: 40,
      available: upgrades.speedBoostUnlocked && upgrades.speedBoostLevel < 2,
    },
    {
      id: "speedboost3",
      name: "Speed Boost III",
      icon: "⚡",
      desc: "Max speed boost (100% faster)",
      cost: 70,
      available: upgrades.speedBoostUnlocked && upgrades.speedBoostLevel === 2,
    },
    {
      id: "dash",
      name: "Dash",
      icon: "💨",
      desc: "Unlock dash (quick escape teleport)",
      cost: 35,
      available: !upgrades.dashUnlocked,
    },
    {
      id: "trapimmune",
      name: "Trap Immunity",
      icon: "🛡",
      desc: "Unlock trap immunity (3s shield)",
      cost: 30,
      available: !upgrades.trapImmunityUnlocked,
    },
    {
      id: "trapimmune2",
      name: "Trap Shield II",
      icon: "🛡",
      desc: "Extend trap immunity to 5s",
      cost: 50,
      available:
        upgrades.trapImmunityUnlocked && upgrades.trapImmunityDuration < 5,
    },
    {
      id: "cd1",
      name: "Cooldown -10%",
      icon: "🔄",
      desc: "All cooldowns reduced by 10%",
      cost: 20,
      available: upgrades.cooldownReduction < 0.1,
    },
    {
      id: "cd2",
      name: "Cooldown -20%",
      icon: "🔄",
      desc: "All cooldowns reduced by 20%",
      cost: 45,
      available:
        upgrades.cooldownReduction >= 0.1 && upgrades.cooldownReduction < 0.2,
    },
    {
      id: "cd3",
      name: "Cooldown -30%",
      icon: "🔄",
      desc: "All cooldowns reduced by 30%",
      cost: 80,
      available:
        upgrades.cooldownReduction >= 0.2 && upgrades.cooldownReduction < 0.3,
    },
    // New upgrades
    {
      id: "hyperdash",
      name: "Hyper Dash",
      icon: "💥",
      desc: "2x dash distance & speed, 2.5s cooldown",
      cost: 50,
      available: !upgrades.hyperDashUnlocked,
    },
    {
      id: "phasewalk",
      name: "Phase Walk",
      icon: "👁",
      desc: "Pass through walls for 2s",
      cost: 80,
      available: !upgrades.phaseWalkUnlocked,
    },
    {
      id: "timeslow",
      name: "Time Slow",
      icon: "⏱",
      desc: "Slow all enemies by 75% for 3s",
      cost: 100,
      available: !upgrades.timeSlowUnlocked,
    },
    {
      id: "energyshield",
      name: "Energy Shield",
      icon: "🔶",
      desc: "Absorb one trap/fire hit automatically",
      cost: 60,
      available: !upgrades.energyShieldUnlocked,
    },
  ];

  return (
    <motion.div
      data-ocid="upgradeshop.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(2,4,12,0.88)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="flex flex-col w-full max-w-lg max-h-[90vh]"
        style={{
          border: "2px solid rgba(138,61,255,0.6)",
          background: "rgba(5,5,18,0.98)",
          boxShadow: "0 0 60px rgba(138,61,255,0.3)",
          borderRadius: "4px",
          margin: "16px",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(138,61,255,0.3)" }}
        >
          <div>
            <h2
              className="text-xl font-black tracking-widest"
              style={{
                color: "#8A3DFF",
                fontFamily: "Orbitron, monospace",
                textShadow: "0 0 20px #8A3DFF",
              }}
            >
              UPGRADES
            </h2>
            <p className="text-xs" style={{ color: "#9AA7C0" }}>
              Spend coins to power up your abilities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-sm"
              style={{
                background: "rgba(255,215,0,0.12)",
                border: "1px solid rgba(255,215,0,0.4)",
              }}
            >
              <span className="text-sm">🪙</span>
              <span
                className="text-sm font-bold"
                style={{ color: "#FFD700", fontFamily: "Orbitron, monospace" }}
              >
                {coins}
              </span>
            </div>
            <button
              type="button"
              data-ocid="upgradeshop.close_button"
              onClick={onClose}
              className="text-xl"
              style={{ color: "#9AA7C0" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Upgrade grid */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upgradeDefs
              .filter((u) => u.available)
              .map((upg) => (
                <div
                  key={upg.id}
                  className="flex items-center gap-3 p-3 rounded-sm"
                  style={{
                    border: "1px solid rgba(138,61,255,0.3)",
                    background: "rgba(138,61,255,0.05)",
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{upg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold"
                      style={{
                        color: "#e0e0ff",
                        fontFamily: "Orbitron, monospace",
                      }}
                    >
                      {upg.name}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "#6a7090" }}
                    >
                      {upg.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid={`upgradeshop.${upg.id}.button`}
                    onClick={() => onUpgrade(upg.id)}
                    disabled={coins < upg.cost}
                    className="flex-shrink-0 px-3 py-1.5 rounded-sm text-xs font-bold"
                    style={{
                      border:
                        coins >= upg.cost
                          ? "1px solid #FFD700"
                          : "1px solid rgba(100,100,100,0.4)",
                      color: coins >= upg.cost ? "#FFD700" : "#555",
                      background:
                        coins >= upg.cost
                          ? "rgba(255,215,0,0.12)"
                          : "transparent",
                      cursor: coins >= upg.cost ? "pointer" : "not-allowed",
                      fontFamily: "Orbitron, monospace",
                    }}
                  >
                    🪙{upg.cost}
                  </button>
                </div>
              ))}
            {upgradeDefs
              .filter((u) => !u.available)
              .map((upg) => (
                <div
                  key={upg.id}
                  className="flex items-center gap-3 p-3 rounded-sm opacity-30"
                  style={{
                    border: "1px solid rgba(80,80,100,0.3)",
                    background: "rgba(0,0,0,0.3)",
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{upg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold"
                      style={{
                        color: "#888",
                        fontFamily: "Orbitron, monospace",
                      }}
                    >
                      {upg.name}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#444" }}>
                      Maxed or locked
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: "#555" }}>
                    ✓
                  </span>
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────
// Main MazeGame Component
// ───────────────────────────────────────────────────────────────

export default function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    useAbility: false,
    p2up: false,
    p2down: false,
    p2left: false,
    p2right: false,
    p2useAbility: false,
  });
  const joystickRef = useRef<JoystickState>({ active: false, dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const menuRafRef = useRef<number>(0);
  const menuLastTimeRef = useRef<number>(0);

  const [gamePhase, setGamePhase] = useState<GamePhase>("menu");
  const [selectedMode, setSelectedMode] = useState<GameMode>("solo");
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [timeLeft, setTimeLeft] = useState(90);
  const [winner, setWinner] = useState<"hider" | "seeker" | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [coinsEarnedThisRound, setCoinsEarnedThisRound] = useState(0);
  const [newLevelUnlocked, setNewLevelUnlocked] = useState<number | null>(null);

  // Difficulty state
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  // Leaderboard state
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // HUD state synced from game loop
  const [p1InvisTimer, setP1InvisTimer] = useState(0);
  const [p1InvisCooldown, setP1InvisCooldown] = useState(0);
  const [p1DashCooldown, setP1DashCooldown] = useState(0);
  const [p1SpeedBoostTimer, setP1SpeedBoostTimer] = useState(0);
  const [p1SpeedBoostCooldown, setP1SpeedBoostCooldown] = useState(0);
  const [p1TrapImmuneCooldown, setP1TrapImmuneCooldown] = useState(0);
  const [p1TrapImmuneTimer, setP1TrapImmuneTimer] = useState(0);
  const [p1SelectedAbility, setP1SelectedAbility] = useState(0);
  const [seekerScanTimer, setSeekerScanTimer] = useState(0);
  const [seekerScanCooldown, setSeekerScanCooldown] = useState(0);
  const [coinDisplay, setCoinDisplay] = useState(0);
  const [isTouchDevice] = useState(() => navigator.maxTouchPoints > 0);
  // New HUD state
  const [reverseControlsActive, setReverseControlsActive] = useState(false);
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const [gravityShiftActive, setGravityShiftActive] = useState(false);
  const [blackoutActive, setBlackoutActive] = useState(false);

  // Save progress whenever it changes
  useEffect(() => {
    saveProgress(progress);
    setCoinDisplay(progress.coins);
  }, [progress]);

  // ── Menu animation loop ────────────────────────────────────────────
  const runMenuLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const dt = Math.min((now - menuLastTimeRef.current) / 1000, 0.05);
    menuLastTimeRef.current = now;

    renderMenuBackground(ctx, canvas.width, canvas.height, dt);
    menuRafRef.current = requestAnimationFrame(runMenuLoop);
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────
  const runGameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const state = gameStateRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;

    const result = updateGame(state, dt, inputRef.current, joystickRef.current);

    if (result.winner) {
      const won = result.winner === "hider";
      const earned = getCoinsEarned(state, won);
      setCoinsEarnedThisRound(earned);

      let unlockedNew: number | null = null;
      if (won && state.currentLevel < 50) {
        unlockedNew = state.currentLevel + 1;
      }

      setProgress((prev) => {
        const newCoins = prev.coins + earned;
        let newUnlocked = [...prev.unlockedLevels];
        let actualUnlock: number | null = null;

        if (unlockedNew !== null && !newUnlocked.includes(unlockedNew)) {
          newUnlocked.push(unlockedNew);
          actualUnlock = unlockedNew;
        }
        setNewLevelUnlocked(actualUnlock);

        const newBestTimes = { ...prev.bestTimes };
        if (won) {
          const existing = newBestTimes[state.currentLevel];
          if (existing === undefined || state.timeLeft > existing) {
            newBestTimes[state.currentLevel] = Math.floor(state.timeLeft);
          }
        }

        return {
          ...prev,
          coins: newCoins,
          unlockedLevels: newUnlocked,
          bestTimes: newBestTimes,
        };
      });

      if (unlockedNew !== null) playSoundEffect("levelup");
      stopHeartbeat();

      setWinner(result.winner);
      setGamePhase("gameover");
      stopAllMusic();
      return;
    }

    renderFrame(ctx, state, canvas.width, canvas.height, 0);

    // Sync HUD
    setTimeLeft(Math.floor(state.timeLeft));

    const p1 = state.players[0];
    if (p1?.role === "hider") {
      setP1InvisTimer(p1.invisibleTimer);
      setP1InvisCooldown(p1.invisibleCooldown);
      setP1DashCooldown(p1.dashCooldown);
      setP1SpeedBoostTimer(p1.speedBoostTimer);
      setP1SpeedBoostCooldown(p1.speedBoostCooldown);
      setP1TrapImmuneTimer(p1.trapImmuneTimer);
      setP1TrapImmuneCooldown(p1.trapImmuneCooldown);
      setP1SelectedAbility(p1.selectedAbility);
    }
    const sk = state.players.find((p) => p.role === "seeker");
    if (sk) {
      setSeekerScanTimer(sk.scanTimer);
      setSeekerScanCooldown(sk.scanCooldown);
    }

    // Sync new HUD states
    setReverseControlsActive(state.reverseControlsActive);
    setHeartbeatActive(state.heartbeatActive);
    setGravityShiftActive(state.gravityShiftActive);
    setBlackoutActive(state.blackoutActive);

    rafRef.current = requestAnimationFrame(runGameLoop);
  }, []);

  // ── Canvas resize ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Menu bg start ─────────────────────────────────────────────────
  useEffect(() => {
    if (
      gamePhase === "menu" ||
      gamePhase === "modeSelect" ||
      gamePhase === "levelSelect"
    ) {
      menuLastTimeRef.current = performance.now();
      menuRafRef.current = requestAnimationFrame(runMenuLoop);
      if (gamePhase === "menu") startMenuMusic();
      return () => {
        cancelAnimationFrame(menuRafRef.current);
        if (gamePhase === "menu") stopAllMusic();
      };
    }
  }, [gamePhase, runMenuLoop]);

  // ── Keyboard input ───────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          inp.up = true;
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          inp.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = true;
          break;
        case "KeyQ":
        case "Space":
          inp.useAbility = true;
          break;
        case "Digit1":
          cycleAbility(0);
          break;
        case "Digit2":
          cycleAbility(1);
          break;
        case "Digit3":
          cycleAbility(2);
          break;
        case "Digit4":
          cycleAbility(3);
          break;
        case "Digit5":
          cycleAbility(4);
          break;
        case "Digit6":
          cycleAbility(5);
          break;
        case "Digit7":
          cycleAbility(6);
          break;
        case "Digit8":
          cycleAbility(7);
          break;
        case "KeyI":
          inp.p2up = true;
          break;
        case "KeyK":
          inp.p2down = true;
          break;
        case "KeyJ":
          inp.p2left = true;
          break;
        case "KeyL":
          inp.p2right = true;
          break;
        case "KeyU":
          inp.p2useAbility = true;
          break;
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          inp.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          inp.down = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          inp.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          inp.right = false;
          break;
        case "KeyQ":
        case "Space":
          inp.useAbility = false;
          break;
        case "KeyI":
          inp.p2up = false;
          break;
        case "KeyK":
          inp.p2down = false;
          break;
        case "KeyJ":
          inp.p2left = false;
          break;
        case "KeyL":
          inp.p2right = false;
          break;
        case "KeyU":
          inp.p2useAbility = false;
          break;
        case "Escape":
        case "KeyP": {
          setGamePhase((prev) => {
            if (prev === "playing") return "paused";
            if (prev === "paused") return "playing";
            return prev;
          });
          break;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Game phase transitions ─────────────────────────────────────────
  useEffect(() => {
    if (gamePhase === "playing") {
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(runGameLoop);
      startGameMusic();
    } else {
      cancelAnimationFrame(rafRef.current);
      if (gamePhase !== "paused") stopAllMusic();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [gamePhase, runGameLoop]);

  const cycleAbility = useCallback((target: number) => {
    const state = gameStateRef.current;
    if (!state) return;
    const p1 = state.players[0];
    if (p1 && p1.role === "hider") {
      p1.selectedAbility = target;
      setP1SelectedAbility(target);
    }
  }, []);

  const startGame = useCallback(
    (mode: GameMode, levelId: number) => {
      const levelConfig = getLevelConfig(levelId, difficulty);
      // Merge with any LEVEL_CONFIGS override if it exists (preserve existing level designs)
      const existingConfig = LEVEL_CONFIGS.find((l) => l.id === levelId);
      const finalConfig = existingConfig
        ? {
            ...existingConfig,
            bgTheme: levelConfig.bgTheme,
          }
        : levelConfig;
      initAudio();
      resumeAudio();
      resetCamera();
      initAI();
      initBackground(levelId, window.innerWidth, window.innerHeight);
      const state = createGameState(mode, finalConfig, progress.upgrades);
      // Set difficulty
      state.difficulty = difficulty;
      gameStateRef.current = state;
      setSelectedMode(mode);
      setSelectedLevelId(levelId);
      setWinner(null);
      setTimeLeft(finalConfig.timeLimit);
      setCoinsEarnedThisRound(0);
      setNewLevelUnlocked(null);
      setScoreSaved(false);
      setPlayerNameInput("");
      setReverseControlsActive(false);
      setHeartbeatActive(false);
      setGravityShiftActive(false);
      setBlackoutActive(false);
      setGamePhase("playing");
      cancelAnimationFrame(menuRafRef.current);
      stopAllMusic();
    },
    [progress.upgrades, difficulty],
  );

  const restartGame = useCallback(() => {
    startGame(selectedMode, selectedLevelId);
  }, [startGame, selectedMode, selectedLevelId]);

  const goToMenu = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stopAllMusic();
    stopHeartbeat();
    gameStateRef.current = null;
    setGamePhase("menu");
  }, []);

  const togglePause = useCallback(() => {
    setGamePhase((prev) => {
      if (prev === "playing") {
        stopAllMusic();
        return "paused";
      }
      if (prev === "paused") {
        startGameMusic();
        return "playing";
      }
      return prev;
    });
  }, []);

  const handleP1Ability = useCallback(() => {
    inputRef.current.useAbility = true;
    setTimeout(() => {
      inputRef.current.useAbility = false;
    }, 100);
  }, []);

  const handleCycleAbility = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const p1 = state.players[0];
    if (p1 && p1.role === "hider") {
      const next = (p1.selectedAbility + 1) % 8;
      p1.selectedAbility = next;
      setP1SelectedAbility(next);
    }
  }, []);

  const handleJoystickChange = useCallback((jState: JoystickState) => {
    joystickRef.current = jState;
  }, []);

  const handleUpgrade = useCallback((type: string) => {
    setProgress((prev) => {
      const upg = { ...prev.upgrades };
      let cost = 0;
      switch (type) {
        case "invis1":
          cost = 30;
          if (prev.coins >= cost) upg.invisDuration = 6;
          break;
        case "invis2":
          cost = 60;
          if (prev.coins >= cost) upg.invisDuration = 7;
          break;
        case "speedboost":
          cost = 25;
          if (prev.coins >= cost) upg.speedBoostUnlocked = true;
          break;
        case "speedboost2":
          cost = 40;
          if (prev.coins >= cost) upg.speedBoostLevel = 2;
          break;
        case "speedboost3":
          cost = 70;
          if (prev.coins >= cost) upg.speedBoostLevel = 3;
          break;
        case "dash":
          cost = 35;
          if (prev.coins >= cost) upg.dashUnlocked = true;
          break;
        case "trapimmune":
          cost = 30;
          if (prev.coins >= cost) upg.trapImmunityUnlocked = true;
          break;
        case "trapimmune2":
          cost = 50;
          if (prev.coins >= cost) upg.trapImmunityDuration = 5;
          break;
        case "cd1":
          cost = 20;
          if (prev.coins >= cost) upg.cooldownReduction = 0.1;
          break;
        case "cd2":
          cost = 45;
          if (prev.coins >= cost) upg.cooldownReduction = 0.2;
          break;
        case "cd3":
          cost = 80;
          if (prev.coins >= cost) upg.cooldownReduction = 0.3;
          break;
        case "hyperdash":
          cost = 50;
          if (prev.coins >= cost) upg.hyperDashUnlocked = true;
          break;
        case "phasewalk":
          cost = 80;
          if (prev.coins >= cost) upg.phaseWalkUnlocked = true;
          break;
        case "timeslow":
          cost = 100;
          if (prev.coins >= cost) upg.timeSlowUnlocked = true;
          break;
        case "energyshield":
          cost = 60;
          if (prev.coins >= cost) {
            upg.energyShieldUnlocked = true;
            upg.energyShieldCharges = 1;
          }
          break;
      }
      if (prev.coins < cost) return prev;
      return { ...prev, coins: prev.coins - cost, upgrades: upg };
    });
  }, []);

  const currentLevelConfig =
    LEVEL_CONFIGS.find((l) => l.id === selectedLevelId) || LEVEL_CONFIGS[0];
  const modeLabel =
    selectedMode === "solo"
      ? "SOLO"
      : selectedMode === "duo1v1"
        ? "DUO 1v1"
        : "DUO 2v1";

  const p1 = gameStateRef.current?.players[0];
  const seekerPlayer = gameStateRef.current?.players.find(
    (p) => p.role === "seeker",
  );
  const isP1Seeker = p1?.role === "seeker";

  // Build unlocked ability list for HUD
  const p1Abilities = [
    {
      id: 0,
      label: "INVIS",
      icon: "👻",
      color: "#00E6FF",
      cooldown: p1InvisCooldown,
      maxCooldown: 12 * (1 - progress.upgrades.cooldownReduction),
      timer: p1InvisTimer,
      maxTimer: progress.upgrades.invisDuration,
      active: p1?.isInvisible || false,
      unlocked: true,
    },
    {
      id: 1,
      label: "DASH",
      icon: "💨",
      color: "#FFFFFF",
      cooldown: p1DashCooldown,
      maxCooldown: 4 * (1 - progress.upgrades.cooldownReduction),
      timer: 0,
      maxTimer: 0.1,
      active: p1?.dashActive || false,
      unlocked: progress.upgrades.dashUnlocked,
    },
    {
      id: 2,
      label: "BOOST",
      icon: "⚡",
      color: "#FFD700",
      cooldown: p1SpeedBoostCooldown,
      maxCooldown: 10 * (1 - progress.upgrades.cooldownReduction),
      timer: p1SpeedBoostTimer,
      maxTimer: 3,
      active: p1?.speedBoostActive || false,
      unlocked: progress.upgrades.speedBoostUnlocked,
    },
    {
      id: 3,
      label: "SHIELD",
      icon: "🛡",
      color: "#00FF88",
      cooldown: p1TrapImmuneCooldown,
      maxCooldown: 15 * (1 - progress.upgrades.cooldownReduction),
      timer: p1TrapImmuneTimer,
      maxTimer: progress.upgrades.trapImmunityDuration,
      active: p1?.trapImmune || false,
      unlocked: progress.upgrades.trapImmunityUnlocked,
    },
    {
      id: 4,
      label: "HDASH",
      icon: "💥",
      color: "#FF00FF",
      cooldown: p1?.hyperDashCooldown || 0,
      maxCooldown: 2.5 * (1 - progress.upgrades.cooldownReduction),
      timer: 0,
      maxTimer: 0.1,
      active: p1?.hyperDashActive || false,
      unlocked: progress.upgrades.hyperDashUnlocked,
    },
    {
      id: 5,
      label: "PHASE",
      icon: "👁",
      color: "#88CCFF",
      cooldown: p1?.phaseWalkCooldown || 0,
      maxCooldown: 18 * (1 - progress.upgrades.cooldownReduction),
      timer: p1?.phaseWalkTimer || 0,
      maxTimer: 2,
      active: p1?.phaseWalkActive || false,
      unlocked: progress.upgrades.phaseWalkUnlocked,
    },
    {
      id: 6,
      label: "SLOW",
      icon: "⏱",
      color: "#4466FF",
      cooldown: p1?.timeSlowCooldown || 0,
      maxCooldown: 20 * (1 - progress.upgrades.cooldownReduction),
      timer: p1?.timeSlowTimer || 0,
      maxTimer: progress.upgrades.timeSlowDuration,
      active: p1?.timeSlowActive || false,
      unlocked: progress.upgrades.timeSlowUnlocked,
    },
    {
      id: 7,
      label: "E-SHLD",
      icon: "🔶",
      color: "#FFAA00",
      cooldown: 0,
      maxCooldown: 1,
      timer: p1?.energyShieldActive ? 1 : 0,
      maxTimer: 1,
      active: p1?.energyShieldActive || false,
      unlocked: progress.upgrades.energyShieldUnlocked,
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{
        background: "#050812",
        fontFamily: "Orbitron, monospace",
        // Heartbeat border pulse
        outline: heartbeatActive ? "3px solid rgba(255,50,50,0.6)" : "none",
      }}
    >
      {/* Canvas — always rendered */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* ── UPGRADE SHOP MODAL ───────────────── */}
      <AnimatePresence>
        {showUpgradeShop && (
          <UpgradeShop
            coins={progress.coins}
            upgrades={progress.upgrades}
            onUpgrade={handleUpgrade}
            onClose={() => setShowUpgradeShop(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MENU SCREEN ──────────────────── */}
      <AnimatePresence>
        {gamePhase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(5,8,18,0.8)" }}
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1
                className="text-3xl sm:text-5xl font-black uppercase tracking-widest mb-2"
                style={{
                  background: "linear-gradient(90deg, #00E6FF, #8A3DFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(0,230,255,0.6))",
                }}
              >
                MAZE OF ABHIMANYU
              </h1>
              <p
                className="text-sm tracking-[0.3em] uppercase"
                style={{ color: "#9AA7C0" }}
              >
                50 Ultra-Extreme Levels
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              {(["solo", "duo1v1", "duo2v1"] as GameMode[]).map((mode, i) => {
                const labels = ["SOLO MODE", "DUO 1v1", "DUO 2v1"];
                const descs = [
                  "Player vs AI",
                  "Hider vs Seeker",
                  "2 Hiders vs AI",
                ];
                const colors = ["#00E6FF", "#8A3DFF", "#FF3A4E"];
                return (
                  <motion.button
                    key={mode}
                    data-ocid={`menu.${mode}.button`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMode(mode);
                      setGamePhase("levelSelect");
                    }}
                    className="flex flex-col items-center justify-center px-8 py-4 rounded-sm relative overflow-hidden"
                    style={{
                      border: `2px solid ${colors[i]}`,
                      background: `rgba(${i === 0 ? "0,230,255" : i === 1 ? "138,61,255" : "255,58,78"},0.08)`,
                      boxShadow: `0 0 20px ${colors[i]}44, inset 0 0 20px ${colors[i]}11`,
                      minWidth: "160px",
                    }}
                  >
                    <span
                      className="text-sm font-bold tracking-widest"
                      style={{ color: colors[i] }}
                    >
                      {labels[i]}
                    </span>
                    <span className="text-xs mt-1" style={{ color: "#9AA7C0" }}>
                      {descs[i]}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Difficulty Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="flex flex-col items-center gap-2 mb-4"
            >
              <p
                className="text-[10px] tracking-widest uppercase"
                style={{ color: "#9AA7C0" }}
              >
                AI DIFFICULTY
              </p>
              <div className="flex gap-2">
                {(["easy", "hard", "extreme"] as const).map((d) => {
                  const colors = {
                    easy: "#00FF88",
                    hard: "#FFD700",
                    extreme: "#FF3A4E",
                  };
                  const descs = {
                    easy: "Basic AI",
                    hard: "Predicts You",
                    extreme: "Ultra-Smart",
                  };
                  const color = colors[d];
                  const isSelected = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      data-ocid={`menu.difficulty_${d}.button`}
                      onClick={() => setDifficulty(d)}
                      className="flex flex-col items-center px-4 py-2 rounded-sm text-xs font-bold tracking-widest transition-all"
                      style={{
                        border: `2px solid ${isSelected ? color : `${color}44`}`,
                        background: isSelected
                          ? `${color}18`
                          : "rgba(0,0,0,0.3)",
                        color: isSelected ? color : `${color}88`,
                        boxShadow: isSelected ? `0 0 12px ${color}44` : "none",
                        fontFamily: "Orbitron, monospace",
                      }}
                    >
                      <span>{d.toUpperCase()}</span>
                      <span className="text-[9px] mt-0.5 font-normal opacity-70">
                        {descs[d]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Coin display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <span className="text-sm">🪙</span>
              <span
                className="text-sm font-bold"
                style={{ color: "#FFD700", fontFamily: "Orbitron, monospace" }}
              >
                {coinDisplay} coins
              </span>
              <button
                type="button"
                data-ocid="menu.upgrades.button"
                onClick={() => setShowUpgradeShop(true)}
                className="ml-2 px-3 py-1 text-xs rounded-sm"
                style={{
                  border: "1px solid rgba(138,61,255,0.6)",
                  color: "#8A3DFF",
                  background: "rgba(138,61,255,0.1)",
                }}
              >
                UPGRADES
              </button>
            </motion.div>

            {/* Leaderboard Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="w-full max-w-md px-4 mb-1"
            >
              <button
                type="button"
                data-ocid="menu.leaderboard.button"
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-2 text-xs font-bold tracking-widest uppercase rounded-sm"
                style={{
                  border: "1px solid rgba(255,215,0,0.5)",
                  color: "#FFD700",
                  background: "rgba(255,215,0,0.06)",
                  boxShadow: "0 0 12px rgba(255,215,0,0.1)",
                }}
              >
                🏆 LEADERBOARD
              </button>
            </motion.div>

            {/* How to Play */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-md px-4"
            >
              <button
                type="button"
                data-ocid="menu.howtoplay.toggle"
                onClick={() => setShowHowToPlay((v) => !v)}
                className="w-full py-2 text-xs tracking-widest uppercase border rounded-sm mb-2"
                style={{
                  border: "1px solid rgba(0,230,255,0.3)",
                  color: "#9AA7C0",
                  background: "transparent",
                }}
              >
                {showHowToPlay
                  ? "\u25b2 HIDE INSTRUCTIONS"
                  : "\u25bc HOW TO PLAY"}
              </button>

              <AnimatePresence>
                {showHowToPlay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-4 rounded-sm text-xs leading-relaxed"
                      style={{
                        border: "1px solid rgba(0,230,255,0.2)",
                        background: "rgba(0,0,0,0.5)",
                        color: "#9AA7C0",
                      }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p
                            className="font-bold mb-1"
                            style={{ color: "#00E6FF" }}
                          >
                            HIDER (Blue)
                          </p>
                          <p>Move: WASD / Arrow keys</p>
                          <p>Ability: Q or Space</p>
                          <p>Select ability: 1-8 keys</p>
                          <p>Goal: Reach center or survive!</p>
                        </div>
                        <div>
                          <p
                            className="font-bold mb-1"
                            style={{ color: "#FF3A4E" }}
                          >
                            SEEKER (Red)
                          </p>
                          <p>AI-controlled in Solo mode</p>
                          <p>Move: IJKL (Duo 1v1)</p>
                          <p>Scan: U key</p>
                          <p>Goal: Catch the Hider!</p>
                        </div>
                      </div>
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: "1px solid rgba(0,230,255,0.15)" }}
                      >
                        <p
                          className="font-bold mb-1"
                          style={{ color: "#FFD700" }}
                        >
                          NEW MECHANICS
                        </p>
                        <p>🌀 Gravity Shift — movement direction warps</p>
                        <p>💀 Blackout — total darkness for 2.5s</p>
                        <p>🔄 Reverse Controls — inputs flip randomly</p>
                        <p>👥 Multi-Seeker — 2-3 AI hunters</p>
                        <p>⬛ Shrinking Maze — outer ring collapses</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEVEL SELECT ─────────────────── */}
      <AnimatePresence>
        {gamePhase === "levelSelect" && (
          <motion.div
            key="levelSelect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col"
            style={{ background: "rgba(5,8,18,0.95)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(0,230,255,0.2)" }}
            >
              <button
                type="button"
                data-ocid="levelselect.back.button"
                onClick={() => setGamePhase("menu")}
                className="text-xs px-3 py-2 rounded-sm"
                style={{
                  border: "1px solid rgba(0,230,255,0.4)",
                  color: "#9AA7C0",
                  background: "transparent",
                }}
              >
                ← BACK
              </button>
              <div className="text-center">
                <h2
                  className="text-lg font-black tracking-widest"
                  style={{
                    color: "#00E6FF",
                    fontFamily: "Orbitron, monospace",
                    textShadow: "0 0 15px #00E6FF",
                  }}
                >
                  SELECT LEVEL
                </h2>
                <p className="text-[10px]" style={{ color: "#9AA7C0" }}>
                  Mode: {modeLabel} · {progress.unlockedLevels.length}/50
                  unlocked
                </p>
              </div>
              <button
                type="button"
                data-ocid="levelselect.upgrades.button"
                onClick={() => setShowUpgradeShop(true)}
                className="text-xs px-3 py-2 rounded-sm"
                style={{
                  border: "1px solid rgba(138,61,255,0.5)",
                  color: "#8A3DFF",
                  background: "rgba(138,61,255,0.1)",
                }}
              >
                🪙 {progress.coins} · UPGRADES
              </button>
            </div>

            {/* Level grid with tier groups */}
            <div className="flex-1 overflow-y-auto p-4">
              {TIER_GROUPS.map((tier) => {
                const tierLevels = LEVEL_CONFIGS.filter(
                  (cfg) => cfg.id >= tier.range[0] && cfg.id <= tier.range[1],
                );
                return (
                  <div key={tier.label} className="mb-6">
                    <div
                      className="flex items-center gap-3 mb-3 px-1"
                      style={{ borderBottom: `1px solid ${tier.color}44` }}
                    >
                      <h3
                        className="text-sm font-black tracking-widest pb-2"
                        style={{
                          color: tier.color,
                          fontFamily: "Orbitron, monospace",
                          textShadow: `0 0 12px ${tier.color}`,
                        }}
                      >
                        {tier.label}
                      </h3>
                      <span
                        className="text-[10px] pb-2"
                        style={{ color: "#555" }}
                      >
                        L{tier.range[0]}–{tier.range[1]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {tierLevels.map((cfg) => {
                        const locked = !progress.unlockedLevels.includes(
                          cfg.id,
                        );
                        const globalIdx = cfg.id;
                        return (
                          <LevelCard
                            key={cfg.id}
                            config={cfg}
                            locked={locked}
                            bestTime={progress.bestTimes[cfg.id]}
                            onClick={() => startGame(selectedMode, cfg.id)}
                            dataOcid={`levelselect.level.item.${globalIdx}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME HUD ────────────────────── */}
      {(gamePhase === "playing" || gamePhase === "paused") && (
        <>
          {/* Top HUD */}
          <div
            data-ocid="hud.panel"
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(5,8,18,0.9) 0%, transparent 100%)",
              borderBottom: heartbeatActive
                ? "1px solid rgba(255,50,50,0.6)"
                : "1px solid rgba(0,230,255,0.15)",
              transition: "border-color 0.3s",
            }}
          >
            {/* Left: level badge + mode */}
            <div className="flex items-center gap-2">
              <div
                data-ocid="hud.level.panel"
                className="flex flex-col items-center px-2 py-0.5 rounded-sm text-xs font-bold"
                style={{
                  background: `${getLevelBorderColor(selectedLevelId)}22`,
                  border: `1px solid ${getLevelBorderColor(selectedLevelId)}`,
                  color: getLevelBorderColor(selectedLevelId),
                  fontFamily: "Orbitron, monospace",
                }}
              >
                <span>LVL {selectedLevelId}</span>
                <span className="text-[9px] opacity-60">
                  {difficulty.toUpperCase()}
                </span>
              </div>
              <span
                className="text-[10px] hidden sm:block"
                style={{ color: "#9AA7C0" }}
              >
                {currentLevelConfig.name}
              </span>
            </div>

            {/* Center: timer + status indicators */}
            <div className="flex flex-col items-center">
              <div
                data-ocid="hud.timer.panel"
                className="text-2xl sm:text-3xl font-black tabular-nums"
                style={{
                  color:
                    timeLeft < 15
                      ? "#FF3A4E"
                      : timeLeft < 30
                        ? "#FF8C00"
                        : "#00E6FF",
                  textShadow: `0 0 20px ${timeLeft < 15 ? "#FF3A4E" : "#00E6FF"}`,
                  animation:
                    timeLeft < 10
                      ? "pulse 0.5s ease-in-out infinite"
                      : undefined,
                }}
              >
                {formatTime(timeLeft)}
              </div>
              <div
                className="text-[9px] tracking-widest"
                style={{ color: "#9AA7C0" }}
              >
                {modeLabel}
              </div>
            </div>

            {/* Right: coins + pause */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1">
                <span className="text-xs">🪙</span>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: "#FFD700",
                    fontFamily: "Orbitron, monospace",
                  }}
                >
                  {coinDisplay}
                </span>
              </div>
              <button
                type="button"
                data-ocid="hud.pause.button"
                onClick={togglePause}
                className="text-xs px-3 py-1 rounded-sm border tracking-widest"
                style={{
                  border: "1px solid rgba(0,230,255,0.4)",
                  color: "#9AA7C0",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                {gamePhase === "paused" ? "▶ RESUME" : "⏸ PAUSE"}
              </button>
            </div>
          </div>

          {/* ── STATUS WARNING BANNERS ── */}
          <AnimatePresence>
            {reverseControlsActive && (
              <motion.div
                key="reverse-warning"
                data-ocid="hud.reverse_warning.panel"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1 rounded-sm text-xs font-bold tracking-widest pointer-events-none"
                style={{
                  background: "rgba(255,50,50,0.85)",
                  border: "1px solid #FF3A4E",
                  color: "#FFFFFF",
                  fontFamily: "Orbitron, monospace",
                  zIndex: 30,
                }}
              >
                ⚠ CONTROLS REVERSED
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gravityShiftActive && !blackoutActive && (
              <motion.div
                key="gravity-warning"
                data-ocid="hud.gravity_warning.panel"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 px-3 py-1 rounded-sm text-xs tracking-widest pointer-events-none"
                style={{
                  background: "rgba(255,220,0,0.2)",
                  border: "1px solid rgba(255,220,0,0.6)",
                  color: "#FFDD00",
                  fontFamily: "Orbitron, monospace",
                  zIndex: 30,
                }}
              >
                🌀 GRAVITY SHIFT
              </motion.div>
            )}
          </AnimatePresence>

          {/* Power buttons — right side */}
          {!isP1Seeker && (
            <div
              className="absolute right-3 flex flex-col gap-2 pointer-events-auto"
              style={{ top: "50%", transform: "translateY(-50%)", zIndex: 20 }}
            >
              {p1Abilities
                .filter((ab) => ab.unlocked)
                .map((ab) => (
                  <PowerButton
                    key={ab.id}
                    label={ab.label}
                    icon={ab.icon}
                    cooldown={ab.cooldown}
                    maxCooldown={ab.maxCooldown}
                    timer={ab.timer}
                    maxTimer={ab.maxTimer}
                    active={ab.active}
                    selected={p1SelectedAbility === ab.id}
                    color={ab.color}
                    onClick={() => cycleAbility(ab.id)}
                    dataOcid={`power.${ab.label.toLowerCase()}.button`}
                  />
                ))}
              {/* USE button on mobile */}
              {isTouchDevice && (
                <button
                  type="button"
                  data-ocid="power.use.button"
                  onClick={handleP1Ability}
                  className="mt-1 py-2 rounded-sm text-xs font-bold tracking-widest"
                  style={{
                    border: "1px solid #00E6FF",
                    color: "#00E6FF",
                    background: "rgba(0,230,255,0.15)",
                    minWidth: "56px",
                  }}
                >
                  USE
                </button>
              )}
              {/* Cycle button on mobile */}
              {isTouchDevice && (
                <button
                  type="button"
                  data-ocid="power.cycle.button"
                  onClick={handleCycleAbility}
                  className="py-1.5 rounded-sm text-[10px] tracking-widest"
                  style={{
                    border: "1px solid rgba(0,230,255,0.3)",
                    color: "#9AA7C0",
                    background: "rgba(0,0,0,0.4)",
                    minWidth: "56px",
                  }}
                >
                  CYCLE
                </button>
              )}
            </div>
          )}

          {/* Seeker scan button */}
          {isP1Seeker && (
            <div
              className="absolute right-3 flex flex-col gap-3 pointer-events-auto"
              style={{ top: "50%", transform: "translateY(-50%)", zIndex: 20 }}
            >
              <PowerButton
                label="SCAN"
                icon="📡"
                cooldown={seekerScanCooldown}
                maxCooldown={15}
                timer={seekerScanTimer}
                maxTimer={2}
                active={seekerPlayer?.scanActive || false}
                selected
                color="#FF3A4E"
                onClick={handleP1Ability}
                dataOcid="power.scan.button"
              />
            </div>
          )}

          {/* Joystick — bottom left */}
          {isTouchDevice && (
            <div
              className="absolute bottom-16 left-8 pointer-events-auto"
              style={{ zIndex: 20 }}
            >
              <JoystickComponent onJoystickChange={handleJoystickChange} />
            </div>
          )}
        </>
      )}

      {/* ── PAUSE OVERLAY ────────────────── */}
      <AnimatePresence>
        {gamePhase === "paused" && (
          <motion.div
            key="pause"
            data-ocid="pause.modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "rgba(5,8,18,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-6 p-8 rounded-sm"
              style={{
                border: "2px solid rgba(0,230,255,0.4)",
                background: "rgba(5,8,18,0.95)",
                boxShadow: "0 0 40px rgba(0,230,255,0.2)",
                minWidth: "240px",
              }}
            >
              <h2
                className="text-3xl font-black tracking-widest"
                style={{ color: "#00E6FF", textShadow: "0 0 20px #00E6FF" }}
              >
                PAUSED
              </h2>
              <div className="text-xs text-center" style={{ color: "#9AA7C0" }}>
                Level {selectedLevelId}: {currentLevelConfig.name}
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  data-ocid="pause.resume.button"
                  onClick={togglePause}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid #00E6FF",
                    color: "#00E6FF",
                    background: "rgba(0,230,255,0.1)",
                  }}
                >
                  ▶ RESUME
                </button>
                <button
                  type="button"
                  data-ocid="pause.restart.button"
                  onClick={restartGame}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid #8A3DFF",
                    color: "#8A3DFF",
                    background: "rgba(138,61,255,0.1)",
                  }}
                >
                  ↺ RESTART
                </button>
                <button
                  type="button"
                  data-ocid="pause.levelselect.button"
                  onClick={() => {
                    stopAllMusic();
                    stopHeartbeat();
                    gameStateRef.current = null;
                    setGamePhase("levelSelect");
                  }}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid rgba(154,167,192,0.4)",
                    color: "#9AA7C0",
                    background: "rgba(0,0,0,0.3)",
                  }}
                >
                  ☰ LEVELS
                </button>
                <button
                  type="button"
                  data-ocid="pause.mainmenu.button"
                  onClick={goToMenu}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid rgba(100,100,120,0.4)",
                    color: "#666",
                    background: "rgba(0,0,0,0.3)",
                  }}
                >
                  ⌂ MAIN MENU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME OVER SCREEN ──────────────── */}
      <AnimatePresence>
        {gamePhase === "gameover" && (
          <motion.div
            key="gameover"
            data-ocid="gameover.modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "rgba(5,8,18,0.88)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center gap-5 p-8 rounded-sm"
              style={{
                border: `2px solid ${winner === "hider" ? "#00E6FF" : "#FF3A4E"}`,
                background: "rgba(5,8,18,0.98)",
                boxShadow: `0 0 60px ${winner === "hider" ? "rgba(0,230,255,0.3)" : "rgba(255,58,78,0.3)"}`,
                minWidth: "280px",
                maxWidth: "360px",
              }}
            >
              <div className="text-5xl">{winner === "hider" ? "🔵" : "🔴"}</div>
              <h2
                className="text-2xl font-black tracking-widest text-center"
                style={{
                  color: winner === "hider" ? "#00E6FF" : "#FF3A4E",
                  textShadow: `0 0 30px ${winner === "hider" ? "#00E6FF" : "#FF3A4E"}`,
                }}
              >
                {winner === "hider" ? "HIDER WINS!" : "SEEKER WINS!"}
              </h2>

              {/* Level info */}
              <p className="text-xs" style={{ color: "#9AA7C0" }}>
                Level {selectedLevelId}: {currentLevelConfig.name}
              </p>

              {/* Coins earned */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-center gap-2 px-4 py-2 rounded-sm"
                style={{
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid rgba(255,215,0,0.4)",
                }}
              >
                <span className="text-lg">🪙</span>
                <span
                  className="font-bold text-lg"
                  style={{
                    color: "#FFD700",
                    fontFamily: "Orbitron, monospace",
                  }}
                >
                  +{coinsEarnedThisRound} coins
                </span>
              </motion.div>

              {/* New level unlocked */}
              {newLevelUnlocked && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center px-3 py-2 rounded-sm"
                  style={{
                    border: "1px solid rgba(0,255,136,0.6)",
                    background: "rgba(0,255,136,0.08)",
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: "#00FF88" }}>
                    🔓 LEVEL {newLevelUnlocked} UNLOCKED!
                  </p>
                  <p className="text-[10px]" style={{ color: "#9AA7C0" }}>
                    {LEVEL_CONFIGS.find((l) => l.id === newLevelUnlocked)?.name}
                  </p>
                </motion.div>
              )}

              {/* ── Save Score UI ── */}
              <div
                className="w-full rounded-sm p-4"
                style={{
                  border: "1px solid rgba(0,230,255,0.2)",
                  background: "rgba(0,230,255,0.04)",
                }}
              >
                {!scoreSaved ? (
                  <div className="flex flex-col gap-2">
                    <p
                      className="text-xs text-center tracking-wider uppercase"
                      style={{ color: "#9AA7C0" }}
                    >
                      Save your score
                    </p>
                    <input
                      type="text"
                      data-ocid="gameover.name.input"
                      placeholder="Enter your name..."
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      maxLength={20}
                      className="w-full px-3 py-2 text-sm rounded-sm outline-none"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(0,230,255,0.3)",
                        color: "#E8EDF5",
                        fontFamily: "inherit",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && playerNameInput.trim()) {
                          const levelTimeLimit =
                            LEVEL_CONFIGS.find((l) => l.id === selectedLevelId)
                              ?.timeLimit ?? 90;
                          const score =
                            winner === "hider"
                              ? timeLeft
                              : levelTimeLimit - timeLeft;
                          saveScore({
                            playerName: playerNameInput.trim(),
                            score: Math.max(0, Math.floor(score)),
                            mode: getModeLabel(selectedMode),
                            levelId: selectedLevelId,
                            won: winner === "hider",
                            date: new Date().toISOString(),
                          });
                          setScoreSaved(true);
                        }
                      }}
                    />
                    <button
                      type="button"
                      data-ocid="gameover.save_score.button"
                      disabled={!playerNameInput.trim()}
                      onClick={() => {
                        const levelTimeLimit =
                          LEVEL_CONFIGS.find((l) => l.id === selectedLevelId)
                            ?.timeLimit ?? 90;
                        const score =
                          winner === "hider"
                            ? timeLeft
                            : levelTimeLimit - timeLeft;
                        saveScore({
                          playerName: playerNameInput.trim(),
                          score: Math.max(0, Math.floor(score)),
                          mode: getModeLabel(selectedMode),
                          levelId: selectedLevelId,
                          won: winner === "hider",
                          date: new Date().toISOString(),
                        });
                        setScoreSaved(true);
                      }}
                      className="w-full py-2 text-xs font-bold tracking-widest uppercase rounded-sm transition-all"
                      style={{
                        border: "1px solid rgba(0,230,255,0.5)",
                        color: playerNameInput.trim()
                          ? "#00E6FF"
                          : "rgba(154,167,192,0.4)",
                        background: playerNameInput.trim()
                          ? "rgba(0,230,255,0.12)"
                          : "rgba(0,0,0,0.2)",
                        cursor: playerNameInput.trim()
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      💾 Save Score
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#00FF88" }}
                    >
                      ✅ Score saved!
                    </p>
                    <button
                      type="button"
                      data-ocid="gameover.view_leaderboard.button"
                      onClick={() => setShowLeaderboard(true)}
                      className="px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-sm"
                      style={{
                        border: "1px solid rgba(255,215,0,0.6)",
                        color: "#FFD700",
                        background: "rgba(255,215,0,0.1)",
                        boxShadow: "0 0 12px rgba(255,215,0,0.2)",
                      }}
                    >
                      🏆 View Leaderboard
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  data-ocid="gameover.playagain.button"
                  onClick={restartGame}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid #00E6FF",
                    color: "#00E6FF",
                    background: "rgba(0,230,255,0.1)",
                  }}
                >
                  PLAY AGAIN
                </button>
                <button
                  type="button"
                  data-ocid="gameover.levelselect.button"
                  onClick={() => {
                    gameStateRef.current = null;
                    setGamePhase("levelSelect");
                  }}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid #8A3DFF",
                    color: "#8A3DFF",
                    background: "rgba(138,61,255,0.1)",
                  }}
                >
                  ☰ LEVELS
                </button>
                <button
                  type="button"
                  data-ocid="gameover.mainmenu.button"
                  onClick={goToMenu}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid rgba(154,167,192,0.4)",
                    color: "#9AA7C0",
                    background: "rgba(0,0,0,0.3)",
                  }}
                >
                  MAIN MENU
                </button>
                <button
                  type="button"
                  data-ocid="gameover.leaderboard.button"
                  onClick={() => setShowLeaderboard(true)}
                  className="py-3 text-sm font-bold tracking-widest uppercase rounded-sm"
                  style={{
                    border: "1px solid rgba(255,215,0,0.5)",
                    color: "#FFD700",
                    background: "rgba(255,215,0,0.08)",
                  }}
                >
                  🏆 LEADERBOARD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 text-center py-1 pointer-events-none"
        style={{
          fontSize: "9px",
          color: "rgba(100,110,130,0.5)",
          display: gamePhase === "playing" ? "none" : "block",
        }}
      >
        © {new Date().getFullYear()}. Built with ❤ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          className="pointer-events-auto"
          style={{ color: "rgba(0,230,255,0.4)" }}
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
