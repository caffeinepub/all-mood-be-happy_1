# All Mood Be Happy — 90s Hindi Songs Feature

## Current State
The app is a full-stack emotional support platform on Internet Computer. The sidebar contains a `MoodMusicPlayer` component with 5 English songs per mood (Happy, Sad, Stress, Love, Angry, Anxious, Hopeful). Songs are shown in a collapsible list; clicking play loads a YouTube iframe. No Bollywood/Hindi category exists.

## Requested Changes (Diff)

### Add
- New `HindiSongsPlayer` component (src/frontend/src/components/HindiSongsPlayer.tsx)
  - A dedicated "90s Hindi Songs" section with a collapsible panel
  - 25 curated 90s Bollywood songs with: title, artist, YouTube videoId
  - Categorized by emotion tab: Love, Sad, Happy, Calm
  - Song cards with play button; YouTube iframe loads ONLY on click (lazy load)
  - Only one song plays at a time (stop current before starting new)
  - "Load More" button (show 6 initially, +6 per click)
  - "Shuffle Songs" button (randomizes order within current category)
  - Dark mode + mobile responsive
  - Smooth animations (framer-motion)

### Modify
- `src/frontend/src/App.tsx`: Add `<HindiSongsPlayer />` below `<MoodMusicPlayer>` in the sticky sidebar

### Remove
- Nothing removed

## Implementation Plan
1. Create `HindiSongsPlayer.tsx` with:
   - Static data: 25 songs split across Love/Sad/Happy/Calm categories
   - Tab bar to switch emotion categories
   - State: activeCategory, visibleCount (6, +6 on Load More), shuffledList, playingId
   - Song card: thumbnail placeholder, title, artist, play button
   - On play: set playingId, render YouTube iframe only for that song (stops others)
   - Shuffle: Fisher-Yates shuffle on current category's list, reset visibleCount
   - Load More: increment visibleCount by 6
   - Collapsible header toggle (AnimatePresence)
2. Wire into App.tsx sidebar below MoodMusicPlayer
3. Validate (lint + typecheck + build)
4. Deploy to production
