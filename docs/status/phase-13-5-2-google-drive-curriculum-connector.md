# Phase 13.5.2 — Google Drive Curriculum Connector

Status: complete (provider + cache + manual sync)  
Branch: `phase-13-5-2-google-drive-curriculum-connector`  
Date: 2026-07-26

## Goal

Replace the Phase 13.5.1 fixture source with a Google Drive adapter while preserving the existing scanner → classifier → lesson package → Command Center → OmniNote handoff pipeline. No live Drive queries during teaching.

## Architecture principle

```
Google Drive          Command Center           Classroom
─────────────         ────────────────         ─────────
SOURCE LIBRARY   →    LOCAL CURRICULUM INDEX → LOCAL RELIABLE EXPERIENCE
```

## Provider architecture

```
DriveFolderProvider (interface)
        │
        ├── MockDriveProvider (tests + dev — backed by Saxon Math fixture)
        └── [Future] GoogleDriveOAuthProvider
        │
        ▼
  getFolderTree() → DriveFolderTree
        │
        ▼
  resourceScanner.ts
        │
        ▼
  resourceClassifier.ts
        │
        ▼
  lessonPackageBuilder.ts
        │
        ▼
  libraryIndexStore.ts (persisted index)
```

### DriveFolderProvider contract

| Method | Purpose |
|--------|---------|
| `listFolders(parentId?)` | List child folders |
| `listFiles(folderId)` | List files in folder |
| `getFileMetadata(fileId)` | Single file metadata |
| `getFolderTree(rootId?)` | Full tree for scanner |
| `isAvailable()` | Drive reachability check |

OAuth is **not implemented**. The interface is ready for a future `GoogleDriveOAuthProvider`.

## Module layout

| File | Role |
|------|------|
| `drive/types.ts` | Provider types, sync status, cache shape |
| `drive/driveProvider.ts` | `DriveFolderProvider` + `MockDriveProvider` |
| `drive/driveMapper.ts` | Provider → `DriveFolderTree` mapping |
| `drive/driveCache.ts` | Local cache save/load/hydrate |
| `drive/driveSync.ts` | Manual sync orchestration |
| `drive/tests.ts` | Provider, cache, offline, integration tests |
| `libraryIndexStore.ts` | Zustand persist + `syncCurriculumLibrary()` |

## Cache behavior

**Storage key:** `classroom-curriculum-library-v1`

Persisted fields:
- `lastScannedAt` — last successful sync timestamp
- `packages` — discovered lesson packages + resources
- `source` — `drive` | `fixture` | `cache`
- `syncStatus` — `ready` | `syncing` | `offline-cache`
- `driveAvailable` — whether last sync reached Drive

Stale data is always usable. Empty cache falls back to Saxon Math fixture bootstrap.

## Sync model

Manual sync only — teacher action **"Sync Curriculum Library"** in Teacher Dock → Curriculum Sync tool.

```
Teacher taps Sync
        │
        ▼
DriveFolderProvider.getFolderTree()
        │
        ▼
scan → classify → package
        │
        ▼
Update local index (Zustand persist)
```

No background polling. No automatic cloud sync. No authentication flows in this phase.

## Offline strategy

1. **Drive unavailable at sync time** → keep existing cached packages, set `syncStatus: offline-cache`
2. **No cache + Drive unavailable** → bootstrap from Saxon Math fixture
3. **During teaching** → read from local index only; never query Drive
4. **Today Prep** → shows "Using cached lesson data" when `driveAvailable === false`

Classroom never fails due to Drive unavailability.

## Command Center integration

### Today Prep

Shows lesson context with resource checklist:

```
Math
Saxon Math Lesson 2
Resources:
  ✓ Presentation
  ✓ Teacher Notes
  ✓ Practice
Status: Ready
```

When offline: "Using cached lesson data" banner.

### Teacher Dock — Curriculum Sync (Daily)

| State | Label |
|-------|-------|
| Live index | Ready |
| Sync in progress | Syncing |
| Stale/offline | Offline Cache |

## Privacy

Drive IDs and internal metadata stay in the provider/cache layer only. Not exposed to `/display`.

Student-safe resources use `getStudentSafeResources()` — excludes `teacher-notes`. OmniNote payload excludes teacher notes via `buildOmniNotePayload()`.

## Future OAuth plan

1. Implement `GoogleDriveOAuthProvider` implementing `DriveFolderProvider`
2. Wire OAuth token storage (teacher-only, not on display route)
3. Replace `createDefaultDriveProvider()` with OAuth provider when token present
4. Fall back to `MockDriveProvider` / cache when token expired or offline
5. Keep manual sync model — no background polling

## OmniNote readiness

Unchanged from 13.5.1. Pipeline produces `omninoteReady: true` when primary resource is presentation/pdf/worksheet. Handoff via `toBridgeLessonPackageFromFetcher()` → `executeHandoff()`.

Integration test path: Drive tree → Lesson Package → Today Prep labels → OmniNote payload (teacher notes excluded).

## Validation

```bash
npm run build
npm run lint
npm run test:curriculum
npm run test:curriculum-fetcher
npm run test:teacher-dock
npm run test:teacher-workstation  # includes e2e
```

## Changed files (Phase 13.5.2)

- `src/features/curriculum-library-fetcher/drive/*` — new connector module
- `src/features/curriculum-library-fetcher/types.ts` — sync status, cache key
- `src/features/curriculum-library-fetcher/libraryIndexStore.ts` — sync action, cache fields
- `src/features/curriculum-library-fetcher/tests.ts` — drive sync tests
- `src/board/TodayPrepPanel.tsx` — resource checklist, offline banner
- `src/features/teacher-dock/*` — Curriculum Sync tool
- `scripts/test-curriculum-fetcher.sh` — drive module compilation
