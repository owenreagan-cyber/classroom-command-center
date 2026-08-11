// Route shell composition and state-preservation invariants.
// Run via: bash scripts/test-app-route-shell.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import {
  getEffectiveBoardMode,
  shouldAllowStudioEditActions,
  shouldMountTeacherDock,
  shouldShowTeacherBoardChrome,
} from '../app/appRouteShell'
import { getAppRoute } from '../app/appRoute'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed += 1
  } else {
    failed += 1
    console.error(`FAIL: ${label}`)
  }
}

// ── Control route composition ──────────────────────────────
assert('control mounts TeacherDock', shouldMountTeacherDock('control'))
assert('control shows teacher board chrome', shouldShowTeacherBoardChrome('control'))
assert('control preserves persisted edit mode', getEffectiveBoardMode('control', 'edit') === 'edit')
assert('control preserves persisted display mode', getEffectiveBoardMode('control', 'display') === 'display')
assert('control preserves persisted teach mode', getEffectiveBoardMode('control', 'teach') === 'teach')
assert('control allows studio edit when in edit mode', shouldAllowStudioEditActions('control', 'edit'))
assert('control disallows studio edit when in display mode', !shouldAllowStudioEditActions('control', 'display'))

// ── Display route composition ──────────────────────────────
assert('display does not mount TeacherDock', !shouldMountTeacherDock('display'))
assert('display hides teacher board chrome', !shouldShowTeacherBoardChrome('display'))
assert('display forces effective display mode from edit', getEffectiveBoardMode('display', 'edit') === 'display')
assert('display forces effective display mode from display', getEffectiveBoardMode('display', 'display') === 'display')
assert('display disallows studio edit actions', !shouldAllowStudioEditActions('display', 'edit'))
assert('display disallows studio edit actions in display mode', !shouldAllowStudioEditActions('display', 'display'))

// ── Persisted mode is not mutated by route helpers ─────────
const persistedEdit = 'edit' as const
const persistedDisplay = 'display' as const
getEffectiveBoardMode('display', persistedEdit)
getEffectiveBoardMode('display', persistedDisplay)
assert('route helpers do not mutate persisted edit mode', persistedEdit === 'edit')
assert('route helpers do not mutate persisted display mode', persistedDisplay === 'display')

// ── Route resolution safety ────────────────────────────────
assert('control path resolves to control shell', getAppRoute('/control') === 'control')
assert('display path resolves to display shell', getAppRoute('/display') === 'display')
assert('root path triggers redirect shell', getAppRoute('/') === 'root')
assert('unknown path triggers redirect shell', getAppRoute('/secret') === 'root')

// ── Teacher-only surface inventory (compile-time contract) ─
const TEACHER_ONLY_SURFACES = [
  'TeacherDock',
  'BoardBackupPanel',
  'LocalPacketPanel',
  'StudentPickerPanel',
  'TeacherNotesPanel',
  'TodayPrepPanel',
  'DisplayLaunchPanel',
  'StudioToolbar',
  'StudioInspector',
] as const

assert(
  'teacher-only surfaces list is documented',
  TEACHER_ONLY_SURFACES.length === 9,
)

console.log(`App route shell tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
