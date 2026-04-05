# All Mood Be Happy - Advanced Emotional Support Platform

## Current State
The app has:
- Internet Identity login required to post (authenticated-only)
- Basic navbar without dark mode
- Simple PostComposer with 500 char limit
- Basic CommunityFeed with mood filter via selectedMood prop
- PostCard with support/meToo reactions and inline comments
- Sidebar with static solution tips
- No Mood Music feature
- No Global Chat feature
- No emotion detection
- No floating music player
- Light mode only
- Backend supports anonymous calls (createPost does not require auth)

## Requested Changes (Diff)

### Add
- Dark mode toggle in navbar with localStorage persistence and smooth CSS transitions
- Anonymous posting: "Anonymous Friend" as display name when user is not logged in
- Mood Music section: curated YouTube song lists per emotion (3-5 songs), embedded YouTube iframe player, play button, refresh songs
- Global Chat section: anonymous nickname system, mood-based chat, AI fallback responses, typing indicator, report/block UI
- Emotion detection from textarea content: keyword-based emotion classifier, auto-select mood
- Floating music player: fixed bottom-right, play/pause, volume slider, minimize
- Read more / Show less for long posts (>200 chars)
- Character counter without limit (remove maxLength)
- Auto-growing textarea
- Success toast after posting
- Dynamic post count display
- Emotion color border on post cards
- Scroll reveal animations throughout
- Vibrant emotion card colors with gradients

### Modify
- PostComposer: remove login gate, allow anonymous posting, remove 500 char limit, add emotion detection, auto-grow textarea
- PostCard: add read more/show less, show "Anonymous Friend" for unknown authors, add emotion color border
- Navbar: add dark mode toggle (sun/moon icon), remove login button (or make optional)
- CommunityFeed: add post count badge, keep emotion filter
- index.css: add dark mode variables, smooth transitions
- App.tsx: remove ProfileSetupModal dependency, add chat + music sections, add floating player
- Backend: createPost already works without strict auth (caller can be anonymous principal)

### Remove
- Login requirement for posting (keep login optional/hidden)
- ProfileSetupModal from main flow
- 500 character limit
- truncatePrincipal display for authors (replace with "Anonymous Friend" or nickname)

## Implementation Plan
1. Update index.css: add dark mode CSS variables, smooth transition on body/html
2. Update Navbar: add dark mode toggle, remove login button prominence
3. Update PostComposer: remove auth gate, auto-grow textarea, no char limit, emotion detection, anonymous posting
4. Update PostCard: read more/show less, anonymous author display, emotion color border
5. Update CommunityFeed: post count, improved card design
6. Add MoodMusic component: YouTube embeds per mood, play/refresh
7. Add GlobalChat component: anonymous chat UI with AI fallback, typing indicator, report/block
8. Add FloatingMusicPlayer component: fixed position, controls
9. Update App.tsx: integrate all new components, remove profile modal, add dark mode state
10. Update tailwind.config.js for dark mode support
