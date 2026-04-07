// ============================================================
// Game Engine — Rendering Pipeline + Update Loop (50-level edition)
// ============================================================

import { renderBackground } from "./BackgroundEngine";
import { drawCharacter, updateFrameTime } from "./CharacterSprites";
import { updateSmartAI } from "./SmartAI";
import { createAIState, createMultipleAIStates } from "./ai";
import {
  playSoundEffect,
  startHeartbeat,
  stopHeartbeat,
  updateMusicDanger,
} from "./audio";
import { generateMaze, updateMaze } from "./maze";
import {
  createHider,
  createSeeker,
  emitParticles,
  getInputVector,
  updatePlayer,
} from "./player";
import type {
  AIState,
  GameMode,
  GameState,
  InputState,
  JoystickState,
  LevelConfig,
  MazeData,
  Particle,
  Player,
  TeleportPortal,
  UpgradeState,
  Zone,
} from "./types";

const TWO_PI = Math.PI * 2;
const isMobileDevice = () => navigator.maxTouchPoints > 0;

// ─── Camera State ─────────────────────────────────────────────
interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// ─── Factory ──────────────────────────────────────────────────
export function createGameState(
  mode: GameMode,
  levelConfig: LevelConfig,
  upgrades: UpgradeState,
): GameState {
  const numRings = 5;
  const maze = generateMaze(numRings, levelConfig);
  const outerR = maze.rings[numRings - 1].outerRadius;

  const players: Player[] = [];

  if (mode === "solo") {
    players.push(createHider(0, true, outerR * 0.4, 0));
    players.push(
      createSeeker(1, false, outerR * 0.9, 0, levelConfig.seekerTrapResistant),
    );
    // Extra seekers for multi-seeker levels
    if (levelConfig.multipleSeekersCount >= 2) {
      players.push(
        createSeeker(
          2,
          false,
          outerR * 0.9 * Math.cos((Math.PI * 2) / 3),
          outerR * 0.9 * Math.sin((Math.PI * 2) / 3),
          levelConfig.seekerTrapResistant,
          "#FF8C00",
          "#FF9D20",
        ),
      );
    }
    if (levelConfig.multipleSeekersCount >= 3) {
      players.push(
        createSeeker(
          3,
          false,
          outerR * 0.9 * Math.cos((Math.PI * 4) / 3),
          outerR * 0.9 * Math.sin((Math.PI * 4) / 3),
          levelConfig.seekerTrapResistant,
          "#FF44AA",
          "#FF55BB",
        ),
      );
    }
  } else if (mode === "duo1v1") {
    players.push(createHider(0, true, outerR * 0.4, 0));
    players.push(
      createSeeker(1, true, outerR * 0.9, 0, levelConfig.seekerTrapResistant),
    );
  } else {
    players.push(createHider(0, true, outerR * 0.4, 0));
    players.push(
      createHider(
        1,
        true,
        outerR * 0.4 * Math.cos(Math.PI),
        outerR * 0.4 * Math.sin(Math.PI),
      ),
    );
    players.push(
      createSeeker(2, false, outerR * 0.9, 0, levelConfig.seekerTrapResistant),
    );
  }

  // Generate teleport portals
  const portals: TeleportPortal[] = [];
  if (levelConfig.hasTeleportPortals) {
    const portalCount = 3 + Math.floor(Math.random() * 2); // 3-4 pairs
    const portalColors = ["#AA00FF", "#FF00AA", "#00FFAA", "#FFAA00"];
    for (let i = 0; i < portalCount; i++) {
      const angle1 = (i / portalCount) * TWO_PI;
      const angle2 = angle1 + Math.PI + (Math.random() - 0.5) * 0.5;
      const rIdx = 1 + Math.floor(Math.random() * 3);
      const ring = maze.rings[rIdx];
      const r = ring ? (ring.innerRadius + ring.outerRadius) / 2 : outerR * 0.5;
      const r2 = maze.rings[rIdx]
        ? (maze.rings[rIdx].innerRadius + maze.rings[rIdx].outerRadius) / 2
        : r;
      const color = portalColors[i % portalColors.length];
      portals.push({
        id: i * 2,
        x: Math.cos(angle1) * r,
        y: Math.sin(angle1) * r,
        radius: 14,
        linkedPortalId: i * 2 + 1,
        color,
        pulseTimer: 0,
      });
      portals.push({
        id: i * 2 + 1,
        x: Math.cos(angle2) * r2,
        y: Math.sin(angle2) * r2,
        radius: 14,
        linkedPortalId: i * 2,
        color,
        pulseTimer: 0,
      });
    }
  }

  const extraSeekerCount = Math.max(
    0,
    (levelConfig.multipleSeekersCount || 1) - 1,
  );
  const multipleSeekerAIs = createMultipleAIStates(extraSeekerCount);

  const blackoutCountdown = levelConfig.blackoutInterval
    ? levelConfig.blackoutInterval + Math.random() * 5
    : 99999;

  const mazeShiftTimer = levelConfig.mazeShiftInterval
    ? levelConfig.mazeShiftInterval
    : 99999;

  return {
    phase: "playing",
    mode,
    players,
    maze,
    timeLeft: levelConfig.timeLimit,
    winner: null,
    totalTime: levelConfig.timeLimit,
    currentLevel: levelConfig.id,
    levelConfig,
    coins: 0,
    upgrades,
    particles: [],
    // Difficulty state
    difficulty: "easy",
    // New state
    gravityShiftActive: false,
    gravityShiftTimer: 4 + Math.random() * 3,
    gravityAngle: 0,
    reverseControlsActive: false,
    reverseControlsTimer: 3 + Math.random() * 4,
    blackoutActive: false,
    blackoutTimer: 0,
    blackoutCountdown,
    screenShakeX: 0,
    screenShakeY: 0,
    screenShakeMagnitude: 0,
    musicDangerLevel: 0,
    teleportPortals: portals,
    multipleSeekerAIs,
    heartbeatActive: false,
    shrinkProgress: 0,
    pathCollapseTimer: 5 + Math.random() * 3,
    mazeShiftTimer,
    heartbeatTimer: 0,
  };
}

