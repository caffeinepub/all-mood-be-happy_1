// ============================================================
// Maze Generation — Concentric Ring Chakravyuh (50-level edition)
// ============================================================

import type {
  Gate,
  LevelConfig,
  MazeData,
  Ring,
  WallSegment,
  Zone,
} from "./types";

const TWO_PI = Math.PI * 2;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createGate(
  ringIndex: number,
  startAngle: number,
  gateSpan: number,
  openDuration: number,
  closedDuration: number,
): Gate {
  const isOpen = Math.random() > 0.4;
  return {
    ringIndex,
    startAngle,
    endAngle: startAngle + gateSpan,
    isOpen,
    openTimer: isOpen
      ? randomBetween(1, openDuration)
      : randomBetween(1, closedDuration),
    openDuration,
    closedDuration,
    openAmount: isOpen ? 1 : 0,
  };
}

function computeWallSegments(
  gates: Gate[],
  hasFakeWalls: boolean,
): WallSegment[] {
  if (gates.length === 0)
    return [
      { startAngle: 0, endAngle: TWO_PI, isFake: false, isVisible: true },
    ];

  const sorted = [...gates].sort((a, b) => a.startAngle - b.startAngle);
  const walls: WallSegment[] = [];

  let prevEnd = 0;
  for (const gate of sorted) {
    if (gate.startAngle > prevEnd + 0.01) {
      const isFake = hasFakeWalls && Math.random() < 0.3;
      walls.push({
        startAngle: prevEnd,
        endAngle: gate.startAngle,
        isFake,
        isVisible: true,
      });
    }
    prevEnd = gate.endAngle;
  }

  if (prevEnd < TWO_PI - 0.01) {
    const isFake = hasFakeWalls && Math.random() < 0.3;
    walls.push({
      startAngle: prevEnd,
      endAngle: TWO_PI,
      isFake,
      isVisible: true,
    });
  }

  return walls;
}

export function generateMaze(numRings: number, config: LevelConfig): MazeData {
  const ringThickness = 28;
  const innerPadding = 40;
  const rings: Ring[] = [];
  const zones: Zone[] = [];

  const ringColors = [
    "#00E6FF",
    "#8A3DFF",
    "#00E6FF",
    "#8A3DFF",
    "#00E6FF",
    "#8A3DFF",
    "#00E6FF",
  ];

  for (let i = 0; i < numRings; i++) {
    const innerR = innerPadding + i * (ringThickness + 6);
    const outerR = innerR + ringThickness;

    const numGates = 2 + Math.floor(Math.random() * 3);
    const gateSpan = TWO_PI / (numGates * 3.5);
    const sectorSize = TWO_PI / numGates;

    const gates: Gate[] = [];
    for (let g = 0; g < numGates; g++) {
      const baseAngle = g * sectorSize;
      const offset = randomBetween(0, sectorSize - gateSpan);
      const openDur = randomBetween(2, 8) / config.gateSpeedMult;
      const closedDur = randomBetween(2, 8) / config.gateSpeedMult;
      gates.push(
        createGate(i, baseAngle + offset, gateSpan, openDur, closedDur),
      );
    }

    if (!gates.some((g) => g.isOpen)) {
      gates[0].isOpen = true;
      gates[0].openAmount = 1;
    }

    const wallSegments = computeWallSegments(gates, config.hasFakeWalls);

    const baseRotSpeed = randomBetween(0.15, 0.35) * (i % 2 === 0 ? 1 : -1);
    const rotSpeed = baseRotSpeed * config.rotationSpeedMult;

    rings.push({
      innerRadius: innerR,
      outerRadius: outerR,
      color: ringColors[i % ringColors.length],
      rotationAngle: randomBetween(0, TWO_PI),
      rotationSpeed: rotSpeed,
      gates,
      wallSegments,
    });

    // Safe zones
    const numSafe = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSafe; s++) {
      const startA = randomBetween(0, TWO_PI - 0.4);
      zones.push({
        ringIndex: i,
        startAngle: startA,
        endAngle: startA + 0.3 + Math.random() * 0.3,
        type: "safe",
      });
    }

    // Trap zones
    const numTrap = 2 + Math.floor(Math.random() * 2);
    for (let t = 0; t < numTrap; t++) {
      const startA = randomBetween(0, TWO_PI - 0.4);
      zones.push({
        ringIndex: i,
        startAngle: startA,
        endAngle: startA + 0.25 + Math.random() * 0.25,
        type: "trap",
      });
    }

    // Fire zones
    if (config.hasMovingFireZones) {
      const numFire = 2 + Math.floor(Math.random() * 2);
      for (let f = 0; f < numFire; f++) {
        const startA = randomBetween(0, TWO_PI - 0.5);
        const dir = Math.random() > 0.5 ? 1 : -1;
        zones.push({
          ringIndex: i,
          startAngle: startA,
          endAngle: startA + 0.4 + Math.random() * 0.3,
          type: "fire",
          angularVelocity: dir * randomBetween(0.3, 0.8),
        });
      }
    }

    // Freeze zones
    if (config.timeFreezeZones) {
      const numFreeze = 2 + Math.floor(Math.random() * 2);
      for (let fz = 0; fz < numFreeze; fz++) {
        const startA = randomBetween(0, TWO_PI - 0.4);
        zones.push({
          ringIndex: i,
          startAngle: startA,
          endAngle: startA + 0.3 + Math.random() * 0.2,
          type: "freeze",
        });
      }
    }
  }

  return { rings, zones, numRings, ringThickness, innerPadding };
}

