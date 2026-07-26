import type { SimpleTimerState } from '../data/timerTypes'
import type { SimpleTimerScreenId } from '../data/timerTypes'
import { formatTimerMs, remainingFromEndsAt } from '../lib/timerFormat'
import { recoverSimple } from '../store/timerRecovery'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- Simple timer recovery ---

const runningTimer: SimpleTimerState = {
  label: 'Test',
  presetId: '5',
  durationMs: 300_000,
  status: 'running',
  remainingMs: 300_000,
  endsAt: Date.now() + 120_000,
  appearance: 'calm',
  chimeEnabled: true,
}

const recovered = recoverSimple(runningTimer, runningTimer.endsAt! - 60_000)
assert(recovered.remainingMs === 60_000, 'recoverSimple computes remaining from endsAt')
assert(recovered.status === 'running', 'recoverSimple keeps running status')

const finished = recoverSimple(
  { ...runningTimer, endsAt: Date.now() - 1000 },
  Date.now(),
)
assert(finished.status === 'finished', 'recoverSimple marks finished when past endsAt')
assert(finished.remainingMs === 0, 'recoverSimple zeroes remaining when finished')

const paused = recoverSimple(
  { ...runningTimer, status: 'paused', endsAt: null, remainingMs: 45_000 },
)
assert(paused.remainingMs === 45_000, 'recoverSimple preserves paused remaining')
assert(paused.endsAt === null, 'recoverSimple clears endsAt when paused')

// --- Format tests ---

assert(formatTimerMs(125_000) === '2:05', 'formatTimerMs M:SS')
assert(formatTimerMs(0) === '0:00', 'formatTimerMs zero')
assert(formatTimerMs(59_999) === '1:00', 'formatTimerMs rounds up seconds')

// --- Remaining from endsAt ---

const endsAt = Date.now() + 30_000
assert(remainingFromEndsAt(endsAt) <= 30_000, 'remainingFromEndsAt near 30s')
assert(remainingFromEndsAt(endsAt - 60_000) === 0, 'remainingFromEndsAt never negative')

// --- Screen timer keys ---

const screens: SimpleTimerScreenId[] = ['homeroom', 'math', 'reading', 'spelling']
assert(screens.length === 4, 'four simple timer screens')

console.log('All timer tests passed.')
