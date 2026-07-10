# Classroom Audio / Spotify Plan

Status: planning document  
App: Classroom Command Center  
Related app: OmniNote later

## Purpose

Classroom Audio should let the teacher quickly launch, embed, or assign school-appropriate music and playlists to classroom screens.

Use cases:
- morning arrival
- independent work
- snack
- lunch
- reading calm time
- writing
- cleanup
- carpool
- transitions
- calm reset

## Core Decision

Start with curated playlist links and optional embeds.

Do not begin with full Spotify login, OAuth, Web Playback SDK, or remote playback control.

Reason:
The classroom app must be reliable. Spotify auth, device transfer, autoplay, school network restrictions, and browser limitations can be brittle during class.

## Level 1 — Basic / Reliable

Features:
- curated classroom playlist manifest
- schoolSafe flag
- mood tags
- subject/screen tags
- open playlist in Spotify app/browser
- copy playlist link
- optional Spotify embed iframe
- MusicWidget can appear on selected screens
- teacher-only launcher mode
- student-visible compact “Now Playing / Music” card optional
- fallback if embed fails: open in new tab

Good first screens:
- Homeroom
- Snack/Lunch
- Reading
- Writing/quiet work
- Cleanup
- Carpool

No new dependencies required for Level 1.

Suggested files later:
- `src/data/classroomPlaylists.ts`
- `src/widgets/MusicWidget.tsx`
- `src/widgets/SpotifyEmbedCard.tsx`

## Level 2 — Polished Classroom Audio Widget

Features:
- MusicWidget available on any page
- compact / full / hidden modes
- page-specific default playlist
- playlist picker
- mood presets:
  - Calm Morning
  - Quiet Work
  - Instrumental Focus
  - Classical
  - Modern Classical
  - Acoustic
  - Reading Calm
  - Snack/Lunch Calm
  - Cleanup Energy
  - Carpool Calm
- teacher-only media drawer
- optional student-visible player/playlist card
- screen-specific audio defaults
- volume reminder
- “silent mode” toggle
- routine/phase timer can suggest playlist

Still no required Spotify OAuth.

## Level 3 — Fully Decked Out Spotify / Audio Control

Features:
- Spotify login/OAuth
- Spotify Web Playback SDK
- Spotify Connect device selection
- play/pause/skip from Command Center
- now-playing metadata
- cycle only approved school playlists
- auto-suggest playlist by subject/routine
- playlist rotation
- timer/routine-linked playlist changes
- teacher-only controls
- student-facing clean now-playing card
- possible OmniNote media handoff

Warnings:
- Requires Spotify auth/token handling
- May require Spotify Premium for playback control depending on feature
- May be affected by school network and browser restrictions
- Must include reliable fallback links

## Playlist Manifest Concept

```ts
type ClassroomPlaylist = {
  id: string;
  title: string;
  mood:
    | "calm"
    | "focus"
    | "classical"
    | "modernClassical"
    | "acoustic"
    | "transition"
    | "cleanup"
    | "carpool";
  spotifyUrl: string;
  embedUrl?: string;
  schoolSafe: boolean;
  defaultScreens: string[];
  visibleToStudents: boolean;
  notes?: string;
};
```

## Resource Launcher Integration

Spotify playlists should be treated as media resources.

Open With options:
- Embed on page
- Open in Spotify
- Open in browser
- Copy link
- Teacher-only launch

## Relationship to OmniNote

OmniNote may later support:
- embedded audio/video nodes
- lesson media tabs
- audio-stroke sync
- teacher-controlled lesson media

But Spotify playlist control should begin in Command Center, not OmniNote.

## Build Timing

Recommended roadmap placement:
1. Display layout polish
2. Visibility model
3. Subject modes
4. Today Prep
5. Teacher Material Launcher
6. Classroom Audio / Spotify Level 1
7. YouTube Media Page
8. PDF/HTML Viewer
9. OmniNote handoff
