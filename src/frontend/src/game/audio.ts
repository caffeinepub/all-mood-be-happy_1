// ============================================================
// Audio Engine — Web Audio API, no external files
// ============================================================

let audioCtx: AudioContext | null = null;
let menuGainNode: GainNode | null = null;
let gameGainNode: GainNode | null = null;
let menuOscillators: OscillatorNode[] = [];
let gameIntervalId: ReturnType<typeof setInterval> | null = null;
let currentPhase: "menu" | "game" | "none" = "none";
let currentBPM = 120;
let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let ghostAmbientNode: OscillatorNode | null = null;
let ghostAmbientGain: GainNode | null = null;

export function initAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  } catch (_e) {
    // Audio not supported
  }
}

function getMasterGain(): GainNode {
  if (!audioCtx) throw new Error("No audio context");
  const g = audioCtx.createGain();
  g.gain.value = 0.15;
  g.connect(audioCtx.destination);
  return g;
}

export function startMenuMusic(): void {
  if (!audioCtx || currentPhase === "menu") return;
  stopAllMusic();
  currentPhase = "menu";

  try {
    menuGainNode = getMasterGain();

    const freqs = [80, 160, 240];
    for (const freq of freqs) {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      oscGain.gain.value = 0.3 / freqs.length;

      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(menuGainNode);
      osc.start();
      menuOscillators.push(osc, lfo);
    }
  } catch (_e) {
    // ignore
  }
}

export function startGameMusic(): void {
  if (!audioCtx || currentPhase === "game") return;
  stopAllMusic();
  currentPhase = "game";
  currentBPM = 120;

  try {
    gameGainNode = getMasterGain();
    if (gameGainNode) gameGainNode.gain.value = 0.12;

    let beat = 0;

    const scheduleNext = () => {
      if (currentPhase !== "game") return;
      const beatDuration = 60 / currentBPM;
      if (!audioCtx || !gameGainNode) return;

      const now = audioCtx.currentTime;
      const patterns = [1, 0, 1, 0, 1, 1, 0, 1];

      if (patterns[beat % patterns.length]) {
        playTick(now, beat % 4 === 0 ? 120 : 80, 0.04);
      }

      if (beat % 4 === 0) {
        playDrone(now, 0.3);
      }

      beat++;
      gameIntervalId = setTimeout(scheduleNext, beatDuration * 1000) as any;
    };

    scheduleNext();
  } catch (_e) {
    // ignore
  }
}

export function updateMusicDanger(dangerLevel: number): void {
  // dangerLevel 0-1: drives BPM from 120 to 200
  const targetBPM = 120 + dangerLevel * 80;
  currentBPM = targetBPM;
}

function playTick(when: number, freq: number, gain: number): void {
  if (!audioCtx || !gameGainNode) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
  osc.connect(g);
  g.connect(gameGainNode);
  osc.start(when);
  osc.stop(when + 0.1);
}

function playDrone(when: number, duration: number): void {
  if (!audioCtx || !gameGainNode) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 60;
  g.gain.setValueAtTime(0.08, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(g);
  g.connect(gameGainNode);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

export function stopAllMusic(): void {
  for (const osc of menuOscillators) {
    try {
      osc.stop();
    } catch (_e) {
      /* ignore */
    }
  }
  menuOscillators = [];

  if (gameIntervalId !== null) {
    clearInterval(gameIntervalId);
    clearTimeout(gameIntervalId as any);
    gameIntervalId = null;
  }

  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }

  currentPhase = "none";
}

export function startHeartbeat(): void {
  if (heartbeatIntervalId !== null) return;
  heartbeatIntervalId = setInterval(() => {
    playSoundEffect("heartbeat");
  }, 800);
}

export function stopHeartbeat(): void {
  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

export function startGhostAmbient(): void {
  if (!audioCtx || ghostAmbientNode) return;
  try {
    ghostAmbientGain = audioCtx.createGain();
    ghostAmbientGain.gain.value = 0.02;
    ghostAmbientGain.connect(audioCtx.destination);

    ghostAmbientNode = audioCtx.createOscillator();
    ghostAmbientNode.type = "triangle";
    ghostAmbientNode.frequency.value = 40;
    ghostAmbientNode.connect(ghostAmbientGain);
    ghostAmbientNode.start();
  } catch (_e) {
    // ignore
  }
}

export function stopGhostAmbient(): void {
  if (ghostAmbientNode) {
    try {
      ghostAmbientNode.stop();
    } catch (_e) {
      /* ignore */
    }
    ghostAmbientNode = null;
  }
  ghostAmbientGain = null;
}

export function playSoundEffect(
  type:
    | "move"
    | "invisible"
    | "scan"
    | "capture"
    | "gateClick"
    | "dash"
    | "speedboost"
    | "firedamage"
    | "levelup"
    | "heartbeat"
    | "gravityShift"
    | "portal"
    | "blackout"
    | "explosion"
    | "shieldHit"
    | "phaseWalk"
    | "timeSlow"
    | "footstep"
    | "whisper",
): void {
  if (!audioCtx) return;

  try {
    const now = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(audioCtx.destination);

    switch (type) {
      case "move": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.value = 440;
        osc.type = "sine";
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case "invisible": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }
      case "scan": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = 1200;
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case "capture": {
        for (let i = 0; i < 3; i++) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(400 - i * 100, now + i * 0.1);
          osc.frequency.exponentialRampToValueAtTime(50, now + i * 0.1 + 0.3);
          g.gain.setValueAtTime(0.3, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.5);
        }
        break;
      }
      case "gateClick": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = 600;
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case "dash": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }
      case "speedboost": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case "firedamage": {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = 80;
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case "levelup": {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        for (let i = 0; i < notes.length; i++) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.value = notes[i];
          const t = now + i * 0.15;
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.3);
        }
        break;
      }
      case "heartbeat": {
        // Low thump at 60hz
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = 60;
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case "gravityShift": {
        // Whoosh: sweep 800->200hz
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case "portal": {
        // Teleport zap: 1500->3000->500
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case "blackout": {
        // Low eerie rumble
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = 40;
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.1);
        break;
      }
      case "explosion": {
        // Loud sawtooth burst
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case "shieldHit": {
        // Metallic clang
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case "phaseWalk": {
        // Ghostly sine wave
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        osc.frequency.linearRampToValueAtTime(200, now + 0.6);
        g.gain.setValueAtTime(0.2, now);
        g.gain.setValueAtTime(0.2, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.75);
        break;
      }
      case "timeSlow": {
        // Deep pitch-down sweep
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.75);
        break;
      }
      case "footstep": {
        // Short click
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = 600;
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.015);
        break;
      }
      case "whisper": {
        // White noise burst
        const bufferSize = audioCtx.sampleRate * 0.03;
        const buffer = audioCtx.createBuffer(
          1,
          bufferSize,
          audioCtx.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        source.connect(g);
        g.connect(masterGain);
        source.start(now);
        break;
      }
    }
  } catch (_e) {
    // ignore
  }
}

export function resumeAudio(): void {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}