function addScreenShake(state: GameState, magnitude: number): void {
  state.screenShakeMagnitude = Math.max(state.screenShakeMagnitude, magnitude);
}

// ─── Coin calculation ────────────────────────────────────────────────
export function getCoinsEarned(state: GameState, won: boolean): number {
  const base = 10 + state.levelConfig.id * 2;
  const survivalBonus = won ? Math.floor(state.timeLeft / 5) : 0;
  return base + survivalBonus;
}

// ─── Per-frame Update ─────────────────────────────────────────────
let aiState: AIState | null = null;
let prevScanActive = false;
let prevInvisible = false;
let prevDashActive = false;
let prevSpeedBoost = false;
let fireDamageTimer = 0;
let frameTimeMs = 0;
let footstepTimer = 0;

export function initAI(): void {
  aiState = createAIState();
}

export function updateGame(
  state: GameState,
  dt: number,
  input: InputState,
  joystick: JoystickState,
): { winner: "hider" | "seeker" | null } {
  const { players, maze } = state;
  const config = state.levelConfig;

  state.timeLeft = Math.max(0, state.timeLeft - dt);

  // Update frame time for character animations
  frameTimeMs = updateFrameTime(dt);

  updateMaze(maze, dt, config);

  // ── Screen shake decay
  state.screenShakeMagnitude *= 0.85;
  state.screenShakeX = (Math.random() - 0.5) * 2 * state.screenShakeMagnitude;
  state.screenShakeY = (Math.random() - 0.5) * 2 * state.screenShakeMagnitude;

  // ── Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  // ── Portal pulse timers
  for (const portal of state.teleportPortals) {
    portal.pulseTimer += dt;
  }

  // ── Gravity shift system
  if (config.hasGravityShift) {
    state.gravityShiftTimer -= dt;
    if (state.gravityShiftTimer <= 0) {
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      state.gravityAngle = angles[Math.floor(Math.random() * angles.length)];
      state.gravityShiftActive = true;
      state.gravityShiftTimer = 4 + Math.random() * 3;
      playSoundEffect("gravityShift");
      addScreenShake(state, 10);
    }
  }

  // ── Reverse controls system
  if (config.reverseControlsRandom) {
    state.reverseControlsTimer -= dt;
    if (state.reverseControlsTimer <= 0) {
      state.reverseControlsActive = !state.reverseControlsActive;
      state.reverseControlsTimer = 3 + Math.random() * 4;
    }
  }

  // ── Blackout system
  if (config.blackoutInterval !== null) {
    if (state.blackoutActive) {
      state.blackoutTimer -= dt;
      if (state.blackoutTimer <= 0) {
        state.blackoutActive = false;
        state.blackoutCountdown = config.blackoutInterval + Math.random() * 5;
      }
    } else {
      state.blackoutCountdown -= dt;
      if (state.blackoutCountdown <= 0) {
        state.blackoutActive = true;
        state.blackoutTimer = 2.5;
        playSoundEffect("blackout");
        addScreenShake(state, 20);
      }
    }
  }

  // ── Maze shift system (gate reshuffle)
  if (config.mazeShiftInterval !== null) {
    state.mazeShiftTimer -= dt;
    if (state.mazeShiftTimer <= 0) {
      // Force randomize all gates
      for (const ring of maze.rings) {
        for (const gate of ring.gates) {
          gate.isOpen = Math.random() > 0.5;
          gate.openAmount = gate.isOpen ? 1 : 0;
          gate.openTimer = 0.5 + Math.random() * 2;
        }
      }
      state.mazeShiftTimer = config.mazeShiftInterval + Math.random() * 2;
      addScreenShake(state, 6);
    }
  }

  // ── Path collapse system
  if (config.pathCollapseEnabled) {
    state.pathCollapseTimer -= dt;
    if (state.pathCollapseTimer <= 0) {
      // Force-close a random gate for 3s
      const ri = Math.floor(Math.random() * maze.rings.length);
      const ring = maze.rings[ri];
      if (ring && ring.gates.length > 0) {
        const gi = Math.floor(Math.random() * ring.gates.length);
        const gate = ring.gates[gi];
        gate.isOpen = false;
        gate.openAmount = 0;
        gate.collapsedTimer = 3;
      }
      state.pathCollapseTimer = 5 + Math.random() * 3;
    }
    // Update collapse timers
    for (const ring of maze.rings) {
      for (const gate of ring.gates) {
        if (gate.collapsedTimer !== undefined && gate.collapsedTimer > 0) {
          gate.collapsedTimer -= dt;
        }
      }
    }
  }

  // ── Shrinking maze
  if (config.shrinkingMaze) {
    state.shrinkProgress += 0.0005 * dt * 60;
    state.shrinkProgress = Math.min(1, state.shrinkProgress);
  }

  // ── Rotation direction random
  if (config.rotationDirectionRandom && Math.random() < 0.002) {
    const ri = Math.floor(Math.random() * maze.rings.length);
    maze.rings[ri].rotationSpeed *= -1;
  }

  // ── Heartbeat system
  const hider = players.find((p) => p.role === "hider" && p.isAlive);
  const mainSeeker = players.find((p) => p.role === "seeker");
  let seekerProximity = 0;

  if (hider && mainSeeker) {
    const sdx = hider.x - mainSeeker.x;
    const sdy = hider.y - mainSeeker.y;
    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
    seekerProximity = Math.max(0, 1 - sDist / 200);

    const shouldHeartbeat = sDist < 100 || state.timeLeft < 15;
    if (shouldHeartbeat && !state.heartbeatActive) {
      state.heartbeatActive = true;
      startHeartbeat();
    } else if (!shouldHeartbeat && state.heartbeatActive) {
      state.heartbeatActive = false;
      stopHeartbeat();
    }

    // Screen shake when seeker very close
    if (sDist < 80) {
      addScreenShake(state, 5);
    }
  }

  // ── Danger level for music
  const timeFactor = 1 - state.timeLeft / Math.max(state.totalTime, 1);
  state.musicDangerLevel = timeFactor * 0.5 + seekerProximity * 0.5;
  updateMusicDanger(state.musicDangerLevel);

  // ── Trap explosion system
  if (config.trapExplosionEnabled) {
    for (const zone of maze.zones) {
      if (zone.type !== "trap") continue;
      if (zone.explosionTimer === undefined) {
        zone.explosionTimer = 6 + Math.random() * 4;
      }
      zone.explosionTimer -= dt;
      if (zone.explosionTimer <= 0) {
        zone.explosionTimer = 6 + Math.random() * 4;
        // Get zone world center
        const ring = maze.rings[zone.ringIndex];
        if (!ring) continue;
        const midAngle =
          (zone.startAngle + zone.endAngle) / 2 + ring.rotationAngle;
        const midR = (ring.innerRadius + ring.outerRadius) / 2;
        const expX = Math.cos(midAngle) * midR;
        const expY = Math.sin(midAngle) * midR;
        const blastRadius = 60;

        // Damage players near explosion (catch seekers by proximity)
        for (const p of players) {
          if (!p.isAlive) continue;
          const edx = p.x - expX;
          const edy = p.y - expY;
          const eDist = Math.sqrt(edx * edx + edy * edy);
          if (eDist < blastRadius && p.role === "hider") {
            if (!p.trapImmune && !p.energyShieldActive) {
              addScreenShake(state, 15);
              playSoundEffect("explosion");
            } else if (p.energyShieldActive) {
              p.energyShieldActive = false;
              playSoundEffect("shieldHit");
              addScreenShake(state, 5);
            }
          }
        }

        emitParticles(state.particles, expX, expY, "#FF6600", 20, 150);
        emitParticles(state.particles, expX, expY, "#FFDD00", 15, 100);
      }
    }
  }

  // Fire damage SFX timer
  fireDamageTimer -= dt;

  // Footstep SFX timer
  footstepTimer -= dt;
  const hiderForStep = players.find(
    (p) => p.role === "hider" && p.isHuman && p.isAlive,
  );
  if (hiderForStep && footstepTimer <= 0) {
    const spd = Math.sqrt(
      hiderForStep.vx * hiderForStep.vx + hiderForStep.vy * hiderForStep.vy,
    );
    if (spd > 20) {
      playSoundEffect("footstep");
      footstepTimer = 0.3;
    }
  }

  // Determine time slow state
  const p1 = players[0];
  const timeSlowActive = p1?.timeSlowActive === true;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (!player.isAlive) continue;

    if (player.isHuman) {
      const pidx = state.mode === "duo2v1" && player.id === 1 ? 1 : 0;
      let inputVec = getInputVector(input, joystick, pidx);

      // Gravity shift applies force
      if (config.hasGravityShift && state.gravityShiftActive) {
        inputVec = {
          ax: inputVec.ax + Math.cos(state.gravityAngle) * 0.3,
          ay: inputVec.ay + Math.sin(state.gravityAngle) * 0.3,
          useAbility: inputVec.useAbility,
        };
      }

      // Reverse controls
      if (state.reverseControlsActive && player.role === "hider") {
        inputVec = {
          ax: -inputVec.ax,
          ay: -inputVec.ay,
          useAbility: inputVec.useAbility,
        };
      }

      updatePlayer(
        player,
        dt,
        inputVec,
        maze,
        isMobileDevice(),
        state.upgrades,
        config,
        state.particles,
        false,
      );
    } else if (player.role === "seeker") {
      // Determine which AI state to use
      const seekerIdx = players
        .filter((p) => p.role === "seeker")
        .indexOf(player);
      let currentAI: AIState;
      if (seekerIdx === 0) {
        if (!aiState) aiState = createAIState();
        currentAI = aiState;
      } else {
        const extraIdx = seekerIdx - 1;
        if (!state.multipleSeekerAIs[extraIdx]) {
          state.multipleSeekerAIs[extraIdx] = createAIState();
        }
        currentAI = state.multipleSeekerAIs[extraIdx];
      }

      const hiders = players.filter((p) => p.role === "hider" && p.isAlive);
      const difficulty = (state as any).difficulty || "easy";
      const aiInput = updateSmartAI(
        difficulty,
        player,
        hiders,
        maze,
        currentAI,
        dt,
        config,
      );

      updatePlayer(
        player,
        dt,
        aiInput,
        maze,
        false,
        state.upgrades,
        config,
        state.particles,
        timeSlowActive,
      );
    }

    // Sound effects
    if (player.role === "hider" && player.isInvisible && !prevInvisible) {
      playSoundEffect("invisible");
    }
    prevInvisible =
      player.role === "hider" ? player.isInvisible : prevInvisible;

    if (player.role === "seeker" && player.scanActive && !prevScanActive) {
      playSoundEffect("scan");
    }
    prevScanActive =
      player.role === "seeker" ? player.scanActive : prevScanActive;

    if (player.role === "hider" && player.dashActive && !prevDashActive) {
      playSoundEffect("dash");
    }
    prevDashActive =
      player.role === "hider" ? player.dashActive : prevDashActive;

    if (player.role === "hider" && player.speedBoostActive && !prevSpeedBoost) {
      playSoundEffect("speedboost");
    }
    prevSpeedBoost =
      player.role === "hider" ? player.speedBoostActive : prevSpeedBoost;
  }

  // ── Teleport portal checks
  if (state.teleportPortals.length > 0) {
    for (const player of players) {
      if (!player.isAlive) continue;
      for (const portal of state.teleportPortals) {
        const pdx = player.x - portal.x;
        const pdy = player.y - portal.y;
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pDist < portal.radius) {
          // Find linked portal
          const linked = state.teleportPortals.find(
            (p) => p.id === portal.linkedPortalId,
          );
          if (linked) {
            const offsetAngle = Math.random() * TWO_PI;
            player.x = linked.x + Math.cos(offsetAngle) * 30;
            player.y = linked.y + Math.sin(offsetAngle) * 30;
            player.vx = 0;
            player.vy = 0;
            playSoundEffect("portal");
            addScreenShake(state, 8);
            // Small delay by moving away from this portal briefly
            player.x += Math.cos(offsetAngle) * 5;
            player.y += Math.sin(offsetAngle) * 5;
          }
          break;
        }
      }
    }
  }

  // ── Fire damage SFX
  if (hider && config.hasMovingFireZones && fireDamageTimer <= 0) {
    const dist = Math.sqrt(hider.x * hider.x + hider.y * hider.y);
    const angle = ((Math.atan2(hider.y, hider.x) % TWO_PI) + TWO_PI) % TWO_PI;
    let inFire = false;
    for (const zone of maze.zones) {
      if (zone.type !== "fire") continue;
      const ring = maze.rings[zone.ringIndex];
      if (!ring) continue;
      if (dist >= ring.innerRadius - 5 && dist <= ring.outerRadius + 5) {
        if (zone.startAngle <= zone.endAngle) {
          if (angle >= zone.startAngle && angle <= zone.endAngle) inFire = true;
        } else {
          if (angle >= zone.startAngle || angle <= zone.endAngle) inFire = true;
        }
      }
    }
    if (inFire) {
      if (hider.energyShieldActive) {
        hider.energyShieldActive = false;
        playSoundEffect("shieldHit");
      } else {
        playSoundEffect("firedamage");
      }
      fireDamageTimer = 1.5;
      addScreenShake(state, 8);
    }
  }

  // ── Check win conditions
  const hiders = players.filter((p) => p.role === "hider" && p.isAlive);

  if (hiders.length === 0) return { winner: "seeker" };

  // Check all seekers (main + extra)
  const allSeekers = players.filter((p) => p.role === "seeker");
  for (const sk of allSeekers) {
    for (const h of hiders) {
      if (h.isInvisible) continue;
      const cdx = h.x - sk.x;
      const cdy = h.y - sk.y;
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cDist < 15) {
        playSoundEffect("capture");
        stopHeartbeat();
        return { winner: "seeker" };
      }
    }
  }

  for (const h of hiders) {
    const dist = Math.sqrt(h.x * h.x + h.y * h.y);
    if (dist < 30) {
      stopHeartbeat();
      return { winner: "hider" };
    }
  }

  if (state.timeLeft <= 0) {
    stopHeartbeat();
    return { winner: "hider" };
  }

  return { winner: null };
}

