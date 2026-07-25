# Status — Phase 10B Now Showing Display Label

Status: COMPLETE

## Checklist

- [x] Now Showing state added or derived safely
- [x] `/control` can select Now Showing resource
- [x] `/control` can clear Now Showing resource
- [x] `/display` shows student-safe label only
- [x] `/display` hides URL
- [x] `/display` hides Open With controls
- [x] `/display` hides Copy Link controls
- [x] `/display` hides resource notes
- [x] persistence reviewed
- [x] backup/restore reviewed
- [x] Daily Brief exclusion reviewed
- [x] privacy tests updated
- [x] visual QA updated
- [x] screenshot baselines updated intentionally if needed
- [x] build PASS
- [x] lint PASS
- [x] phase status saved

## Implementation Summary

- `TodayPrepState.nowShowingResourceId` stores the selected Material Launcher resource id (persisted via zustand v11).
- `/control` Material Launcher: **Show on Display** per resource, **Clear Now Showing** at section level, active resource highlighted.
- `/display`: `NowShowingDisplayLabel` shows label + preset text only — no URLs, notes, or launch controls.
- Deleting the selected resource clears `nowShowingResourceId`; `/display` hides the label.
- Full local backup/restore includes `todayPrep` (Now Showing preserved). Daily Brief export unchanged (no Today Prep data).
- New Playwright privacy + label test; new snapshot `display-now-showing-1920x1080.png`. Phase 9C default snapshots unchanged.

## Screenshot baseline note

Existing Phase 9C default `/display` baselines were **not** modified (label only renders when a resource is marked Now Showing). One **new** baseline was added intentionally for the Now Showing label at 1920×1080.
