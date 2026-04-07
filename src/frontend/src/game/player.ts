// ============================================================
// Player Entity — Movement, Collision, Powers (50-level edition)
// ============================================================

import { isInGap } from "./maze";
import type {
  InputState,
  JoystickState,
  LevelConfig,
  MazeData,
  Particle,
  Player,
  UpgradeState,
  Zone,
} from "./types";

const MAX_SPEED = 180;
const MAX_SPEED_TRAP = 90;
const MAX_SPEED_FIRE = 75;
const ACCELERATION = 800;
const FRICTION = 0.85;
const TWO_PI = Math.PI * 2;

export function createHider(
  id: number,
  isHuman: boolean,
  startX: number,
  startY: number,
): Player {
  return {
    id,
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    radius: 10,
    role: "hider",
    color: "#00E6FF",
    glowColor: "#00E6FF",
    isInvisible: false,
    invisibleTimer: 0,
    invisibleCooldown: 0,
    scanActive: false,
    scanTimer: 0,
    scanCooldown: 0,
    scanRadius: 0,
    isHuman,
    isAlive: true,
    lastKnownX: startX,
    lastKnownY: startY,
    wanderAngle: 0,
    dashActive: false,
    dashCooldown: 0,
    dashDuration: 0,
    speedBoostActive: false,
    speedBoostTimer: 0,
    speedBoostCooldown: 0,
    trapImmune: false,
    trapImmuneTimer: 0,
    trapImmuneCooldown: 0,
    selectedAbility: 0,
    trapResistant: false,
    phaseWalkActive: false,
    phaseWalkTimer: 0,
    phaseWalkCooldown: 0,
    timeSlowActive: false,
    timeSlowTimer: 0,
    timeSlowCooldown: 0,
    energyShieldActive: false,
    hyperDashActive: false,
    hyperDashCooldown: 0,
    patternMemory: [],
  };
}

export function createSeeker(
  id: number,
  isHuman: boolean,
  startX: number,
  startY: number,
  trapResistant = false,
  color = "#FF3A4E",
  glowColor = "#FF4D5A",
): Player {
  return {
    id,
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    radius: 10,
    role: "seeker",
    color,
    glowColor,
    isInvisible: false,
    invisibleTimer: 0,
    invisibleCooldown: 0,
    scanActive: false,
    scanTimer: 0,
    scanCooldown: 0,
    scanRadius: 0,
    isHuman,
    isAlive: true,
    lastKnownX: startX,
    lastKnownY: startY,
    wanderAngle: 0,
    dashActive: false,
    dashCooldown: 0,
    dashDuration: 0,
    speedBoostActive: false,
    speedBoostTimer: 0,
    speedBoostCooldown: 0,
    trapImmune: false,
    trapImmuneTimer: 0,
    trapImmuneCooldown: 0,
    selectedAbility: 0,
    trapResistant,
    phaseWalkActive: false,
    phaseWalkTimer: 0,
    phaseWalkCooldown: 0,
    timeSlowActive: false,
    timeSlowTimer: 0,
    timeSlowCooldown: 0,
    energyShieldActive: false,
    hyperDashActive: false,
    hyperDashCooldown: 0,
    patternMemory: [],
  };
}

function getPlayerZoneType(
  player: Player,
  maze: MazeData,
  zones: Zone[],
): "safe" | "trap" | "fire" | "freeze" | "none" {
  const dist = Math.sqrt(player.x * player.x + player.y * player.y);
  const angle = ((Math.atan2(player.y, player.x) % TWO_PI) + TWO_PI) % TWO_PI;

  for (const zone of zones) {
    const ring = maze.rings[zone.ringIndex];
    if (!ring) continue;
    if (dist >= ring.innerRadius - 5 && dist <= ring.outerRadius + 5) {
      let inZone = false;
      if (
        (zone.type === "fire" || zone.type === "freeze") &&
        zone.angularVelocity !== undefined
      ) {
        if (zone.startAngle <= zone.endAngle) {
          inZone = angle >= zone.startAngle && angle <= zone.endAngle;
        } else {
          inZone = angle >= zone.startAngle || angle <= zone.endAngle;
        }
      } else {
        const localAngle =
          (((angle - ring.rotationAngle) % TWO_PI) + TWO_PI) % TWO_PI;
        if (zone.startAngle <= zone.endAngle) {
          inZone = localAngle >= zone.startAngle && localAngle <= zone.endAngle;
        } else {
          inZone = localAngle >= zone.startAngle || localAngle <= zone.endAngle;
        }
      }
      if (inZone) return zone.type;
    }
  }
  return "none";
}

