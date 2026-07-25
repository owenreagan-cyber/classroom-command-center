# Status — Phase 8C Today Prep + Teacher Material Launcher

Status: COMPLETE

## Checklist

- [x] Today Prep panel added to `/control`
- [x] Material Launcher added to `/control`
- [x] active screen/page context shown
- [x] prep checklist is local-first
- [x] resource links are local-first
- [x] missing/invalid resource warnings added
- [x] resource Open buttons added
- [x] `/display` remains clean
- [x] route safety preserved
- [x] Open Student Display control preserved
- [x] backup/restore compatibility reviewed
- [x] no new dependencies
- [x] build PASS
- [x] lint PASS
- [x] phase status saved

## Implementation Summary

### Today Prep panel (`src/board/TodayPrepPanel.tsx`)

- Mounted in `TeacherDock` on `/control` only (edit mode).
- Shows active screen label and active vibe page title.
- Summarizes open prep items and invalid links for the current context.
- Local-first prep checklist with add/remove/toggle complete.
- Optional scoping of new items to the active screen/page.

### Material Launcher

- Manual resource links: label, URL, optional note.
- Optional screen/page association when scoped.
- Blank/invalid URL warnings appear in `/control` only.
- Valid links expose an **Open** anchor with `target="_blank"` and `rel="noreferrer"`.

### Persistence

- `todayPrep` added to `BoardState` with Zustand persist (storage version 9).
- Default starter checklist items seeded; resource links start empty.
- Board export/import and full local backup board category include `todayPrep`.

### Privacy

- `StudentDisplayShell` mounts only `BoardWorkspace` — no Today Prep, Material Launcher, or resource editing.
- All prep/link data uses `teacherOnly` visibility semantics and is never rendered on `/display`.

## Validation

- `npm run test:display-launch` — PASS
- `npm run test:app-route` — PASS (includes Today Prep URL tests)
- `npm run build` — PASS
- `npm run lint` — PASS

## Known Limitations

- Daily Brief packet export does not include Today Prep data (instructional content only).
- Prep checklist completion state is not reset automatically at day boundaries.
- No drag-and-drop reorder for checklist items or resource links.

## Recommended Next Step

Phase 8D or media workflow: Open With resource menu, YouTube/media page, or PDF viewer — after teacher workflow smoke test on `/control`.
