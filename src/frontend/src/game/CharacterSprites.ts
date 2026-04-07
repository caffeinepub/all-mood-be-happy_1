// ============================================================
// Character Sprites — Pixel-art humanoid drawn with Canvas primitives
// ============================================================

import type { Player } from "./types";

// Frame time accumulator — call updateFrameTime(dt) each frame
let globalFrameTime = 0;

export function updateFrameTime(dt: number): number {
  globalFrameTime += dt * 1000; // convert to ms
  return globalFrameTime;
}

// Determine facing direction from velocity
function getDirection(
  vx: number,
  vy: number,
): "right" | "left" | "up" | "down" {
  if (Math.abs(vx) > Math.abs(vy)) {
    return vx >= 0 ? "right" : "left";
  }
  return vy >= 0 ? "down" : "up";
}

// Get walk frame 0-3 based on accumulated ms
function getWalkFrame(frameTime: number): number {
  return Math.floor((frameTime % 400) / 100);
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  player: Player,
  frameTime: number,
  role: "hider" | "seeker",
): void {
  if (!player.isAlive) return;

  const { x, y, vx, vy, isInvisible } = player;
  const frame = getWalkFrame(frameTime);
  const direction = getDirection(vx, vy);
  const isMoving = Math.abs(vx) + Math.abs(vy) > 5;

  // Colors
  const fillColor = role === "hider" ? "#00ffff" : "#ff4444";
  const glowColor = role === "hider" ? "#00ffff" : "#ff0000";
  const glowBlur = role === "hider" ? 15 : 20;
  const shadowColor =
    role === "seeker" ? "rgba(255,0,0,0.3)" : "rgba(0,255,255,0.3)";

  ctx.save();

  // Invisible: draw at 30% opacity
  if (isInvisible) {
    ctx.globalAlpha = 0.3;
  }

  // Shadow glow
  ctx.shadowBlur = glowBlur;
  ctx.shadowColor = glowColor;

  // Flip for direction
  ctx.translate(x, y);
  if (direction === "left") {
    ctx.scale(-1, 1);
  }

  // Scale factor so character is ~20px tall
  const sc = 1.0;

  // Leg animation
  const legPhase = isMoving ? frame : 0;
  const leg1Offset =
    legPhase === 0 || legPhase === 2 ? 3 : legPhase === 1 ? 6 : 0;
  const leg2Offset =
    legPhase === 0 || legPhase === 2 ? 3 : legPhase === 3 ? 6 : 0;

  // Arm animation
  const arm1Angle = isMoving
    ? legPhase === 1 || legPhase === 3
      ? 0.4
      : -0.4
    : 0;
  const arm2Angle = -arm1Angle;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = 1.5 * sc;

  // ── Legs ──
  ctx.save();
  ctx.shadowBlur = 0;

  // Left leg (3x7 rect)
  ctx.fillRect(-4 * sc, 4 * sc, 3 * sc, leg1Offset * sc + 1 * sc);
  // Right leg
  ctx.fillRect(1 * sc, 4 * sc, 3 * sc, leg2Offset * sc + 1 * sc);
  ctx.restore();

  // ── Torso (8x10 rect) ──
  ctx.save();
  ctx.shadowBlur = glowBlur * 0.5;
  ctx.shadowColor = glowColor;
  ctx.fillRect(-4 * sc, -7 * sc, 8 * sc, 11 * sc);
  ctx.restore();

  // ── Head (circle 7px) ──
  ctx.save();
  ctx.shadowBlur = glowBlur;
  ctx.shadowColor = glowColor;
  ctx.beginPath();
  ctx.arc(0, -11 * sc, 5 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Arms (lines) ──
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2 * sc;
  ctx.strokeStyle = fillColor;

  // Left arm
  ctx.save();
  ctx.translate(-4 * sc, -4 * sc);
  ctx.rotate(-arm1Angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5 * sc, 5 * sc);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(4 * sc, -4 * sc);
  ctx.rotate(arm2Angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5 * sc, 5 * sc);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // ── Ground shadow ──
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = isInvisible ? 0.1 : 0.25;
  const grad = ctx.createRadialGradient(0, 12 * sc, 0, 0, 12 * sc, 8 * sc);
  grad.addColorStop(0, shadowColor);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 12 * sc, 8 * sc, 3 * sc, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Energy shield / special effects drawn on top ──
  if (player.energyShieldActive) {
    ctx.save();
    ctx.strokeStyle = "#FFAA00";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#FFAA00";
    ctx.globalAlpha = isInvisible ? 0.2 : 1.0;
    ctx.beginPath();
    ctx.arc(0, -3 * sc, 13 * sc, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (player.phaseWalkActive) {
    ctx.save();
    ctx.strokeStyle = "#88CCFF";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#88CCFF";
    ctx.globalAlpha = isInvisible ? 0.2 : 0.7;
    ctx.beginPath();
    ctx.arc(0, -3 * sc, 15 * sc, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (player.timeSlowActive) {
    ctx.save();
    ctx.strokeStyle = "#4466FF";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#4466FF";
    ctx.globalAlpha = isInvisible ? 0.15 : 0.8;
    ctx.beginPath();
    ctx.arc(0, -3 * sc, 17 * sc, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