export function updatePlayer(
  player: Player,
  dt: number,
  input: { ax: number; ay: number; useAbility: boolean },
  maze: MazeData,
  _isMobile: boolean,
  upgrades: UpgradeState,
  config: LevelConfig,
  particles: Particle[],
  timeSlowActive = false,
): void {
  const cdReduction = 1 - upgrades.cooldownReduction;

  if (player.role === "hider") {
    // —— Invisible ——
    if (player.isInvisible) {
      player.invisibleTimer -= dt;
      if (player.invisibleTimer <= 0) {
        player.isInvisible = false;
        player.invisibleCooldown = 12 * cdReduction;
      }
    } else if (player.invisibleCooldown > 0) {
      player.invisibleCooldown -= dt;
    }

    // —— Dash ——
    if (player.dashActive) {
      player.dashDuration -= dt;
      if (player.dashDuration <= 0) player.dashActive = false;
    }
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

    // —— Hyper Dash ——
    if (player.hyperDashActive) {
      player.hyperDashCooldown -= dt;
      if (player.hyperDashCooldown <= 0) player.hyperDashActive = false;
    } else if (player.hyperDashCooldown > 0) {
      player.hyperDashCooldown -= dt;
    }

    // —— Speed Boost ——
    if (player.speedBoostActive) {
      player.speedBoostTimer -= dt;
      if (player.speedBoostTimer <= 0) {
        player.speedBoostActive = false;
        player.speedBoostCooldown = 10 * cdReduction;
      }
    } else if (player.speedBoostCooldown > 0) {
      player.speedBoostCooldown -= dt;
    }

    // —— Trap Immunity ——
    if (player.trapImmune) {
      player.trapImmuneTimer -= dt;
      if (player.trapImmuneTimer <= 0) {
        player.trapImmune = false;
        player.trapImmuneCooldown = 15 * cdReduction;
      }
    } else if (player.trapImmuneCooldown > 0) {
      player.trapImmuneCooldown -= dt;
    }

    // —— Phase Walk ——
    if (player.phaseWalkActive) {
      player.phaseWalkTimer -= dt;
      if (player.phaseWalkTimer <= 0) {
        player.phaseWalkActive = false;
        player.phaseWalkCooldown = 18 * cdReduction;
      }
    } else if (player.phaseWalkCooldown > 0) {
      player.phaseWalkCooldown -= dt;
    }

    // —— Time Slow ——
    if (player.timeSlowActive) {
      player.timeSlowTimer -= dt;
      if (player.timeSlowTimer <= 0) {
        player.timeSlowActive = false;
        player.timeSlowCooldown = 20 * cdReduction;
      }
    } else if (player.timeSlowCooldown > 0) {
      player.timeSlowCooldown -= dt;
    }

    // Ability activation
    if (input.useAbility) {
      const sel = player.selectedAbility;
      if (sel === 0 && !player.isInvisible && player.invisibleCooldown <= 0) {
        player.isInvisible = true;
        player.invisibleTimer = upgrades.invisDuration;
        emitParticles(particles, player.x, player.y, "#00E6FF", 10, 80);
      } else if (
        sel === 1 &&
        upgrades.dashUnlocked &&
        player.dashCooldown <= 0
      ) {
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > 5) {
          const nx = player.vx / speed;
          const ny = player.vy / speed;
          player.x += nx * 50;
          player.y += ny * 50;
        }
        player.dashCooldown = 4 * cdReduction;
        player.dashActive = true;
        player.dashDuration = 0.1;
        emitParticles(particles, player.x, player.y, "#FFFFFF", 5, 60);
      } else if (
        sel === 2 &&
        upgrades.speedBoostUnlocked &&
        player.speedBoostCooldown <= 0
      ) {
        player.speedBoostActive = true;
        player.speedBoostTimer = 3;
        player.speedBoostCooldown = 10 * cdReduction;
        emitParticles(particles, player.x, player.y, "#FFD700", 8, 70);
      } else if (
        sel === 3 &&
        upgrades.trapImmunityUnlocked &&
        player.trapImmuneCooldown <= 0
      ) {
        player.trapImmune = true;
        player.trapImmuneTimer = upgrades.trapImmunityDuration;
        player.trapImmuneCooldown = 15 * cdReduction;
        emitParticles(particles, player.x, player.y, "#00FF88", 8, 70);
      } else if (
        sel === 4 &&
        upgrades.hyperDashUnlocked &&
        player.hyperDashCooldown <= 0
      ) {
        // Hyper Dash: 2x distance, 2x speed
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > 5) {
          const nx = player.vx / speed;
          const ny = player.vy / speed;
          player.x += nx * 100;
          player.y += ny * 100;
        }
        player.hyperDashActive = true;
        player.hyperDashCooldown = 2.5 * cdReduction;
        emitParticles(particles, player.x, player.y, "#FF00FF", 12, 120);
      } else if (
        sel === 5 &&
        upgrades.phaseWalkUnlocked &&
        player.phaseWalkCooldown <= 0
      ) {
        player.phaseWalkActive = true;
        player.phaseWalkTimer = 2;
        player.phaseWalkCooldown = 18 * cdReduction;
        emitParticles(particles, player.x, player.y, "#AADDFF", 8, 60);
      } else if (
        sel === 6 &&
        upgrades.timeSlowUnlocked &&
        player.timeSlowCooldown <= 0
      ) {
        player.timeSlowActive = true;
        player.timeSlowTimer = upgrades.timeSlowDuration;
        player.timeSlowCooldown = 20 * cdReduction;
        emitParticles(particles, player.x, player.y, "#4466FF", 10, 80);
      } else if (
        sel === 7 &&
        upgrades.energyShieldUnlocked &&
        !player.energyShieldActive &&
        upgrades.energyShieldCharges > 0
      ) {
        player.energyShieldActive = true;
        emitParticles(particles, player.x, player.y, "#FFAA00", 12, 90);
      }
    }
  } else {
    // Seeker scan
    if (player.scanActive) {
      player.scanTimer -= dt;
      player.scanRadius += dt * 300;
      if (player.scanTimer <= 0) {
        player.scanActive = false;
        player.scanCooldown = 15;
        player.scanRadius = 0;
      }
    } else if (player.scanCooldown > 0) {
      player.scanCooldown -= dt;
    }

    if (input.useAbility && !player.scanActive && player.scanCooldown <= 0) {
      player.scanActive = true;
      player.scanTimer = 2;
      player.scanRadius = 0;
    }
  }

  // Zone type
  const zoneType = getPlayerZoneType(player, maze, maze.zones);

  // Freeze zone: zero velocity for 1.5s
  if (zoneType === "freeze" && !player.trapImmune && !player.trapResistant) {
    if (!player.trapImmune) {
      player.vx *= 0.05;
      player.vy *= 0.05;
    }
  }

  // Determine effective max speed
  let effectiveMax = MAX_SPEED;
  if (player.role === "seeker") {
    effectiveMax = MAX_SPEED * config.seekerSpeedMult;
    if (timeSlowActive) effectiveMax *= 0.25;
  } else if (player.speedBoostActive) {
    effectiveMax = MAX_SPEED * (1 + upgrades.speedBoostLevel * 0.5);
  } else if (player.hyperDashActive) {
    effectiveMax = MAX_SPEED * 2.5;
  }

  const isTrapped =
    (zoneType === "trap" || zoneType === "fire") &&
    !player.trapImmune &&
    !player.trapResistant;

  if (isTrapped) {
    effectiveMax = zoneType === "fire" ? MAX_SPEED_FIRE : MAX_SPEED_TRAP;
    if (zoneType === "fire" && Math.random() < 0.1) {
      emitParticles(particles, player.x, player.y, "#FF6600", 3, 40);
    }
  }

  player.vx += input.ax * ACCELERATION * dt;
  player.vy += input.ay * ACCELERATION * dt;

  player.vx *= FRICTION ** (dt * 60);
  player.vy *= FRICTION ** (dt * 60);

  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (speed > effectiveMax) {
    player.vx = (player.vx / speed) * effectiveMax;
    player.vy = (player.vy / speed) * effectiveMax;
  }

  const newX = player.x + player.vx * dt;
  const newY = player.y + player.vy * dt;

  // Phase walk bypasses wall collision
  if (player.phaseWalkActive) {
    player.x = newX;
    player.y = newY;
    // Clamp to maze boundary
    const outerR = maze.rings[maze.rings.length - 1]?.outerRadius || 300;
    const d = Math.sqrt(player.x * player.x + player.y * player.y);
    if (d > outerR + 20) {
      player.x = (player.x / d) * (outerR + 20);
      player.y = (player.y / d) * (outerR + 20);
    }
  } else {
    const resolved = resolveCollision(newX, newY, player.radius, maze);
    player.x = resolved.x;
    player.y = resolved.y;
    if (resolved.hitX) player.vx *= -0.2;
    if (resolved.hitY) player.vy *= -0.2;
  }

  player.lastKnownX = player.x;
  player.lastKnownY = player.y;
}

