# Maze of Abhimanyu — Horror Upgrade

## Current State
- Game is a circular (Chakravyuh) maze survival game with 50 levels
- Has puzzle door system: locked gates that require solving math/memory/pattern challenges
- BackgroundEngine.ts has basic fog/ghost system with 4 themes (dawn/shadow/horror/extreme)
- LevelManager.ts tracks `puzzleDoorCount` per level
- MazeGame.tsx wires up PuzzleOverlay.tsx and PuzzleSystem.ts
- PuzzleOverlay.tsx is a full quiz UI that freezes gameplay
- PuzzleSystem.ts generates puzzle door data

## Requested Changes (Diff)

### Add
- Extreme horror background system for levels 1–50 with 5 distinct tiers:
  - L1–10: Light fog particles, dark blue/purple, slow movement
  - L11–20: Ghost shadows moving, flickering light, whisper triggers
  - L21–30: Fast fog + green/red glow pulses, ghost silhouettes, screen shake
  - L31–40: Dark red theme, wave distortion, random glitch flicker, shadow flashes
  - L41–50: EXTREME MODE — heavy distortion, strong glitch, heartbeat pulse, ghost faces, random blackouts
- Particle-based fog with requestAnimationFrame integration
- Parallax background layers
- Random ghost spawn/fade logic
- Horror audio: ambient drone, whispers, footsteps, heartbeat, sharp spikes
- FPS-adaptive particle reduction
- Mobile particle cap

### Modify
- `BackgroundEngine.ts` — Full rewrite with 5-tier horror system L1–50
- `LevelManager.ts` — Remove `puzzleDoorCount` field from config
- `MazeGame.tsx` — Remove all puzzle imports, state, callbacks, game-loop triggers, and JSX

### Remove
- `PuzzleOverlay.tsx` — Delete entirely
- `PuzzleSystem.ts` — Delete entirely
- All locked gates requiring puzzle interaction
- All puzzle proximity detection in game loop
- `createPuzzleDoors`, `handlePuzzleAnswer`, `handlePuzzleTimeout` functions
- `activePuzzle`, `activePuzzleGateId` state and refs

## Implementation Plan
1. Delete `src/frontend/src/components/PuzzleOverlay.tsx`
2. Delete `src/frontend/src/game/PuzzleSystem.ts`
3. Rewrite `BackgroundEngine.ts` with full 5-tier horror system (L1–50)
4. Update `LevelManager.ts` — remove `puzzleDoorCount` from return object and type
5. Update `MazeGame.tsx`:
   - Remove puzzle imports (lines 5-6, 38)
   - Remove `activePuzzleRef`, `activePuzzle`, `activePuzzleGateId` state
   - Remove puzzle proximity block from game loop
   - Remove `createPuzzleDoors` call from `startGame`
   - Remove `handlePuzzleAnswer` and `handlePuzzleTimeout` callbacks
   - Remove `<PuzzleOverlay>` JSX block
   - Replace locked puzzle doors with always-open/random-rotating gates
