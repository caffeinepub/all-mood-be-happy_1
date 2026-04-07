// ============================================================
// Smart AI — Easy / Hard / Extreme difficulty behaviors
// ============================================================

import { createAIState, updateAI } from "./ai";
import type {
  AIState,
  Difficulty,
  LevelConfig,
  MazeData,
  Player,
} from "./types";

const TWO_PI = Math.PI * 2;

// Per-seeker extra state for hard/extreme behaviors
interface SmartAIExtra {
  pathMemory: { x: number; y: number }[];
  jitterTimer: number;
  jitterDx: number;
  jitterDy: number;
  scanAutoTimer: number;
  lastRecalcTimer: number;
}

const extraStateMap = new WeakMap<AIState, SmartAIExtra>();

function getExtra(ai: AIState): SmartAIExtra {
  if (!extraStateMap.has(ai)) {
    extraStateMap.set(ai, {
      pathMemory: [],
      jitterTimer: 0,
      jitterDx: 0,
      jitterDy: 0,
      scanAutoTimer: 0,
      lastRecalcTimer: 0,
    });
  }
  return extraStateMap.get(ai)!;
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function updateSmartAI(
  difficulty: Difficulty,
  seeker: Player,
  targets: Player[],
  maze: MazeData,
  ai: AIState,
  dt: number,
  config: LevelConfig,
): { ax: number; ay: number; useAbility: boolean } {
  // Easy: delegate to base AI
  if (difficulty === "easy") {
    return updateAI(seeker, targets, maze, ai, dt, config);
  }

  const extra = getExtra(ai);
  const speedMult = difficulty === "extreme" ? 1.6 : 1.3;

  // Advance timers
  extra.scanAutoTimer -= dt;
  extra.jitterTimer -= dt;
  extra.lastRecalcTimer -= dt;

  const visibleTargets = targets.filter((t) => !t.isInvisible && t.isAlive);
  const target = visibleTargets.length > 0 ? visibleTargets[0] : null;
  const anyTarget = targets.find((t) => t.isAlive);

  let predictX: number;
  let predictY: number;

  if (target) {
    // Update last known for invisible logic
    seeker.lastKnownX = target.x;
    seeker.lastKnownY = target.y;

    // Prediction lookahead differs by difficulty
    const lookahead = difficulty === "extreme" ? 0.8 : 0.3;
    predictX = target.x + target.vx * lookahead;
    predictY = target.y + target.vy * lookahead;

    // Store pattern memory
    ai.patternMemory.push({ x: target.x, y: target.y, t: Date.now() });
    if (ai.patternMemory.length > 20) ai.patternMemory.shift();
  } else if (anyTarget) {
    // Move to last known position
    predictX = anyTarget.lastKnownX || 0;
    predictY = anyTarget.lastKnownY || 0;

    // If at last known, wander in extreme mode
    if (difficulty === "extreme") {
      const dSq = distSq(seeker.x, seeker.y, predictX, predictY);
      if (dSq < 40 * 40) {
        seeker.wanderAngle += (Math.random() - 0.5) * 1.5;
        predictX = seeker.x + Math.cos(seeker.wanderAngle) * 60;
        predictY = seeker.y + Math.sin(seeker.wanderAngle) * 60;
      }
    }
  } else {
    predictX = 0;
    predictY = 0;
  }

  // Hard: avoid trap zones near next step
  if (difficulty === "hard") {
    const dx = predictX - seeker.x;
    const dy = predictY - seeker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      const stepX = seeker.x + (dx / dist) * 20;
      const stepY = seeker.y + (dy / dist) * 20;
      const stepDist = Math.sqrt(stepX * stepX + stepY * stepY);
      const stepAngle = ((Math.atan2(stepY, stepX) % TWO_PI) + TWO_PI) % TWO_PI;
      let inTrap = false;
      for (const zone of maze.zones) {
        if (zone.type !== "trap" && zone.type !== "fire") continue;
        const ring = maze.rings[zone.ringIndex];
        if (!ring) continue;
        if (stepDist >= ring.innerRadius && stepDist <= ring.outerRadius) {
          const localA =
            (((stepAngle - ring.rotationAngle) % TWO_PI) + TWO_PI) % TWO_PI;
          if (zone.startAngle <= zone.endAngle) {
            if (localA >= zone.startAngle && localA <= zone.endAngle) {
              inTrap = true;
              break;
            }
          } else {
            if (localA >= zone.startAngle || localA <= zone.endAngle) {
              inTrap = true;
              break;
            }
          }
        }
      }
      // Deflect slightly if trap ahead
      if (inTrap) {
        predictX += Math.cos(seeker.wanderAngle + Math.PI / 2) * 40;
        predictY += Math.sin(seeker.wanderAngle + Math.PI / 2) * 40;
      }
    }
  }

  // Hard: path memory — avoid recently visited positions
  extra.pathMemory.push({ x: seeker.x, y: seeker.y });
  if (extra.pathMemory.length > 10) extra.pathMemory.shift();

  // Extreme: add micro-jitter movement
  let jitterX = 0;
  let jitterY = 0;
  if (difficulty === "extreme" && extra.jitterTimer <= 0) {
    extra.jitterDx = (Math.random() - 0.5) * 10;
    extra.jitterDy = (Math.random() - 0.5) * 10;
    extra.jitterTimer = 0.5;
  }
  if (difficulty === "extreme") {
    jitterX = extra.jitterDx;
    jitterY = extra.jitterDy;
  }

  // Direction to target
  const dx = predictX + jitterX - seeker.x;
  const dy = predictY + jitterY - seeker.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let ax = 0;
  let ay = 0;
  if (dist > 5) {
    ax = (dx / dist) * speedMult * config.seekerSpeedMult;
    ay = (dy / dist) * speedMult * config.seekerSpeedMult;
  }

  // Auto-scan for extreme mode
  let useAbility = false;
  if (
    difficulty === "extreme" &&
    extra.scanAutoTimer <= 0 &&
    !seeker.scanActive &&
    seeker.scanCooldown <= 0
  ) {
    useAbility = true;
    extra.scanAutoTimer = 8;
  } else if (
    difficulty !== "extreme" &&
    seeker.scanCooldown <= 0 &&
    !seeker.scanActive
  ) {
    // Hard: probabilistic scan
    if (target) {
      const tDist = Math.sqrt(distSq(seeker.x, seeker.y, target.x, target.y));
      if (tDist < 160 && Math.random() < 0.04) useAbility = true;
    } else {
      if (Math.random() < 0.01) useAbility = true;
    }
  }

  return { ax, ay, useAbility };
}

// Re-export createAIState for convenience
export { createAIState };