export function emitParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number,
): void {
  if (particles.length > 45) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      maxLife: 1,
      color,
      radius: 2 + Math.random() * 2,
    });
  }
}

function resolveCollision(
  nx: number,
  ny: number,
  radius: number,
  maze: MazeData,
): { x: number; y: number; hitX: boolean; hitY: boolean } {
  let x = nx;
  let y = ny;
  let hitX = false;
  let hitY = false;

  const dist = Math.sqrt(x * x + y * y);
  const angle =
    ((Math.atan2(y, x) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  for (const ring of maze.rings) {
    const { innerRadius, outerRadius } = ring;
    const outerBound = outerRadius + 2;
    const innerBound = innerRadius - 2;

    if (dist + radius > outerBound && dist - radius < outerBound) {
      if (!isInGap(angle, ring)) {
        const pushDist = outerBound - radius - 1;
        const dx = x / dist;
        const dy = y / dist;
        x = dx * pushDist;
        y = dy * pushDist;
        hitX = true;
        hitY = true;
        break;
      }
    }

    if (dist - radius < innerBound && dist + radius > innerBound) {
      if (!isInGap(angle, ring)) {
        const pushDist = innerBound + radius + 1;
        const currentDist = Math.sqrt(x * x + y * y);
        if (currentDist > 0.001) {
          const dx = x / currentDist;
          const dy = y / currentDist;
          x = dx * pushDist;
          y = dy * pushDist;
        }
        hitX = true;
        hitY = true;
        break;
      }
    }
  }

  return { x, y, hitX, hitY };
}

export function getInputVector(
  input: InputState,
  joystick: JoystickState,
  playerIndex: number,
): { ax: number; ay: number; useAbility: boolean } {
  let ax = 0;
  let ay = 0;
  let useAbility = false;

  if (playerIndex === 0) {
    if (joystick.active) {
      ax = joystick.dx;
      ay = joystick.dy;
    } else {
      if (input.left) ax -= 1;
      if (input.right) ax += 1;
      if (input.up) ay -= 1;
      if (input.down) ay += 1;
      useAbility = input.useAbility;
    }
  } else {
    if (input.p2left) ax -= 1;
    if (input.p2right) ax += 1;
    if (input.p2up) ay -= 1;
    if (input.p2down) ay += 1;
    useAbility = input.p2useAbility;
  }

  const len = Math.sqrt(ax * ax + ay * ay);
  if (len > 1) {
    ax /= len;
    ay /= len;
  }

  return { ax, ay, useAbility };
}
