# Local Roster Import

Classroom Command Center keeps real student rosters **local-only**. Never commit real names to the repository.

## Real roster file (local only)

Place the teacher roster at:

```text
.local/rosters/2026-class-rosters.local.json
```

This path is gitignored via `.local/`.

## Roster shape

Each class entry supports:

- `firstName`, `lastName`, optional `preferredName`
- Homeroom and Math: flat `students[]`
- Reading: `sections.RM4` and `sections.SM5` arrays

`displayName` is normalized in-app as `preferredName || firstName`.

## Import options

### 1. Teacher Control UI

1. Open `/control`
2. Student Picker → **Roster** tab
3. **Import JSON File** (choose your local roster file)
4. Or **Load Sample Roster** for safe demo data

### 2. Dev script (optional)

```bash
node scripts/import-local-rosters.mjs --out .local/rosters/picker-import.json
```

Writes a normalized picker-ready JSON to `.local/` for inspection or manual paste workflows.

## Preferred-name rule

Student-facing and teacher-facing classroom tools show **preferredName** when present, otherwise **firstName**. Legal names remain in local roster data for teacher reference only.

State/history uses stable generated student ids, not display names.

## Privacy

- Do not commit `.local/rosters/*.local.json`
- Do not copy real names into tests, docs, or fixtures
- Use `src/features/roster/sampleRoster.fixture.ts` for committed sample data
