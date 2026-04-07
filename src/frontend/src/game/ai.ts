// ============================================================
// AI Seeker — BFS-guided pathfinding with pattern prediction
// ============================================================

import { isInGap } from "./maze";
import type { AIState, LevelConfig, MazeData, Player } from "./types";

const TWO_PI = Math.PI * 2;
const SECTORS_PER_RING = 24;

function worldToNode(
  x: number,
  y: number,
  maze: MazeData,
): { ring: number; sector: number } | null {
  const dist = Math.sqrt(x * x + y * y);
  const angle = ((Math.atan2(y, x) % TWO_PI) + TWO_PI) % TWO_PI;
  const sector = Math.floor((angle / TWO_PI) * SECTORS_PER_RING);

  if (dist < maze.innerPadding) {
    return { ring: -1, sector };
  }

  for (let i = 0; i < maze.rings.length; i++) {
    const ring = maze.rings[i];
    if (dist >= ring.innerRadius && dist <= ring.outerRadius) {
      return { ring: i, sector };
    }
  }
  return null;
}

function nodeToWorld(
  ring: number,
  sector: number,
  maze: MazeData,
): { x: number; y: number } {
  const angle = ((sector + 0.5) / SECTORS_PER_RING) * TWO_PI;

  if (ring < 0) {
    const r = maze.innerPadding * 0.5;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  const r = (maze.rings[ring].innerRadius + maze.rings[ring].outerRadius) / 2;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}

function canMoveBetween(
  fromRing: number,
  fromSector: number,
  toRing: number,
  _toSector: number,
  maze: MazeData,
): boolean {
  if (fromRing === toRing) return true;

  const angle = ((fromSector + 0.5) / SECTORS_PER_RING) * TWO_PI;
  const lowerRing = Math.min(fromRing, toRing);
  if (lowerRing < 0 || lowerRing >= maze.rings.length) return true;

  const ring = maze.rings[lowerRing];
  return isInGap(angle, ring);
}

export function createAIState(): AIState {
  return {
    pathRingIndex: -1,
    pathSector: 0,
    recalcTimer: 0,
    waypoints: [],
    wanderTimer: 0,
    patternMemory: [],
    predictedEscapeX: 0,
    predictedEscapeY: 0,
    aggressionLevel: 0.3,
  };
}

export function createMultipleAIStates(count: number): AIState[] {
  const states: AIState[] = [];
  for (let i = 0; i < count; i++) {
    states.push(createAIState());
  }
  return states;
}

export function updateAI(
  seeker: Player,
  targets: Player[],
  maze: MazeData,
  ai: AIState,
  dt: number,
  config: LevelConfig,
): { ax: number; ay: number; useAbility: boolean } {
  ai.recalcTimer -= dt;
  ai.wanderTimer -= dt;

  // Scale aggression by level
  ai.aggressionLevel = Math.min(1, config.id / 30);
  const recalcInterval = 0.5 - ai.aggressionLevel * 0.3;

  const visibleTargets = targets.filter((t) => !t.isInvisible && t.isAlive);
  const target = visibleTargets.length > 0 ? visibleTargets[0] : null;

  let targetX: number;
  let targetY: number;

  if (target) {
    // Store position to pattern memory
    ai.patternMemory.push({ x: target.x, y: target.y, t: Date.now() });
    if (ai.patternMemory.length > 20) ai.patternMemory.shift();

    // Advanced prediction using pattern memory
    if (ai.patternMemory.length >= 5) {
      const recent = ai.patternMemory.slice(-5);
      let avgVx = 0;
      let avgVy = 0;
      for (let i = 1; i < recent.length; i++) {
        const dt2 = (recent[i].t - recent[i - 1].t) / 1000;
        if (dt2 > 0) {
          avgVx += (recent[i].x - recent[i - 1].x) / dt2;
          avgVy += (recent[i].y - recent[i - 1].y) / dt2;
        }
      }
      avgVx /= recent.length - 1;
      avgVy /= recent.length - 1;

      const predTime = 1.5 * ai.aggressionLevel + 0.5;
      ai.predictedEscapeX = target.x + avgVx * predTime;
      ai.predictedEscapeY = target.y + avgVy * predTime;
      targetX = ai.predictedEscapeX;
      targetY = ai.predictedEscapeY;
    } else {
      // Basic prediction
      targetX = target.x + target.vx * 0.5;
      targetY = target.y + target.vy * 0.5;
    }

    if (ai.recalcTimer <= 0) {
      ai.recalcTimer = recalcInterval;
      const path = bfsPath(seeker.x, seeker.y, targetX, targetY, maze);
      ai.waypoints = path;
    }
  } else {
    const lastTarget = targets[0];
    const lkx = lastTarget ? lastTarget.lastKnownX : 0;
    const lky = lastTarget ? lastTarget.lastKnownY : 0;

    const dx = seeker.x - lkx;
    const dy = seeker.y - lky;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30 || ai.wanderTimer <= 0) {
      seeker.wanderAngle += (Math.random() - 0.5) * 2;
      ai.wanderTimer = 1.5;
    }

    targetX = seeker.x + Math.cos(seeker.wanderAngle) * 80;
    targetY = seeker.y + Math.sin(seeker.wanderAngle) * 80;
    ai.waypoints = [{ x: targetX, y: targetY }];
  }

  const wp = ai.waypoints[0] || { x: targetX!, y: targetY! };
  const dx = wp.x - seeker.x;
  const dy = wp.y - seeker.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 20 && ai.waypoints.length > 1) {
    ai.waypoints.shift();
  }

  let ax = 0;
  let ay = 0;
  if (dist > 5) {
    const mult = Math.min(config.seekerSpeedMult * 1.2, 4.0);
    ax = (dx / dist) * mult;
    ay = (dy / dist) * mult;
  }

  // Scan range scales with level
  const scanRadius = 120 + (config.id - 1) * 15;

  let useAbility = false;
  if (seeker.scanCooldown <= 0 && !seeker.scanActive) {
    if (target) {
      const tdx = target.x - seeker.x;
      const tdy = target.y - seeker.y;
      const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
      // Aggression increases scan probability
      const scanProb = 0.05 + ai.aggressionLevel * 0.1;
      if (tDist < scanRadius) {
        useAbility = Math.random() < scanProb;
      }
    } else {
      useAbility = Math.random() < 0.01 + ai.aggressionLevel * 0.02;
    }
  }

  return { ax, ay, useAbility };
}

function bfsPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  maze: MazeData,
): { x: number; y: number }[] {
  const startNode = worldToNode(sx, sy, maze);
  const endNode = worldToNode(tx, ty, maze);

  if (!startNode || !endNode) return [{ x: tx, y: ty }];
  if (startNode.ring === endNode.ring && startNode.sector === endNode.sector) {
    return [{ x: tx, y: ty }];
  }

  const numRings = maze.rings.length;
  const key = (ring: number, sector: number) => `${ring},${sector}`;
  const visited = new Set<string>();
  const queue: {
    ring: number;
    sector: number;
    path: { ring: number; sector: number }[];
  }[] = [];

  queue.push({ ring: startNode.ring, sector: startNode.sector, path: [] });
  visited.add(key(startNode.ring, startNode.sector));

  let iterations = 0;

  while (queue.length > 0 && iterations < 500) {
    iterations++;
    const current = queue.shift()!;
    const newPath = [
      ...current.path,
      { ring: current.ring, sector: current.sector },
    ];

    if (current.ring === endNode.ring && current.sector === endNode.sector) {
      return newPath.slice(1).map((n) => nodeToWorld(n.ring, n.sector, maze));
    }

    const prevSector =
      (current.sector - 1 + SECTORS_PER_RING) % SECTORS_PER_RING;
    const nextSector = (current.sector + 1) % SECTORS_PER_RING;

    for (const ns of [prevSector, nextSector]) {
      const nk = key(current.ring, ns);
      if (
        !visited.has(nk) &&
        canMoveBetween(current.ring, current.sector, current.ring, ns, maze)
      ) {
        visited.add(nk);
        queue.push({ ring: current.ring, sector: ns, path: newPath });
      }
    }

    const innerRing = current.ring - 1;
    const outerRing = current.ring + 1;

    for (const nr of [innerRing, outerRing]) {
      if (nr < -1 || nr >= numRings) continue;
      const nk = key(nr, current.sector);
      if (
        !visited.has(nk) &&
        canMoveBetween(current.ring, current.sector, nr, current.sector, maze)
      ) {
        visited.add(nk);
        queue.push({ ring: nr, sector: current.sector, path: newPath });
      }
    }
  }

  return [{ x: tx, y: ty }];
}
