# Status — Phase 10A Open With + Media Workflow

Status: COMPLETE

Date: 2026-07-25

Branch: `command-center-phase-10a-open-with-media-workflow`

## Checklist

- [x] Open With workflow added to `/control`
- [x] resource type presets added
- [x] safe Open With button added (`target="_blank"`, `rel="noreferrer"`)
- [x] Copy Link button added (clipboard with graceful fallback)
- [x] URL validation reused from `resourceUrl.ts`
- [x] active screen/page scoping preserved
- [x] `/display` privacy preserved
- [x] Today Prep / Material Launcher compatibility reviewed — integrated into existing Material Launcher
- [x] backup/restore compatibility reviewed — `todayPrep.resourceLinks[]` includes optional `preset`
- [x] no new dependencies
- [x] route/privacy tests updated
- [x] visual QA tests still pass
- [x] screenshot baseline tests still pass
- [x] build PASS
- [x] lint PASS
- [x] phase status saved

## Implementation Summary

Extended the existing `TeacherMaterialLink` model in `todayPrep.resourceLinks` rather than creating a parallel system.

### Resource presets

| Preset ID | Label |
|-----------|-------|
| `google-slides` | Google Slides |
| `google-docs` | Google Docs |
| `google-drive` | Google Drive |
| `youtube` | YouTube |
| `pdf` | PDF / File Link |
| `website` | Website |
| `other` | Other |

Each link supports: label, URL, preset, optional note, optional screen/page scope.

### Open With behavior

- Teacher Dock → Today Prep → Material Launcher section (`aria-label="Open With"`)
- Preset selector on add form and per-link edit rows
- URL auto-suggestion when preset is `website` or `other`
- Invalid/blank URL warnings shown only in `/control`
- **Open With** opens validated links in a new tab
- **Copy Link** copies validated URLs via `navigator.clipboard` with status feedback

### `/display` privacy

Material Launcher, Open With controls, preset selectors, Copy Link, and Today Prep remain control-only. `/display` does not mount `TeacherDock`.

### Persistence & backup

- `preset` stored on each `TeacherMaterialLink` in Zustand `todayPrep`
- Normalized on import via `normalizeTodayPrep` (defaults to `website`)
- Full Local Packets / legacy board backup includes `todayPrep` unchanged structurally
- Daily Brief export still excludes teacher prep data (unchanged)

## Files Changed

- `src/data/types.ts` — `ResourceOpenPreset`, optional `preset` on `TeacherMaterialLink`
- `src/lib/resourcePresets.ts` — preset catalog, normalization, URL inference
- `src/lib/resourceUrl.ts` — `copyResourceUrl` helper
- `src/lib/today-prep-tests.ts` — preset + copy tests
- `src/board/TodayPrepPanel.tsx` — Open With UI integrated into Material Launcher
- `src/store/boardStore.ts` — preset normalization on add/import
- `scripts/test-app-route-shell.sh` — compile `resourcePresets.ts`
- `tests/e2e/visual-qa-display.spec.ts` — Open With privacy + preset tests
- `tests/e2e/display-snapshots.spec.ts` — privacy assertions
- `docs/status/phase-10a-open-with-media-workflow.md` — this file
- `docs/status/classroom-command-center-current-state.md` — updated current state

## Known Limitations

- Launch workflow only — no embedded players or API integrations
- Copy Link depends on browser clipboard permissions (fallback message shown)
- Preset inference is best-effort; teachers can override manually
- No student-visible resource cards on `/display` (by design)

## Recommended Next Step

Phase 10B or follow-on: optional quick-launch favorites bar, preset-specific URL hint validation, or student-safe “Now Showing” card that displays only a teacher-sent label (not the full launcher UI).