// ─── Rendering ─────────────────────────────────────────────────────
const SEEKER_COLOR = "#FF3A4E";
const SAFE_COLOR = "rgba(0, 255, 120, 0.25)";
const TRAP_COLOR = "rgba(255, 50, 50, 0.22)";
const FREEZE_COLOR = "rgba(100, 180, 255, 0.3)";
const FIRE_COLOR_BASE = "rgba(255, 100, 0, ";
const WALL_CYAN = "#00E6FF";
const WALL_PURPLE = "#8A3DFF";
const WALL_FAKE = "#CC44FF";

let camera: Camera = { x: 0, y: 0, zoom: 1 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawRingWalls(
  ctx: CanvasRenderingContext2D,
  maze: MazeData,
  isMobile: boolean,
): void {
  const blur = isMobile ? 8 : 16;

  for (let ri = 0; ri < maze.rings.length; ri++) {
    const ring = maze.rings[ri];
    const color = ri % 2 === 0 ? WALL_CYAN : WALL_PURPLE;

    ctx.lineWidth = 3;

    for (const wall of ring.wallSegments) {
      if (wall.isVisible === false) {
        const startWorld = wall.startAngle + ring.rotationAngle;
        const endWorld = wall.endAngle + ring.rotationAngle;
        ctx.globalAlpha = 0.1;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, ring.innerRadius, startWorld, endWorld);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        continue;
      }

      const startWorld = wall.startAngle + ring.rotationAngle;
      const endWorld = wall.endAngle + ring.rotationAngle;

      const isFake = wall.isFake === true;
      const wallColor = isFake ? WALL_FAKE : color;
      const wallAlpha = isFake ? 0.3 : 1.0;

      ctx.globalAlpha = wallAlpha;
      ctx.shadowBlur = blur;
      ctx.shadowColor = wallColor;
      ctx.strokeStyle = wallColor;

      ctx.beginPath();
      ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, ring.innerRadius, startWorld, endWorld);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(startWorld) * ring.innerRadius,
        Math.sin(startWorld) * ring.innerRadius,
      );
      ctx.lineTo(
        Math.cos(startWorld) * ring.outerRadius,
        Math.sin(startWorld) * ring.outerRadius,
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(endWorld) * ring.innerRadius,
        Math.sin(endWorld) * ring.innerRadius,
      );
      ctx.lineTo(
        Math.cos(endWorld) * ring.outerRadius,
        Math.sin(endWorld) * ring.outerRadius,
      );
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
    }

    // Draw partially-open gates
    for (const gate of ring.gates) {
      if (gate.openAmount > 0.05) continue;

      const startWorld = gate.startAngle + ring.rotationAngle;
      const endWorld = gate.endAngle + ring.rotationAngle;
      const alpha = 1 - gate.openAmount;

      ctx.globalAlpha = alpha * 0.7;
      ctx.shadowBlur = blur;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, ring.innerRadius, startWorld, endWorld);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1.0;
}