let disappearAccumulator = 0;

export function updateMaze(
  maze: MazeData,
  dt: number,
  config: LevelConfig,
): void {
  // Disappearing walls timer
  if (config.hasFakeWalls) {
    disappearAccumulator += dt;
    if (disappearAccumulator > randomBetween(3, 6)) {
      disappearAccumulator = 0;
      const allWalls: WallSegment[] = [];
      for (const ring of maze.rings) {
        for (const w of ring.wallSegments) {
          if (!w.isFake && w.isVisible) allWalls.push(w);
        }
      }
      if (allWalls.length > 0) {
        const w = allWalls[Math.floor(Math.random() * allWalls.length)];
        w.disappearTimer = 2.5;
        w.isVisible = false;
      }
    }
  }

  for (const ring of maze.rings) {
    ring.rotationAngle += ring.rotationSpeed * dt;
    ring.rotationAngle = ring.rotationAngle % TWO_PI;

    for (const gate of ring.gates) {
      // Skip collapsed gates
      if (gate.collapsedTimer !== undefined && gate.collapsedTimer > 0) {
        gate.openTimer -= dt;
        continue;
      }

      gate.openTimer -= dt;
      if (gate.openTimer <= 0) {
        gate.isOpen = !gate.isOpen;
        gate.openTimer = gate.isOpen
          ? randomBetween(0.5, gate.openDuration)
          : randomBetween(0.5, gate.closedDuration);
      }
      const target = gate.isOpen ? 1 : 0;
      gate.openAmount += (target - gate.openAmount) * Math.min(1, dt * 4);
    }

    ring.wallSegments = computeWallSegments(ring.gates, config.hasFakeWalls);

    // Update disappearing wall timers
    for (const wall of ring.wallSegments) {
      if (wall.disappearTimer !== undefined && wall.disappearTimer > 0) {
        wall.disappearTimer -= dt;
        if (wall.disappearTimer <= 0) {
          wall.isVisible = true;
          wall.disappearTimer = 0;
        }
      }
    }
  }

  // Update moving fire zones
  for (const zone of maze.zones) {
    if (zone.type === "fire" && zone.angularVelocity !== undefined) {
      zone.startAngle =
        (zone.startAngle + zone.angularVelocity * dt + TWO_PI) % TWO_PI;
      zone.endAngle =
        (zone.endAngle + zone.angularVelocity * dt + TWO_PI) % TWO_PI;
    }
  }
}

export function getWorldAngle(localAngle: number, ring: Ring): number {
  return (localAngle + ring.rotationAngle) % TWO_PI;
}

export function isInGap(worldAngle: number, ring: Ring): boolean {
  const localAngle =
    (((worldAngle - ring.rotationAngle) % TWO_PI) + TWO_PI) % TWO_PI;

  for (const gate of ring.gates) {
    // Collapsed gates block passage
    if (gate.collapsedTimer !== undefined && gate.collapsedTimer > 0) continue;
    if (gate.openAmount < 0.3) continue;

    let start = gate.startAngle;
    let end = gate.endAngle;

    if (start <= end) {
      if (localAngle >= start && localAngle <= end) return true;
    } else {
      if (localAngle >= start || localAngle <= end) return true;
    }
  }

  // Also allow passage through fake walls
  for (const wall of ring.wallSegments) {
    if (!wall.isFake) continue;
    const start = wall.startAngle;
    const end = wall.endAngle;
    if (start <= end) {
      if (localAngle >= start && localAngle <= end) return true;
    } else {
      if (localAngle >= start || localAngle <= end) return true;
    }
  }

  return false;
}

export function isInZone(
  worldAngle: number,
  dist: number,
  ring: Ring,
  zone: Zone,
): boolean {
  if (dist < ring.innerRadius || dist > ring.outerRadius) return false;

  const localAngle =
    (((worldAngle - ring.rotationAngle) % TWO_PI) + TWO_PI) % TWO_PI;

  if (zone.startAngle <= zone.endAngle) {
    return localAngle >= zone.startAngle && localAngle <= zone.endAngle;
  }
  return localAngle >= zone.startAngle || localAngle <= zone.endAngle;
}
