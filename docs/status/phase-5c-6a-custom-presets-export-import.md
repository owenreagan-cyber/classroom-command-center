# Status — Command Center Phase 5C/6A Custom Presets + Board Export/Import

## Checklist

- [x] custom preset type added
- [x] board export payload type added
- [x] custom preset save helper added
- [x] custom preset apply helper added
- [x] custom presets persisted locally
- [x] custom presets listed by active screen
- [x] custom preset delete added
- [x] board JSON export added
- [x] board JSON import added
- [x] invalid import handling added
- [x] display mode remains protected
- [x] local-only boundary preserved
- [x] no new dependencies
- [x] build PASS
- [x] lint PASS
- [x] manual QA checklist saved
- [x] phase report saved

## Validation proof

```text
npm run build  -> PASS
npm run lint   -> PASS
```

## Files changed

Expected implementation files:

- `src/data/types.ts`
- `src/data/customPresets.ts`
- `src/lib/boardExport.ts`
- `src/store/boardStore.ts`
- `src/board/BoardPresetPanel.tsx`
- `src/board/BoardBackupPanel.tsx`
- `src/board/TeacherDock.tsx`
- `src/app/AppShell.tsx`

Docs:

- `docs/phases/phase-5c-6a-custom-presets-export-import.md`
- `docs/status/phase-5c-6a-custom-presets-export-import.md`
- `docs/qa/phase-5c-6a-custom-presets-export-import-qa.md`
