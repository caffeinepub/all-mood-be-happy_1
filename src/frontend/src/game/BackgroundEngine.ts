// ============================================================
// Background Engine — Extreme Horror System (Level 1–50)
// 5 tiers: Fog / Shadows / Pulse / Distortion / Extreme
// ============================================================

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 600;

// ── Types ──────────────────────────────────────────────────

interface FogParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  targetOpacity: number;
  radius: number;
  color: [number, number, number];
  life: number;
  maxLife: number;
}

interface GhostEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  scale: number;
  opacity: number;
  fadeDir: number; // 1 = fade in, -1 = fade out
  type: "silhouette" | "face";
  spawnTimer: number;
}

interface ParallaxLayer {
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
}

interface GlitchBand {
  y: number;
  height: number;
  offsetX: number;
  opacity: number;
  life: number;
}

interface BlackoutState {
  active: boolean;
  opacity: number;
  duration: number;
  timer: number;
  nextBlackout: number;
}

interface ScreenShake {
  x: number;
  y: number;
  intensity: number;
  decay: number;
}

interface BackgroundState {
  fogParticles: FogParticle[];
  ghosts: GhostEntity[];
  parallaxLayers: ParallaxLayer[];
  glitchBands: GlitchBand[];
  blackout: BlackoutState;
  screenShake: ScreenShake;
  flashTimer: number;
  flashActive: boolean;
  flashDuration: number;
  flashColor: [number, number, number];
  heartbeatPhase: number;
  heartbeatPulse: number;
  distortionPhase: number;
  glowPulsePhase: number;
  whisperTimer: number;
  ghostSpawnTimer: number;
  fpsBuffer: number[];
  lastFpsTime: number;
  currentFps: number;
  time: number;
  lastLevel: number;
  initialized: boolean;
}

// ── Singleton state ────────────────────────────────────────

const state: BackgroundState = {
  fogParticles: [],
  ghosts: [],
  parallaxLayers: [],
  glitchBands: [],
  blackout: {
    active: false,
    opacity: 0,
    duration: 0,
    timer: 0,
    nextBlackout: 30,
  },
  screenShake: { x: 0, y: 0, intensity: 0, decay: 0 },
  flashTimer: 0,
  flashActive: false,
  flashDuration: 0,
  flashColor: [200, 0, 0],
  heartbeatPhase: 0,
  heartbeatPulse: 1,
  distortionPhase: 0,
  glowPulsePhase: 0,
  whisperTimer: 0,
  ghostSpawnTimer: 0,
  fpsBuffer: [],
  lastFpsTime: 0,
  currentFps: 60,
  time: 0,
  lastLevel: -1,
  initialized: false,
};

// ── Helpers ────────────────────────────────────────────────

function getTier(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level <= 10) return 1;
  if (level <= 20) return 2;
  if (level <= 30) return 3;
  if (level <= 40) return 4;
  return 5;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getFogColor(level: number): [number, number, number] {
  const tier = getTier(level);
  if (tier === 1) return [80, 100, 220];
  if (tier === 2) return [60, 60, 170];
  if (tier === 3) return Math.random() > 0.5 ? [180, 50, 60] : [40, 160, 60];
  if (tier === 4) return [200, 30, 30];
  return [220, 20, 20];
}

function createFogParticle(w: number, h: number, level: number): FogParticle {
  const tier = getTier(level);
  const speedMult = [1, 1.4, 2.2, 3.0, 4.0][tier - 1];
  const baseOpacity = [0.12, 0.15, 0.2, 0.25, 0.3][tier - 1];
  const color = getFogColor(level);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 20 * speedMult,
    vy: (Math.random() - 0.5) * 14 * speedMult,
    opacity: 0,
    targetOpacity: baseOpacity * (0.5 + Math.random() * 0.5),
    radius: 2.5 + Math.random() * 4,
    color,
    life: Math.random(),
    maxLife: 1,
  };
}

function createGhost(
  w: number,
  h: number,
  level: number,
  type: "silhouette" | "face" = "silhouette",
): GhostEntity {
  const tier = getTier(level);
  const speed = [8, 14, 20, 28, 36][tier - 1];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed * 0.7,
    phase: Math.random() * Math.PI * 2,
    scale: 0.5 + Math.random() * 0.9,
    opacity: 0,
    fadeDir: 1,
    type,
    spawnTimer: 0,
  };
}

