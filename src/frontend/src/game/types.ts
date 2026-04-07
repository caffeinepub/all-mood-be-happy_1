// ============================================================
// Game Types — Maze of Abhimanyu (50 Level Edition)
// ============================================================

export type GamePhase =
  | "menu"
  | "modeSelect"
  | "levelSelect"
  | "upgradeShop"
  | "playing"
  | "paused"
  | "gameover";
export type GameMode = "solo" | "duo1v1" | "duo2v1";
export type PlayerRole = "hider" | "seeker";

export interface TeleportPortal {
  id: number;
  x: number;
  y: number;
  radius: number;
  linkedPortalId: number;
  color: string;
  pulseTimer: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  rotationSpeedMult: number;
  gateSpeedMult: number;
  seekerSpeedMult: number;
  fogRadius: number | null;
  hasFakeWalls: boolean;
  hasMovingFireZones: boolean;
  seekerTrapResistant: boolean;
  multiScan: boolean;
  timeLimit: number;
  // New mechanics
  hasGravityShift: boolean;
  hasTeleportPortals: boolean;
  reverseControlsRandom: boolean;
  multipleSeekersCount: number;
  mazeShiftInterval: number | null;
  blackoutInterval: number | null;
  shrinkingMaze: boolean;
  timeFreezeZones: boolean;
  rotationDirectionRandom: boolean;
  pathCollapseEnabled: boolean;
  trapExplosionEnabled: boolean;
  bgTheme: string;
}

export interface UpgradeState {
  invisDuration: number;
  speedBoostUnlocked: boolean;
  speedBoostLevel: number;
  dashUnlocked: boolean;
  trapImmunityUnlocked: boolean;
  trapImmunityDuration: number;
  cooldownReduction: number;
  // New upgrades
  hyperDashUnlocked: boolean;
  phaseWalkUnlocked: boolean;
  timeSlowUnlocked: boolean;
  energyShieldUnlocked: boolean;
  energyShieldCharges: number;
  timeSlowDuration: number;
}

export interface ProgressState {
  unlockedLevels: number[];
  coins: number;
  upgrades: UpgradeState;
  bestTimes: Record<number, number>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  role: PlayerRole;
  color: string;
  glowColor: string;
  isInvisible: boolean;
  invisibleTimer: number;
  invisibleCooldown: number;
  scanActive: boolean;
  scanTimer: number;
  scanCooldown: number;
  scanRadius: number;
  isHuman: boolean;
  isAlive: boolean;
  lastKnownX: number;
  lastKnownY: number;
  wanderAngle: number;
  // Existing ability fields
  dashActive: boolean;
  dashCooldown: number;
  dashDuration: number;
  speedBoostActive: boolean;
  speedBoostTimer: number;
  speedBoostCooldown: number;
  trapImmune: boolean;
  trapImmuneTimer: number;
  trapImmuneCooldown: number;
  selectedAbility: number;
  trapResistant: boolean;
  // New ability fields
  phaseWalkActive: boolean;
  phaseWalkTimer: number;
  phaseWalkCooldown: number;
  timeSlowActive: boolean;
  timeSlowTimer: number;
  timeSlowCooldown: number;
  energyShieldActive: boolean;
  hyperDashActive: boolean;
  hyperDashCooldown: number;
  patternMemory: { x: number; y: number; t: number }[];
}

export interface Gate {
  ringIndex: number;
  startAngle: number;
  endAngle: number;
  isOpen: boolean;
  openTimer: number;
  openDuration: number;
  closedDuration: number;
  openAmount: number;
  collapsedTimer?: number;
}

export interface Ring {
  innerRadius: number;
  outerRadius: number;
  color: string;
  rotationAngle: number;
  rotationSpeed: number;
  gates: Gate[];
  wallSegments: WallSegment[];
}

export interface WallSegment {
  startAngle: number;
  endAngle: number;
  isFake?: boolean;
  disappearTimer?: number;
  isVisible?: boolean;
}

export interface Zone {
  ringIndex: number;
  startAngle: number;
  endAngle: number;
  type: "safe" | "trap" | "fire" | "freeze";
  angularVelocity?: number;
  frozenTimer?: number;
  explosionTimer?: number;
}

export interface MazeData {
  rings: Ring[];
  zones: Zone[];
  numRings: number;
  ringThickness: number;
  innerPadding: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  useAbility: boolean;
  p2up: boolean;
  p2down: boolean;
  p2left: boolean;
  p2right: boolean;
  p2useAbility: boolean;
}

export interface JoystickState {
  active: boolean;
  dx: number;
  dy: number;
}

export interface AIState {
  pathRingIndex: number;
  pathSector: number;
  recalcTimer: number;
  waypoints: { x: number; y: number }[];
  wanderTimer: number;
  patternMemory: { x: number; y: number; t: number }[];
  predictedEscapeX: number;
  predictedEscapeY: number;
  aggressionLevel: number;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  players: Player[];
  maze: MazeData;
  timeLeft: number;
  winner: "hider" | "seeker" | null;
  totalTime: number;
  currentLevel: number;
  levelConfig: LevelConfig;
  coins: number;
  upgrades: UpgradeState;
  particles: Particle[];
  // New state fields
  gravityShiftActive: boolean;
  gravityShiftTimer: number;
  gravityAngle: number;
  reverseControlsActive: boolean;
  reverseControlsTimer: number;
  blackoutActive: boolean;
  blackoutTimer: number;
  blackoutCountdown: number;
  screenShakeX: number;
  screenShakeY: number;
  screenShakeMagnitude: number;
  musicDangerLevel: number;
  teleportPortals: TeleportPortal[];
  multipleSeekerAIs: AIState[];
  heartbeatActive: boolean;
  shrinkProgress: number;
  pathCollapseTimer: number;
  mazeShiftTimer: number;
  heartbeatTimer: number;
  difficulty: string;
}

// ─── New types for advanced systems ──────────────────────────────────────────

export type Difficulty = "easy" | "hard" | "extreme";
export type BgTheme = "dawn" | "shadow" | "horror" | "extreme";