function drawZones(ctx: CanvasRenderingContext2D, maze: MazeData): void {
  const now = Date.now();

  for (const zone of maze.zones) {
    const ring = maze.rings[zone.ringIndex];
    if (!ring) continue;

    if (zone.type === "fire") {
      const startWorld = zone.startAngle;
      const endWorld = zone.endAngle;
      const flicker = Math.sin(now * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = `${FIRE_COLOR_BASE}${(0.35 * flicker).toFixed(2)})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#FF4400";

      ctx.beginPath();
      if (startWorld <= endWorld) {
        ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
        ctx.arc(0, 0, ring.innerRadius, endWorld, startWorld, true);
      } else {
        ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld + TWO_PI);
        ctx.arc(0, 0, ring.innerRadius, endWorld + TWO_PI, startWorld, true);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      continue;
    }

    if (zone.type === "freeze") {
      const startWorld = zone.startAngle + ring.rotationAngle;
      const endWorld = zone.endAngle + ring.rotationAngle;
      const pulse = Math.sin(now * 0.005) * 0.15 + 0.85;
      ctx.fillStyle = `rgba(100, 180, 255, ${(0.3 * pulse).toFixed(2)})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#44AAFF";
      ctx.beginPath();
      ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
      ctx.arc(0, 0, ring.innerRadius, endWorld, startWorld, true);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      continue;
    }

    const startWorld = zone.startAngle + ring.rotationAngle;
    const endWorld = zone.endAngle + ring.rotationAngle;

    ctx.fillStyle = zone.type === "safe" ? SAFE_COLOR : TRAP_COLOR;
    ctx.shadowBlur = zone.type === "safe" ? 8 : 10;
    ctx.shadowColor = zone.type === "safe" ? "#00FF78" : "#FF3232";

    ctx.beginPath();
    ctx.arc(0, 0, ring.outerRadius, startWorld, endWorld);
    ctx.arc(0, 0, ring.innerRadius, endWorld, startWorld, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  // Freeze zone label
  void FREEZE_COLOR; // keep reference
}

function drawCenterHub(
  ctx: CanvasRenderingContext2D,
  maze: MazeData,
  isMobile: boolean,
): void {
  const blur = isMobile ? 12 : 24;
  ctx.shadowBlur = blur;
  ctx.shadowColor = "#00E6FF";
  ctx.fillStyle = "rgba(0,230,255,0.15)";
  ctx.strokeStyle = "#00E6FF";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, 0, maze.innerPadding, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(0,230,255,0.6)";
  ctx.shadowBlur = blur * 2;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, TWO_PI);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawTeleportPortals(
  ctx: CanvasRenderingContext2D,
  portals: TeleportPortal[],
): void {
  for (const portal of portals) {
    const pulse = Math.sin(portal.pulseTimer * 3) * 0.3 + 0.7;
    const innerR = portal.radius * 0.4 * pulse;

    ctx.shadowBlur = 20;
    ctx.shadowColor = portal.color;
    ctx.strokeStyle = portal.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;

    // Outer ring
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius, 0, TWO_PI);
    ctx.stroke();

    // Inner glow
    ctx.fillStyle = portal.color;
    ctx.globalAlpha = 0.4 * pulse;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, innerR, 0, TWO_PI);
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}

function drawShrinkingMaze(
  ctx: CanvasRenderingContext2D,
  maze: MazeData,
  shrinkProgress: number,
): void {
  if (shrinkProgress <= 0) return;
  const outerRing = maze.rings[maze.rings.length - 1];
  if (!outerRing) return;

  // Draw darkening overlay on outer ring
  const opacity = Math.min(0.9, shrinkProgress * 1.2);
  ctx.fillStyle = `rgba(0,0,0,${opacity.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, outerRing.outerRadius + 50, 0, TWO_PI);
  ctx.arc(0, 0, outerRing.innerRadius, 0, TWO_PI, true);
  ctx.fill();

  // Draw warning ring
  if (shrinkProgress > 0.3) {
    ctx.strokeStyle = `rgba(255, 0, 0, ${Math.min(1, (shrinkProgress - 0.3) * 1.5).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FF0000";
    ctx.beginPath();
    ctx.arc(0, 0, outerRing.outerRadius, 0, TWO_PI);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawGravityArrow(
  ctx: CanvasRenderingContext2D,
  gravityAngle: number,
  canvasW: number,
  _canvasH: number,
): void {
  const arrowX = canvasW / 2;
  const arrowY = 55;
  const len = 30;

  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(gravityAngle + Math.PI / 2);

  ctx.strokeStyle = "#FFDD00";
  ctx.fillStyle = "#FFDD00";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#FFDD00";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, -len / 2);
  ctx.lineTo(0, len / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, len / 2);
  ctx.lineTo(-8, len / 2 - 12);
  ctx.lineTo(8, len / 2 - 12);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function _drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  isLocal: boolean,
  isMobile: boolean,
): void {
  if (!player.isAlive) return;

  const blur = isMobile ? 10 : 20;

  if (player.isInvisible && !isLocal) {
    ctx.globalAlpha = 0.15;
  }

  // Phase walk ghost effect
  if (player.phaseWalkActive) {
    ctx.shadowBlur = blur * 2;
    ctx.shadowColor = "#88CCFF";
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.75;
    ctx.strokeStyle = "#88CCFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 4, 0, TWO_PI);
    ctx.stroke();
  }

  // Energy shield ring
  if (player.energyShieldActive) {
    ctx.strokeStyle = "#FFAA00";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#FFAA00";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 8, 0, TWO_PI);
    ctx.stroke();
  }

  // Speed boost trail effect
  if (player.speedBoostActive) {
    ctx.shadowBlur = blur * 2;
    ctx.shadowColor = "#FFD700";
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > 20) {
      const angle = Math.atan2(player.vy, player.vx);
      ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.3;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        player.x - Math.cos(angle) * 15,
        player.y - Math.sin(angle) * 15,
        player.radius * 0.6,
        0,
        TWO_PI,
      );
      ctx.fill();
      ctx.globalAlpha = player.isInvisible && !isLocal ? 0.15 : 1.0;
    }
  }

  // Hyper dash afterimage
  if (player.hyperDashActive) {
    ctx.shadowBlur = blur * 3;
    ctx.shadowColor = "#FF00FF";
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.5;
    ctx.fillStyle = "#FF00FF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 1.6, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = player.isInvisible && !isLocal ? 0.15 : 1.0;
  }

  // Dash afterimage
  if (player.dashActive) {
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.4;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 1.4, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = player.isInvisible && !isLocal ? 0.15 : 1.0;
  }

  // Time slow ring
  if (player.timeSlowActive) {
    ctx.strokeStyle = "#4466FF";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#4466FF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10, 0, TWO_PI);
    ctx.stroke();
  }

  // Trap immunity ring
  if (player.trapImmune) {
    ctx.strokeStyle = "#00FF88";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00FF88";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 6, 0, TWO_PI);
    ctx.stroke();
  }

  ctx.shadowBlur = blur;
  ctx.shadowColor = player.glowColor;
  ctx.fillStyle = player.color;

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, TWO_PI);
  ctx.fill();

  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (speed > 10) {
    const angle = Math.atan2(player.vy, player.vx);
    const tipX = player.x + Math.cos(angle) * (player.radius + 5);
    const tipY = player.y + Math.sin(angle) * (player.radius + 5);

    ctx.fillStyle = "white";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "white";
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3, 0, TWO_PI);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.arc(
    player.x - player.radius * 0.25,
    player.y - player.radius * 0.25,
    player.radius * 0.35,
    0,
    TWO_PI,
  );
  ctx.fill();

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
}

function drawScanPulse(
  ctx: CanvasRenderingContext2D,
  seeker: Player,
  isMobile: boolean,
  multiScan: boolean,
): void {
  if (!seeker.scanActive) return;

  const pulseCount = multiScan ? 3 : 1;
  for (let p = 0; p < pulseCount; p++) {
    const offset = p * 80;
    const radius = seeker.scanRadius + offset;
    const alpha = 1 - radius / 500;
    if (alpha <= 0) continue;

    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = SEEKER_COLOR;
    ctx.lineWidth = 2;
    ctx.shadowBlur = isMobile ? 8 : 16;
    ctx.shadowColor = SEEKER_COLOR;

    ctx.beginPath();
    ctx.arc(seeker.x, seeker.y, Math.max(0, radius), 0, TWO_PI);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): void {
  for (const p of particles) {
    if (p.life <= 0) continue;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.life, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

function drawFogOfWar(
  ctx: CanvasRenderingContext2D,
  player: Player,
  _canvasW: number,
  _canvasH: number,
  fogRadius: number,
  zoom: number,
): void {
  const screenFogR = fogRadius * zoom;
  const cx = player.x;
  const cy = player.y;

  const grad = ctx.createRadialGradient(
    cx,
    cy,
    screenFogR * 0.3,
    cx,
    cy,
    screenFogR,
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.7, "rgba(2,4,8,0.7)");
  grad.addColorStop(1, "rgba(2,4,8,0.97)");

  ctx.fillStyle = grad;
  ctx.fillRect(
    cx - screenFogR * 3,
    cy - screenFogR * 3,
    screenFogR * 6,
    screenFogR * 6,
  );
}

// ─── Player effects (without the main body rendering) ─────────────────────
function drawPlayerEffects(
  ctx: CanvasRenderingContext2D,
  player: Player,
  isLocal: boolean,
  isMobile: boolean,
): void {
  if (!player.isAlive) return;
  const blur = isMobile ? 10 : 20;

  if (player.isInvisible && !isLocal) {
    ctx.globalAlpha = 0.15;
  }

  if (player.phaseWalkActive) {
    ctx.save();
    ctx.shadowBlur = blur * 2;
    ctx.shadowColor = "#88CCFF";
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.75;
    ctx.strokeStyle = "#88CCFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 4, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  if (player.timeSlowActive) {
    ctx.save();
    ctx.strokeStyle = "#4466FF";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#4466FF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  if (player.trapImmune) {
    ctx.save();
    ctx.strokeStyle = "#00FF88";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00FF88";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 6, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  if (player.speedBoostActive) {
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > 20) {
      ctx.save();
      const angle = Math.atan2(player.vy, player.vx);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#FFD700";
      ctx.shadowBlur = blur * 2;
      ctx.shadowColor = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        player.x - Math.cos(angle) * 15,
        player.y - Math.sin(angle) * 15,
        player.radius * 0.6,
        0,
        TWO_PI,
      );
      ctx.fill();
      ctx.restore();
    }
  }

  if (player.hyperDashActive) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#FF00FF";
    ctx.shadowBlur = blur * 3;
    ctx.shadowColor = "#FF00FF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 1.6, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  if (player.dashActive) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 1.4, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
  localPlayerIndex: number,
): void {
  const isMobile = isMobileDevice();
  const { players, maze } = state;

  const localPlayer = players[localPlayerIndex] || players[0];
  if (localPlayer) {
    camera.x = lerp(camera.x, localPlayer.x, 0.08);
    camera.y = lerp(camera.y, localPlayer.y, 0.08);
  }

  const outerR = maze.rings[maze.rings.length - 1]?.outerRadius || 200;
  const margin = 80;
  const targetZoom = Math.min(canvasW, canvasH) / (2 * (outerR + margin));
  camera.zoom = lerp(camera.zoom, targetZoom, 0.05);

  // Dynamic background engine (replaces static background)
  const bgTime = performance.now() / 1000;
  renderBackground(ctx, state.currentLevel, 0.016, canvasW, canvasH, bgTime);

  ctx.save();
  // Apply screen shake
  ctx.translate(
    canvasW / 2 + state.screenShakeX,
    canvasH / 2 + state.screenShakeY,
  );
  ctx.scale(camera.zoom, camera.zoom * 0.88);
  ctx.translate(-camera.x, -camera.y);

  drawZones(ctx, maze);
  drawCenterHub(ctx, maze, isMobile);
  drawRingWalls(ctx, maze, isMobile);

  // Draw shrinking maze overlay
  if (state.levelConfig.shrinkingMaze && state.shrinkProgress > 0) {
    drawShrinkingMaze(ctx, maze, state.shrinkProgress);
  }

  // Draw teleport portals
  if (state.teleportPortals.length > 0) {
    drawTeleportPortals(ctx, state.teleportPortals);
  }

  // Draw scan pulses for all seekers
  for (const p of players) {
    if (p.role === "seeker") {
      drawScanPulse(ctx, p, isMobile, state.levelConfig.multiScan);
    }
  }

  // Draw particles
  drawParticles(ctx, state.particles);

  // Draw players with character sprites
  for (let i = 0; i < players.length; i++) {
    const isLocal = i === localPlayerIndex;
    const p = players[i];
    if (!p.isAlive) continue;

    // Draw ability effects first (from drawPlayer logic)
    drawPlayerEffects(ctx, p, isLocal, isMobile);

    // Draw human-like character sprite
    const role = p.role === "hider" ? "hider" : "seeker";
    drawCharacter(ctx, p, frameTimeMs, role);
  }

  // Fog of war overlay
  if (state.levelConfig.fogRadius !== null && localPlayer) {
    drawFogOfWar(
      ctx,
      localPlayer,
      canvasW,
      canvasH,
      state.levelConfig.fogRadius,
      camera.zoom,
    );
  }

  ctx.restore();

  // Gravity arrow indicator (screen space)
  if (state.levelConfig.hasGravityShift && state.gravityShiftActive) {
    drawGravityArrow(ctx, state.gravityAngle, canvasW, canvasH);
  }

  // Screen edge fire flash
  if (
    state.levelConfig.hasMovingFireZones &&
    localPlayer &&
    localPlayer.isAlive
  ) {
    const hiderPlayer = players.find((p) => p.role === "hider" && p.isHuman);
    if (hiderPlayer) {
      const dist = Math.sqrt(
        hiderPlayer.x * hiderPlayer.x + hiderPlayer.y * hiderPlayer.y,
      );
      const angle =
        ((Math.atan2(hiderPlayer.y, hiderPlayer.x) % TWO_PI) + TWO_PI) % TWO_PI;
      let inFire = false;
      for (const zone of maze.zones) {
        if (zone.type !== "fire") continue;
        const ring = maze.rings[zone.ringIndex];
        if (!ring) continue;
        if (dist >= ring.innerRadius - 5 && dist <= ring.outerRadius + 5) {
          if (zone.startAngle <= zone.endAngle) {
            if (angle >= zone.startAngle && angle <= zone.endAngle)
              inFire = true;
          } else {
            if (angle >= zone.startAngle || angle <= zone.endAngle)
              inFire = true;
          }
        }
      }
      if (inFire) {
        const edgeGrad = ctx.createRadialGradient(
          canvasW / 2,
          canvasH / 2,
          Math.min(canvasW, canvasH) * 0.35,
          canvasW / 2,
          canvasH / 2,
          Math.max(canvasW, canvasH) * 0.7,
        );
        edgeGrad.addColorStop(0, "rgba(255,50,0,0)");
        edgeGrad.addColorStop(1, "rgba(255,50,0,0.35)");
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }
    }
  }

  // Blackout overlay (rendered absolutely last)
  if (state.blackoutActive) {
    ctx.fillStyle = "rgba(0,0,0,0.97)";
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Shrink danger overlay on screen edges
  if (state.levelConfig.shrinkingMaze && state.shrinkProgress > 0.6) {
    const dangerAlpha = (state.shrinkProgress - 0.6) * 2;
    const edgeGrad = ctx.createRadialGradient(
      canvasW / 2,
      canvasH / 2,
      Math.min(canvasW, canvasH) * 0.4,
      canvasW / 2,
      canvasH / 2,
      Math.max(canvasW, canvasH) * 0.7,
    );
    edgeGrad.addColorStop(0, "rgba(180,0,0,0)");
    edgeGrad.addColorStop(
      1,
      `rgba(180,0,0,${Math.min(0.5, dangerAlpha).toFixed(2)})`,
    );
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
}

export function resetCamera(): void {
  camera = { x: 0, y: 0, zoom: 1 };
}

// Animated menu maze preview
let menuAngle = 0;

export function renderMenuBackground(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  dt: number,
): void {
  menuAngle += dt * 0.3;

  ctx.clearRect(0, 0, canvasW, canvasH);

  const grad = ctx.createRadialGradient(
    canvasW / 2,
    canvasH / 2,
    0,
    canvasW / 2,
    canvasH / 2,
    Math.max(canvasW, canvasH) / 2,
  );
  grad.addColorStop(0, "#060D1A");
  grad.addColorStop(1, "#020408");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.globalAlpha = 0.3;

  const scale = Math.min(canvasW, canvasH) / 600;
  ctx.scale(scale, scale * 0.85);

  for (let i = 0; i < 5; i++) {
    const r = 50 + i * 38;
    const color = i % 2 === 0 ? WALL_CYAN : WALL_PURPLE;
    const blur = 10;

    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    const numArcs = 3;
    const arcSpan = (TWO_PI / numArcs) * 0.7;
    for (let j = 0; j < numArcs; j++) {
      const offset =
        (j / numArcs) * TWO_PI + menuAngle * (i % 2 === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.arc(0, 0, r, offset, offset + arcSpan);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 30;
  ctx.shadowColor = WALL_CYAN;
  ctx.fillStyle = "rgba(0,230,255,0.2)";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, TWO_PI);
  ctx.fill();

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.restore();
}
