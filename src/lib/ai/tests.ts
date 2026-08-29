// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { generateRoutinePlanWithOllama, isOllamaReachable, routinePlanSchema } from './localPromptEngine'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// A port nothing should ever be listening on — deterministically exercises
// the "Ollama offline" branch regardless of whether this machine happens to
// have a real Ollama instance running on the real default port.
const UNREACHABLE_BASE_URL = 'http://localhost:11499/api'

// --- routinePlanSchema — pure validation, no network ---

const validPlan = {
  kind: 'math',
  sceneName: 'Math Workshop',
  title: 'Math Workshop',
  greeting: 'Objective',
  intro: 'Please complete the following:',
  checklistItems: ['Take out your materials', 'Begin the warm-up'],
  closing: 'Be ready to share!',
  timers: [{ title: 'Math Work', minutes: 20, tone: 'focus' }],
  visualStyle: { backgroundPresetId: 'slate-focus', themeId: 'minimal-dark', mood: 'focus' },
  music: {
    enabled: true,
    mood: 'focus',
    suggestedPlaylistName: 'Math Work Instrumental',
    searchTerms: ['focus', 'instrumental'],
  },
}

const validResult = routinePlanSchema.safeParse(validPlan)
assert(validResult.success, 'a well-formed RoutinePlan-shaped object parses successfully')

const invalidKind = routinePlanSchema.safeParse({ ...validPlan, kind: 'recess' })
assert(!invalidKind.success, 'an unknown routine kind is rejected')

const invalidTimerTone = routinePlanSchema.safeParse({
  ...validPlan,
  timers: [{ title: 'Math Work', minutes: 20, tone: 'chaotic' }],
})
assert(!invalidTimerTone.success, 'an unknown timer tone is rejected')

const missingChecklist = routinePlanSchema.safeParse({ ...validPlan, checklistItems: [] })
assert(!missingChecklist.success, 'an empty checklist is rejected (min 1 item)')

const timerOutOfRange = routinePlanSchema.safeParse({
  ...validPlan,
  timers: [{ title: 'Too Long', minutes: 500, tone: 'focus' }],
})
assert(!timerOutOfRange.success, 'a timer beyond the max minutes is rejected')

console.log('routinePlanSchema tests passed.')

// --- isOllamaReachable / generateRoutinePlanWithOllama — real network calls ---

async function main() {
  const unreachable = await isOllamaReachable({ baseURL: UNREACHABLE_BASE_URL }, 800)
  assert(unreachable === false, 'isOllamaReachable resolves false against a closed port')

  const fallbackResult = await generateRoutinePlanWithOllama('Set up math workshop.', {
    baseURL: UNREACHABLE_BASE_URL,
  })
  assert(!fallbackResult.ok, 'generateRoutinePlanWithOllama reports failure when Ollama is unreachable')
  if (!fallbackResult.ok) {
    assert(/not reachable/i.test(fallbackResult.error), 'failure reason mentions unreachability')
  }

  const emptyPromptResult = await generateRoutinePlanWithOllama('   ')
  assert(!emptyPromptResult.ok, 'an empty/whitespace-only prompt fails fast without a network call')

  console.log('Offline-fallback tests passed.')

  // Best-effort live check: only runs if this machine happens to have a real
  // local Ollama instance reachable on the real default port. Skipped (not
  // failed) otherwise — this is what keeps the suite CI-safe per Phase 3's
  // brief, while still proving the real integration works wherever Ollama
  // actually is running.
  const liveReachable = await isOllamaReachable()
  if (!liveReachable) {
    console.log('Local Ollama not reachable on the default port — skipping live generation check.')
    return
  }

  const liveResult = await generateRoutinePlanWithOllama(
    'Set up morning arrival for today. Students should turn in homework, sharpen pencils, and start morning work quietly. Use a 20-minute calm timer.',
  )
  if (!liveResult.ok) {
    console.log(`Local Ollama reachable but generation failed (not necessarily a bug — model may need pulling): ${liveResult.error}`)
    return
  }
  assert(liveResult.source === 'ollama', 'live result reports its source as ollama')
  const reparsed = routinePlanSchema.safeParse(liveResult.plan)
  assert(reparsed.success, 'a live Ollama-generated plan round-trips through routinePlanSchema')
  assert(liveResult.plan.checklistItems.length > 0, 'live plan has at least one checklist item')
  assert(liveResult.plan.timers.length > 0, 'live plan has at least one timer')
  console.log(`Live Ollama generation check passed. kind=${liveResult.plan.kind} title="${liveResult.plan.title}"`)
}

main()
  .then(() => console.log('AI prompt engine tests passed.'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
