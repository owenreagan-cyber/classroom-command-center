# Status — Phase 11D Launch Readiness and Icon

Status: COMPLETE

Date: 2026-07-29

## Goal

Strengthen Command Center validation coverage and add a polished launch icon/app identity for classroom use without changing core architecture or adding new classroom features.

## Icon and App Identity

| Asset | Path | Purpose |
|-------|------|---------|
| SVG source | `public/favicon.svg` | Scalable favicon and future resizing |
| 192px PNG | `public/icon-192.png` | Manifest / Android home screen |
| 512px PNG | `public/icon-512.png` | Manifest splash / high-DPI |
| Apple touch | `public/apple-touch-icon.png` | iPad/iPhone home screen (180px) |
| Generator | `scripts/generate-app-icons.py` | Regenerate PNGs from design spec |

Icon concept: rounded-square gradient background (sky/teal classroom palette), projector-screen dashboard with three widget dots and a stand. No text, no student names, no school identifiers.

PNG sizes: icon-192 ~1.5 KB, icon-512 ~3.9 KB, apple-touch-icon ~1.4 KB.

## Manifest Behavior

File: `public/manifest.webmanifest`

- **name:** Classroom Command Center
- **short_name:** Command Center
- **display:** standalone
- **start_url:** `/control`
- **theme_color:** `#0369a1`
- **background_color:** `#0c4a6e`

`index.html` links favicon, manifest, apple-touch-icon, and sets `theme-color` plus `apple-mobile-web-app-title`.

### Install / Use Notes

**Mac (Safari/Chrome):** Open `/control`, use browser “Add to Dock” or “Install app”. Icon appears as Command Center with standalone window (no browser chrome).

**iPad (Safari):** Open `/control`, Share → Add to Home Screen. Uses `apple-touch-icon.png` and opens in standalone mode at `/control`.

**Student display:** Continue using `/display` on projector/iPad — not intended as the primary install target. Manifest `start_url` points teachers to `/control`.

PWA installability: manifest + icons + standalone display satisfy basic install criteria; no service worker added in this phase (offline board state remains via existing local persistence).

## Tests Added

### E2E — `tests/e2e/launch-readiness.spec.ts`

- `/control` and `/display` load without crashing
- Favicon, manifest, and apple-touch-icon links in `index.html`
- Manifest and icon assets served with correct metadata
- Teacher dock on `/control`, absent on `/display`
- Today Prep lesson context (`Active context`) renders
- Morning Message Studio renders
- Timer UI renders (Timers heading, Phase Timer, Start button)

### E2E — `tests/e2e/display-privacy-regression.spec.ts`

Verifies `/display` does NOT expose:

- Teacher notes, teacher key, answer key
- Readiness metadata strings
- OmniNote handoff URLs
- `.local` file paths
- Canvas URLs, tokens, email-like patterns
- Teacher dock, prep controls, Material Launcher, Morning Message Studio editor
- Secret URLs/notes after “Show on Display” workflow

### OmniNote Handoff — extended `src/features/omninote-handoff/tests.ts`

- Saxon Math Lesson 2 export (existing)
- Shurley Chapter 1 Lesson 3 export + title validation
- No teacher-only resources in student exports
- URL fully encoded (no raw spaces)
- Generated paths under `.local/omninote-handoff/`
- `.local/` covered by `.gitignore`

### Offline Cache — `src/features/curriculum-library-fetcher/offlineCacheSmokeTests.ts`

- Cached pilot packages load without Drive
- Today Prep lesson resolution works offline
- Cached warning state is teacher-only concept (no Drive query on display)

## Convenience Script

```bash
npm run test:launch-readiness
```

Runs: build, lint, launch-readiness e2e, display-privacy e2e, omninote-handoff, omninote-command-center-handoff, offline cache smoke.

Existing scripts unchanged.

## Privacy Checks

| Check | Mechanism |
|-------|-----------|
| Display route text/HTML | Playwright privacy regression spec |
| OmniNote export JSON | `validateExportPrivacy` + extended unit tests |
| Generated `.local` packages | Grep in command-center handoff script |
| Git ignore | Unit test reads `.gitignore` |

## Known Limitations

- No service worker — PWA install works but no offline asset caching beyond browser defaults
- Physical iPad OmniNote deep-link validation still manual (WARN from Phase 11C)
- Privacy regex tests may need tuning if new teacher-only labels are added to display-safe areas
- PNG icons are programmatically generated; tweak `scripts/generate-app-icons.py` or `public/favicon.svg` to regenerate

## Files Changed

- `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/manifest.webmanifest`
- `index.html`
- `package.json` — `test:launch-readiness`
- `scripts/generate-app-icons.py`, `scripts/test-launch-readiness.sh`, `scripts/test-offline-cache-smoke.sh`
- `tests/e2e/launch-readiness.spec.ts`, `tests/e2e/display-privacy-regression.spec.ts`
- `src/features/omninote-handoff/tests.ts`
- `src/features/curriculum-library-fetcher/offlineCacheSmokeTests.ts`
