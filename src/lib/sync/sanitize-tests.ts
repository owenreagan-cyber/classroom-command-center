import { sanitizeComposerAction, sanitizeRandomNumberAction } from './sanitize.ts'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

function jsonHasKey(value: unknown, key: string): boolean {
  if (value === null || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, key)) return true
  return Object.values(value as Record<string, unknown>).some((v) => jsonHasKey(v, key))
}

// --- sanitizeComposerAction: a poisoned payload simulating a buggy/compromised /control ---

const poisoned = {
  blanked: false,
  screenId: 'arrival-1',
  screen: {
    id: 'arrival-1',
    title: 'Morning Arrival',
    mode: 'arrival',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentSafe: true,
    // forbidden: should never survive sanitization
    teacherNotes: 'Call home about Jordan',
    updatedAt: 1234567890,
    version: 3,
    widgets: [
      {
        id: 'w1',
        type: 'text',
        label: 'note',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        visible: true,
        settings: {
          text: 'safe visible text',
          // forbidden keys smuggled into widget settings
          apiKey: 'sk-secret',
          accessToken: 'oauth-token-value',
        },
      },
    ],
  },
}

const safe = sanitizeComposerAction(poisoned)
assert(safe.screen !== null, 'a studentSafe screen with a valid id still produces a safe screen')
assert(!jsonHasKey(safe, 'teacherNotes'), 'teacherNotes never survives sanitizeComposerAction')
assert(!jsonHasKey(safe, 'updatedAt'), 'updatedAt never survives sanitizeComposerAction')
assert(!jsonHasKey(safe, 'version'), 'version never survives sanitizeComposerAction')
assert(!jsonHasKey(safe, 'apiKey'), 'unlisted widget setting keys never survive sanitizeComposerAction')
assert(!jsonHasKey(safe, 'accessToken'), 'accessToken never survives sanitizeComposerAction')
assert(safe.screen?.widgets?.[0]?.settings?.text === 'safe visible text', 'allowed widget settings keys do pass through')

// --- sanitizeComposerAction: studentSafe: false must never produce a screen ---

const notStudentSafe = {
  blanked: false,
  screenId: 'teacher-only',
  screen: { id: 'teacher-only', studentSafe: false, title: 'Draft', mode: 'custom', background: { type: 'solid', token: 'x' }, showClock: false, timerWidget: { kind: 'none' } },
}
assert(sanitizeComposerAction(notStudentSafe).screen === null, 'studentSafe: false never produces a wire screen')

// --- sanitizeComposerAction: Blank must win — blanked:true clears screen/screenId regardless of what else was sent ---

const blankedWithScreen = { blanked: true, screenId: 'arrival-1', screen: poisoned.screen }
const blankedSafe = sanitizeComposerAction(blankedWithScreen)
assert(blankedSafe.blanked === true, 'blanked flag passes through')
assert(blankedSafe.screenId === null, 'blanked:true forces screenId to null')
assert(blankedSafe.screen === null, 'blanked:true forces screen to null, even if a screen payload was also sent')

// --- sanitizeComposerAction: malformed/missing payload degrades safely, never throws ---

assert(sanitizeComposerAction(null).screen === null, 'null payload does not throw and yields no screen')
assert(sanitizeComposerAction({}).screen === null, 'empty payload does not throw and yields no screen')
assert(sanitizeComposerAction('not an object' as unknown).screen === null, 'non-object payload does not throw and yields no screen')

// --- sanitizeRandomNumberAction ---

assert(sanitizeRandomNumberAction({ value: 7 })?.value === 7, 'a numeric value passes through')
assert(sanitizeRandomNumberAction({ value: null })=== null, 'a null value yields no snapshot')
assert(sanitizeRandomNumberAction({}) === null, 'a missing value yields no snapshot')
assert(sanitizeRandomNumberAction({ value: 'not a number' }) === null, 'a non-numeric value yields no snapshot, does not throw')

console.log('PASS: sanitize-tests (composer + random number, forbidden-key and Blank-precedence checks)')
