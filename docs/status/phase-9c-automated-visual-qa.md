# Status — Phase 9C Automated Visual QA + Classroom Workflow Smoke Test

Date: 2026-07-25  
Branch: `command-center-phase-9c-automated-visual-qa`  
Base: `1533967` (Merge morning message studio)

Status: COMPLETE

## Checklist

- [x] Playwright visual QA screenshots added
- [x] 1920x1080 `/display` screenshot captured
- [x] 1366x768 `/display` screenshot captured
- [x] 1024x768 `/display` screenshot captured
- [x] horizontal overflow assertions added
- [x] teacher-only UI absence checks added for `/display`
- [x] Morning Message `/display` smoke test added
- [x] fullscreen control check added
- [x] `/control` workflow smoke test added
- [x] screenshot artifact path documented
- [x] no new dependencies unless already justified
- [x] build PASS
- [x] lint PASS
- [x] phase status saved

## Tests Added

| File | Tests | Purpose |
|------|-------|---------|
| `tests/e2e/visual-qa-display.spec.ts` | 8 | Viewport screenshots, privacy assertions, Morning Message display, `/control` workflow smoke |
| `scripts/test-visual-qa.sh` | — | Runs Phase 9C Playwright spec and lists artifact PNGs |
| `package.json` → `test:visual-qa` | — | npm entry point |

Full E2E suite: **36 tests** (was 28).

## Screenshot Artifact Path

```
.local/visual-qa/phase-9c/
```

Generated files (runtime, gitignored):

| File | Scene |
|------|-------|
| `display-1920x1080-default.png` | Default `/display` at projector size |
| `display-1366x768-default.png` | Default `/display` at laptop size |
| `display-1024x768-default.png` | Default `/display` at tablet size |
| `display-1920x1080-morning-message.png` | Morning Message after Send to Display |

Screenshots are **untracked** (`.gitignore` includes `.local/visual-qa/`).

## Viewport Coverage

| Viewport | Overflow check | Screenshot | Privacy checks |
|----------|----------------|------------|----------------|
| 1920×1080 | PASS | PASS | PASS |
| 1366×768 | PASS | PASS | PASS |
| 1024×768 | PASS | PASS | PASS |

## `/display` Privacy Checks (automated)

Each viewport test asserts absence of:

- Teacher Dock / Teacher controls
- Studio Canvas toolbar
- Studio inspector placeholder text
- Teacher Notes
- Today Prep and Material Launcher panel
- Morning Message Studio editor
- Student Picker & Stars
- Backup / Restore
- Open Student Display / Copy Display Link
- Enter edit mode

Also asserts presence of:

- `.board-canvas` and `.classroom-canvas-frame`
- Enter fullscreen button
- No horizontal overflow (`scrollWidth ≤ clientWidth + 2`)

## `/control` Workflow Checks (automated)

- Teacher Dock visible in edit mode
- Open Student Display and Copy Display Link visible
- Morning Message Studio visible; Preview/Edit Mode toggle works
- Today Prep panel visible with prep input; absent on `/display`
- Material Launcher “Add resource link” on `/control` only

## Morning Message Smoke

1. Navigate to `/control`, enter edit mode
2. Click **Send to Display** in Morning Message Studio
3. Navigate to `/display`
4. Assert `data-testid="morning-message-display"` visible
5. Capture `display-1920x1080-morning-message.png`

## Validation Results

| Command | Result |
|---------|--------|
| `npm run test:visual-qa` | PASS (8) |
| `npm run test:display-launch` | PASS (12) |
| `npm run test:app-route` | PASS (26) |
| `npm run test:pages` | PASS (149) |
| `npm run test:studio-canvas` | PASS (93) |
| `npm run test:student-picker` | PASS (68) |
| `npm run test:local-packets` | PASS (167) |
| `npm run test:display-polish` | PASS (15) |
| `npm run test:morning-message` | PASS (34) |
| `npm run test:e2e` | PASS (36) |
| `npm run build` | PASS |
| `npm run lint` | PASS |

## Known Limitations

- Screenshots are capture-only; no pixel-diff baselines or `toHaveScreenshot` regression thresholds yet
- Morning Message smoke uses default store content, not every template variant
- 1366×768 Morning Message screenshot not captured separately (1920×1080 only for that scene)
- Studio inspector detected via placeholder text, not a dedicated `aria-label` (no app change required)
- Fullscreen button click / browser fullscreen permission not exercised (visibility only)
- Manual Agent Eyes review remains optional for subjective polish

## Recommended Next Step

**Phase 8D — Open With / media workflow** or add Playwright snapshot baselines for approved `/display` scenes once visual design stabilizes.