function createParallaxLayers(level: number): ParallaxLayer[] {
  const tier = getTier(level);
  const count = tier + 1; // 2–6 layers
  const layers: ParallaxLayer[] = [];
  for (let i = 0; i < count; i++) {
    const speed = (i + 1) * 3;
    layers.push({
      offsetX: Math.random() * 200,
      offsetY: Math.random() * 200,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed * 0.6,
      color: getParallaxColor(level, i),
      opacity: 0.03 + i * 0.015,
    });
  }
  return layers;
}

function getParallaxColor(level: number, idx: number): string {
  const tier = getTier(level);
  const palettes: string[][] = [
    // Tier 1: blue/purple
    ["#1a1560", "#200a40", "#0d0a30"],
    // Tier 2: dark purple/grey
    ["#0d0824", "#180c30", "#0a0516"],
    // Tier 3: green/red mix
    ["#0d2010", "#200808", "#102010"],
    // Tier 4: deep red
    ["#200404", "#180202", "#100101"],
    // Tier 5: near black-red
    ["#1a0202", "#120101", "#0a0000"],
  ];
  const p = palettes[tier - 1];
  return p[idx % p.length];
}

// ── Init ───────────────────────────────────────────────────

export function initBackground(level: number, w: number, h: number): void {
  const tier = getTier(level);
  const mobile = isMobile();
  state.lastLevel = level;
  state.initialized = true;
  state.time = 0;
  state.heartbeatPhase = 0;
  state.heartbeatPulse = 1;
  state.distortionPhase = 0;
  state.glowPulsePhase = 0;
  state.whisperTimer = 15 + Math.random() * 20;
  state.ghostSpawnTimer = 5 + Math.random() * 10;
  state.glitchBands = [];
  state.screenShake = { x: 0, y: 0, intensity: 0, decay: 0 };

  // Blackout config for tier 5
  state.blackout = {
    active: false,
    opacity: 0,
    duration: 0,
    timer: 0,
    nextBlackout: tier >= 5 ? 10 + Math.random() * 15 : 9999,
  };

  // Flash config
  state.flashActive = false;
  state.flashDuration = 0;
  state.flashTimer = tier >= 2 ? 8 + Math.random() * 6 : 9999;
  state.flashColor =
    tier >= 4 ? [220, 10, 10] : tier >= 3 ? [180, 20, 20] : [150, 50, 50];

  // Fog particles
  const maxFog = mobile
    ? [12, 16, 20, 24, 28][tier - 1]
    : [20, 28, 36, 44, 52][tier - 1];
  state.fogParticles = [];
  for (let i = 0; i < maxFog; i++) {
    state.fogParticles.push(createFogParticle(w, h, level));
  }

  // Ghost entities
  const ghostCount = [0, 2, 4, 5, 6][tier - 1];
  state.ghosts = [];
  for (let i = 0; i < ghostCount; i++) {
    const type = tier >= 4 ? "face" : "silhouette";
    state.ghosts.push(createGhost(w, h, level, type));
  }

  // Parallax layers
  state.parallaxLayers = createParallaxLayers(level);
}

// ── Ghost drawing ──────────────────────────────────────────

