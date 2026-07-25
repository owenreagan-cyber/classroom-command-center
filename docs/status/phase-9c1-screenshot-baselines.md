# Status — Phase 9C.1 Screenshot Baseline Snapshots

Date: 2026-07-25  
Branch: `command-center-phase-9c1-screenshot-baselines`  
Base: `b243c75` (Merge automated visual QA smoke tests)

Status: COMPLETE

## Checklist

- [x] baseline screenshot test added
- [x] approved baseline snapshots generated
- [x] 1920x1080 `/display` baseline added
- [x] 1366x768 `/display` baseline added
- [x] 1024x768 `/display` baseline added
- [x] Morning Message baseline added
- [x] privacy assertions run before snapshots
- [x] snapshot update instructions documented
- [x] no new dependencies
- [x] build PASS
- [x] lint PASS
- [x] phase status saved

## Files Added / Changed

| File | Purpose |
|------|---------|
| `tests/e2e/display-snapshots.spec.ts` | Playwright `toHaveScreenshot` baseline tests for `/display` |
| `tests/e2e/display-snapshots.spec.ts-snapshots/*.png` | Tracked baseline PNGs (4 files) |
| `scripts/test-display-snapshots.sh` | Runs snapshot spec and lists baseline files |
| `package.json` → `test:display-snapshots` | npm entry point |
| `.gitignore` | Keeps generic `*.spec.ts-snapshots/` ignored; un-ignores Phase 9C.1 baseline folder |

Phase 9C artifact capture (`tests/e2e/visual-qa-display.spec.ts`, `scripts/test-visual-qa.sh`, `test:visual-qa`) unchanged.

## Snapshot Names and Location

Directory:

```
tests/e2e/display-snapshots.spec.ts-snapshots/
```

| Baseline file | Scene |
|---------------|-------|
| `display-default-1920x1080-chromium-darwin.png` | Default `/display` at projector size |
| `display-default-1366x768-chromium-darwin.png` | Default `/display` at laptop size |
| `display-default-1024x768-chromium-darwin.png` | Default `/display` at tablet size |
| `display-morning-message-1920x1080-chromium-darwin.png` | Morning Message after Send to Display |

Playwright appends `-chromium-darwin` (platform-specific) to the logical names passed in tests.

## Viewport Coverage

| Test | Viewport | Snapshot |
|------|----------|----------|
| `/display default at 1920x1080` | 1920×1080 | yes |
| `/display default at 1366x768` | 1366×768 | yes |
| `/display default at 1024x768` | 1024×768 | yes |
| `/display Morning Message at 1920x1080` | 1920×1080 | yes |

## Privacy Assertions (before each snapshot)

Each snapshot test asserts absence of:

- Teacher Dock / Teacher controls
- Studio Canvas toolbar
- Studio inspector placeholder text
- Teacher Notes
- Today Prep and Material Launcher panel
- Material Launcher
- Morning Message Studio editor
- Student Picker & Stars
- Backup / Restore
- Open Student Display / Copy Display Link
- Enter edit mode

Also asserts presence of:

- `.board-canvas` and `.classroom-canvas-frame`
- No horizontal overflow (`scrollWidth ≤ clientWidth + 2`)

Morning Message test additionally asserts `data-testid="morning-message-display"` visible.

## Stability Settings

- Viewport screenshots (not `fullPage`)
- `animations: 'disabled'` on snapshot options
- `maxDiffPixelRatio: 0.01` (1% pixel tolerance)
- `prefers-reduced-motion: reduce` emulated via Playwright
- CSS injection disables transitions/animations before capture
- `document.fonts.ready` awaited before capture

## How to Update Snapshots Intentionally

After an approved visual change:

```bash
npx playwright test tests/e2e/display-snapshots.spec.ts --update-snapshots
```

Or via npm script wrapper (runs regression compare, not update):

```bash
npm run test:display-snapshots
```

Review changed PNGs in `tests/e2e/display-snapshots.spec.ts-snapshots/` before committing.

## Phase 9C vs Phase 9C.1

| Aspect | Phase 9C (`test:visual-qa`) | Phase 9C.1 (`test:display-snapshots`) |
|--------|----------------------------|---------------------------------------|
| Output location | `.local/visual-qa/phase-9c/` | `tests/e2e/display-snapshots.spec.ts-snapshots/` |
| Git tracking | Untracked (gitignored) | Tracked baseline PNGs |
| Mechanism | `page.screenshot()` to disk | `expect(page).toHaveScreenshot()` pixel diff |
| Purpose | Ad-hoc artifact capture / smoke | Visual regression on approved scenes |
| `/control` smoke | Included | Not included (display-only) |

`.local/visual-qa/` runtime artifacts remain untracked.

## Validation Results

| Command | Result |
|---------|--------|
| `npm run test:display-snapshots` | PASS (4) |
| `npm run test:visual-qa` | PASS (8) |
| `npm run test:display-launch` | PASS (12) |
| `npm run test:app-route` | PASS (34) |
| `npm run test:pages` | PASS (149) |
| `npm run test:studio-canvas` | PASS (93) |
| `npm run test:student-picker` | PASS (68) |
| `npm run test:local-packets` | PASS (167) |
| `npm run test:display-polish` | PASS (15) |
| `npm run test:morning-message` | PASS (34) |
| `npm run test:e2e` | PASS (40) |
| `npm run build` | PASS |
| `npm run lint` | PASS |

Full E2E suite: **40 tests** (was 36; +4 snapshot baselines).

## Known Limitations

- Baselines are platform-specific (`-chromium-darwin` suffix); CI on Linux may need separate baselines or snapshot path configuration
- Morning Message baseline uses default store content only (1920×1080; no 1366/1024 variants)
- Viewport captures include browser chrome-free page area; minor font rendering differences across OS/GPU may require snapshot updates
- Studio inspector detected via placeholder text, not a dedicated `aria-label`
- Fullscreen button visibility asserted in default scenes but click/browser fullscreen not exercised
- Snapshot tests do not replace subjective Agent Eyes review for polish judgment

## Recommended Next Step

**Phase 8D — Open With / media workflow**, or expand snapshot coverage (additional pages, Morning Message at smaller viewports) once display design stabilizes further.