function drawGhostSilhouette(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  scale: number,
  opacity: number,
): void {
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "rgba(190, 200, 255, 1)";
  ctx.beginPath();
  ctx.arc(0, -22, 18, Math.PI, 0);
  ctx.lineTo(18, 12);
  for (let i = 0; i < 3; i++) {
    const bx = 18 - (i + 1) * 12;
    ctx.quadraticCurveTo(bx + 6, 20, bx, 12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGhostFace(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  scale: number,
  opacity: number,
  time: number,
): void {
  ctx.save();
  ctx.translate(gx, gy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  // Distorted oval head
  const wobble = Math.sin(time * 3 + gx * 0.01) * 3;
  ctx.fillStyle = "rgba(180, 170, 200, 1)";
  ctx.beginPath();
  ctx.ellipse(wobble, 0, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark hollow eyes
  ctx.fillStyle = "rgba(10, 0, 20, 1)";
  ctx.beginPath();
  ctx.ellipse(-8 + wobble * 0.5, -6, 6, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8 + wobble * 0.5, -6, 6, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Screaming mouth
  ctx.beginPath();
  ctx.ellipse(wobble, 10, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Parallax rendering ─────────────────────────────────────

function renderParallax(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
): void {
  for (const layer of state.parallaxLayers) {
    layer.offsetX += layer.vx * dt;
    layer.offsetY += layer.vy * dt;
    // Wrap offset
    if (layer.offsetX > 200) layer.offsetX -= 200;
    if (layer.offsetX < -200) layer.offsetX += 200;
    if (layer.offsetY > 200) layer.offsetY -= 200;
    if (layer.offsetY < -200) layer.offsetY += 200;

    ctx.globalAlpha = layer.opacity;
    ctx.fillStyle = layer.color;
    // Draw offset tiled rect for parallax feel
    ctx.fillRect(layer.offsetX % 200, layer.offsetY % 200, w + 200, h + 200);
  }
  ctx.globalAlpha = 1;
}

// ── Glitch bands ───────────────────────────────────────────

function spawnGlitchBand(_w: number, h: number): void {
  state.glitchBands.push({
    y: Math.random() * h,
    height: 1 + Math.random() * 4,
    offsetX: (Math.random() - 0.5) * 20,
    opacity: 0.08 + Math.random() * 0.12,
    life: 0.05 + Math.random() * 0.1,
  });
}

function renderGlitchBands(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
  level: number,
): void {
  const tier = getTier(level);
  // Spawn rate scales with tier
  const spawnChance = [0, 0, 0.04, 0.12, 0.25][tier - 1];
  if (Math.random() < spawnChance) spawnGlitchBand(w, h);

  for (let i = state.glitchBands.length - 1; i >= 0; i--) {
    const band = state.glitchBands[i];
    band.life -= dt;
    if (band.life <= 0) {
      state.glitchBands.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = band.opacity * (band.life / 0.1);
    ctx.fillStyle = tier >= 5 ? "rgba(255,20,20,1)" : "rgba(200,200,200,1)";
    ctx.fillRect(band.offsetX, band.y, w, band.height);
    ctx.restore();
  }
}

// ── Glow pulse (tier 3) ────────────────────────────────────

function renderGlowPulse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
  level: number,
): void {
  state.glowPulsePhase += dt * 2.5;
  const pulse = 0.5 + Math.sin(state.glowPulsePhase) * 0.5;
  const tier = getTier(level);

  // Green/red alternating pulses for tier 3
  if (tier === 3) {
    const greenAlpha = Math.max(0, Math.sin(state.glowPulsePhase)) * 0.04;
    const redAlpha = Math.max(0, -Math.sin(state.glowPulsePhase)) * 0.05;
    if (greenAlpha > 0) {
      ctx.fillStyle = `rgba(0, 180, 40, ${greenAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (redAlpha > 0) {
      ctx.fillStyle = `rgba(200, 20, 20, ${redAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Stronger red pulsing for tier 4+
  if (tier >= 4) {
    const alpha = pulse * 0.06;
    ctx.fillStyle = `rgba(200, 0, 0, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// ── Wave distortion (tier 4+) ──────────────────────────────

function renderWaveDistortion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
): void {
  state.distortionPhase += dt * 1.8;
  const stripeH = 4;
  const numStripes = Math.ceil(h / stripeH);
  for (let i = 0; i < numStripes; i++) {
    const yPos = i * stripeH;
    const xOff = Math.sin(state.distortionPhase + i * 0.15) * 2.5;
    if (Math.abs(xOff) < 0.5) continue;
    ctx.save();
    ctx.globalAlpha = 0.04;
    // Shift horizontal stripe slightly
    const imgData = ctx.getImageData(0, yPos, w, stripeH);
    ctx.putImageData(imgData, Math.round(xOff), yPos);
    ctx.restore();
  }
}

// ── Heartbeat pulse (tier 4+) ──────────────────────────────

function updateHeartbeat(dt: number, level: number): number {
  const tier = getTier(level);
  if (tier < 4) return 1;
  // BPM scales with level: 60 at L31, up to 120 at L50
  const bpm = lerp(60, 120, (level - 31) / 19);
  const period = 60 / bpm;
  state.heartbeatPhase = (state.heartbeatPhase + dt / period) % 1;
  // Double-beat shape: two bumps per cycle
  const t = state.heartbeatPhase;
  const beat1 = Math.exp(-((t - 0.15) ** 2) / 0.004) * 0.006;
  const beat2 = Math.exp(-((t - 0.25) ** 2) / 0.003) * 0.004;
  state.heartbeatPulse = 1 + beat1 + beat2;
  return state.heartbeatPulse;
}

// ── Blackout system (tier 5) ───────────────────────────────

function updateBlackout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
): void {
  const b = state.blackout;
  if (!b.active) {
    b.nextBlackout -= dt;
    if (b.nextBlackout <= 0) {
      b.active = true;
      b.duration = 0.5 + Math.random() * 0.5; // 0.5–1 sec
      b.timer = 0;
      b.opacity = 0;
    }
    return;
  }

  b.timer += dt;
  const progress = b.timer / b.duration;
  // Fade in then out
  if (progress < 0.2) {
    b.opacity = progress / 0.2;
  } else if (progress < 0.8) {
    b.opacity = 1;
  } else {
    b.opacity = 1 - (progress - 0.8) / 0.2;
  }

  if (b.timer >= b.duration) {
    b.active = false;
    b.opacity = 0;
    b.nextBlackout = 8 + Math.random() * 12;
  }

  if (b.opacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${b.opacity.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// ── Screen shake (tier 3+) ─────────────────────────────────

export function triggerScreenShake(intensity: number): void {
  state.screenShake.intensity = Math.max(
    state.screenShake.intensity,
    intensity,
  );
  state.screenShake.decay = intensity * 8;
}

function updateScreenShake(dt: number): { x: number; y: number } {
  const s = state.screenShake;
  if (s.intensity <= 0.01) return { x: 0, y: 0 };
  s.intensity = Math.max(0, s.intensity - s.decay * dt);
  const angle = Math.random() * Math.PI * 2;
  s.x = Math.cos(angle) * s.intensity;
  s.y = Math.sin(angle) * s.intensity;
  return { x: s.x, y: s.y };
}

// ── FPS tracking ───────────────────────────────────────────

function updateFps(dt: number): number {
  const now = performance.now();
  if (now - state.lastFpsTime > 1000) {
    if (state.fpsBuffer.length > 0) {
      state.currentFps =
        state.fpsBuffer.reduce((a, b) => a + b, 0) / state.fpsBuffer.length;
    }
    state.fpsBuffer = [];
    state.lastFpsTime = now;
  }
  if (dt > 0) state.fpsBuffer.push(1 / dt);
  return state.currentFps;
}

// ── Main render function ───────────────────────────────────

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  level: number,
  dt: number,
  w: number,
  h: number,
  time: number,
): void {
  if (!state.initialized || state.lastLevel !== level) {
    initBackground(level, w, h);
  }

  state.time = time;
  const tier = getTier(level);
  const fps = updateFps(dt);
  // Reduce effects when FPS is low
  const fpsMultiplier = fps < 30 ? 0.5 : fps < 45 ? 0.75 : 1;

  ctx.clearRect(0, 0, w, h);

  // ── Base gradient ──
  const gradColors: [string, string][] = [
    ["#05091A", "#020408"], // Tier 1: dark blue
    ["#030611", "#010206"], // Tier 2: very dark blue
    ["#0C0410", "#050108"], // Tier 3: dark purple-red
    ["#0E0204", "#060000"], // Tier 4: dark red
    ["#110102", "#080000"], // Tier 5: near black
  ];
  const [gc0, gc1] = gradColors[tier - 1];
  const grad = ctx.createRadialGradient(
    w / 2,
    h / 2,
    0,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.6,
  );
  grad.addColorStop(0, gc0);
  grad.addColorStop(1, gc1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ── Parallax layers ──
  renderParallax(ctx, w, h, dt);

  // ── Heartbeat pulse scale (tier 4+) ──
  const hbScale = updateHeartbeat(dt, level);
  if (tier >= 4 && hbScale !== 1) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(hbScale, hbScale);
    ctx.translate(-w / 2, -h / 2);
    // Will restore after fog/ghosts
  }

  // ── Fog particles ──
  const fogLimit =
    fpsMultiplier < 1
      ? Math.floor(state.fogParticles.length * fpsMultiplier)
      : state.fogParticles.length;

  for (let i = 0; i < fogLimit; i++) {
    const p = state.fogParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 0.06;

    // Wrap
    if (p.x < -30) p.x = w + 30;
    if (p.x > w + 30) p.x = -30;
    if (p.y < -30) p.y = h + 30;
    if (p.y > h + 30) p.y = -30;

    // Fade in/out
    p.opacity = lerp(p.opacity, p.targetOpacity, dt * 4);

    if (p.life <= 0) {
      state.fogParticles[i] = createFogParticle(w, h, level);
      continue;
    }

    const alpha = p.opacity * Math.min(1, p.life * 2);
    if (alpha < 0.005) continue;

    const [r, g, b] = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    ctx.fill();
  }

  // ── Glow pulse (tier 3+) ──
  if (tier >= 3) {
    renderGlowPulse(ctx, w, h, dt, level);
  }

  // ── Ghost entities ──
  if (tier >= 2) {
    // Random ghost spawn
    state.ghostSpawnTimer -= dt;
    if (state.ghostSpawnTimer <= 0) {
      const maxGhosts = [0, 2, 4, 5, 8][tier - 1];
      if (state.ghosts.length < maxGhosts) {
        const type = tier >= 4 ? "face" : "silhouette";
        state.ghosts.push(createGhost(w, h, level, type));
      }
      state.ghostSpawnTimer = 3 + Math.random() * 8;
    }

    for (let i = state.ghosts.length - 1; i >= 0; i--) {
      const ghost = state.ghosts[i];
      ghost.phase += dt * 0.5;
      ghost.x += ghost.vx * dt;
      ghost.y += ghost.vy * dt;

      // Wrap
      if (ghost.x < -80) ghost.x = w + 80;
      if (ghost.x > w + 80) ghost.x = -80;
      if (ghost.y < -100) ghost.y = h + 100;
      if (ghost.y > h + 100) ghost.y = -100;

      // Fade in/out
      const maxOpacity = tier >= 5 ? 0.12 : tier >= 4 ? 0.09 : 0.06;
      ghost.opacity += ghost.fadeDir * dt * 0.3;
      if (ghost.opacity >= maxOpacity) {
        ghost.opacity = maxOpacity;
        ghost.fadeDir = -1;
      } else if (ghost.opacity <= 0) {
        // Remove or restart ghost
        if (Math.random() < 0.3) {
          state.ghosts.splice(i, 1);
        } else {
          ghost.opacity = 0;
          ghost.fadeDir = 1;
          ghost.x = Math.random() * w;
          ghost.y = Math.random() * h;
        }
        continue;
      }

      const floatY = ghost.y + Math.sin(ghost.phase) * 10;
      const flickerMult = 0.7 + Math.sin(ghost.phase * 2.7) * 0.3;
      const finalOpacity = ghost.opacity * flickerMult;

      if (ghost.type === "face" && tier >= 4) {
        drawGhostFace(
          ctx,
          ghost.x,
          floatY,
          ghost.scale,
          finalOpacity,
          state.time,
        );
      } else {
        drawGhostSilhouette(ctx, ghost.x, floatY, ghost.scale, finalOpacity);
      }
    }
  }

  if (tier >= 4) {
    ctx.restore(); // End heartbeat scale
  }

  // ── Red flash (tier 2+) ──
  if (tier >= 2) {
    state.flashTimer -= dt;
    if (state.flashActive) {
      state.flashDuration -= dt;
      if (state.flashDuration <= 0) {
        state.flashActive = false;
        const baseInterval = [0, 10, 7, 4, 2][tier - 1];
        state.flashTimer = baseInterval + Math.random() * 4;
      } else {
        const fadeFrac = state.flashDuration / 0.25;
        const [fr, fg, fb] = state.flashColor;
        const alpha = 0.14 * fadeFrac;
        ctx.fillStyle = `rgba(${fr},${fg},${fb},${alpha.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }
    } else if (state.flashTimer <= 0) {
      state.flashActive = true;
      state.flashDuration = 0.15 + Math.random() * 0.1;
    }
  }

  // ── Wave distortion (tier 4+) ──
  if (tier >= 4 && fpsMultiplier >= 0.75) {
    renderWaveDistortion(ctx, w, h, dt);
  }

  // ── Glitch bands (tier 3+) ──
  if (tier >= 3) {
    renderGlitchBands(ctx, w, h, dt, level);
  }

  // ── Blackout (tier 5) ──
  if (tier >= 5) {
    updateBlackout(ctx, w, h, dt);
  }

  // ── Flickering light overlay (tier 2) ──
  if (tier === 2) {
    state.whisperTimer -= dt;
    if (state.whisperTimer <= 0) {
      state.whisperTimer = 8 + Math.random() * 12;
      // Brief flicker
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// ── Screen shake getter (for canvas transform) ─────────────

export function getScreenShakeOffset(dt: number): { x: number; y: number } {
  return updateScreenShake(dt);
}

export function isBlackoutActive(): boolean {
  return state.blackout.active && state.blackout.opacity > 0.5;
}
