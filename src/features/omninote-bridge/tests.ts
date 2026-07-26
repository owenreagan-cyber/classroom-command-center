function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { buildLessonPackage, buildOmniNoteDeepLink, OMNINOTE_SCHEME } from './types'
import { executeHandoff, getAvailableHandoffMethods } from './handoff'

// --- LessonPackage builder ---

const mathPkg = buildLessonPackage({
  title: 'Chapter 5 Slides',
  subject: 'math',
  kind: 'slide-deck',
  webUrl: 'https://docs.google.com/presentation/d/abc123',
})

assert(mathPkg.title === 'Chapter 5 Slides', 'package title')
assert(mathPkg.subject === 'math', 'package subject')
assert(mathPkg.resource.kind === 'slide-deck', 'resource kind')
assert(mathPkg.displayMode === 'both', 'default display mode')
assert(mathPkg.annotationMode === 'pen', 'default annotation mode')
assert(mathPkg.displayLabel === 'Chapter 5 Slides', 'display label matches title')
assert(typeof mathPkg.createdAt === 'number', 'createdAt is number')

// --- Deep link ---

const deepLink = buildOmniNoteDeepLink(mathPkg)
assert(deepLink.startsWith(`${OMNINOTE_SCHEME}://open?`), 'deep link scheme')
assert(deepLink.includes('title=Chapter'), 'deep link includes title')
assert(deepLink.includes('subject=math'), 'deep link includes subject')
assert(deepLink.includes('kind=slide-deck'), 'deep link includes kind')

// --- Handoff execution ---

const manualResult = executeHandoff({ package: mathPkg, method: 'manual' })
assert(manualResult.success, 'manual handoff succeeds')
assert(manualResult.message.includes('OmniNote'), 'manual message mentions OmniNote')

const copyResult = executeHandoff({ package: mathPkg, method: 'copy-link' })
assert(copyResult.success, 'copy-link handoff succeeds with URL')

const noUrlPkg = buildLessonPackage({
  title: 'Blank Canvas',
  subject: 'homeroom',
  kind: 'blank-canvas',
})
const copyFail = executeHandoff({ package: noUrlPkg, method: 'copy-link' })
assert(!copyFail.success, 'copy-link fails without URL')

const deepResult = executeHandoff({ package: mathPkg, method: 'deep-link' })
assert(deepResult.success, 'deep-link handoff succeeds')
assert(deepResult.deepLink !== undefined, 'deep-link returns URL')

// --- Available methods ---

const methods = getAvailableHandoffMethods(mathPkg)
assert(methods.includes('manual'), 'manual always available')
assert(methods.includes('copy-link'), 'copy-link available with URL')
assert(methods.includes('deep-link'), 'deep-link always available')

const blankMethods = getAvailableHandoffMethods(noUrlPkg)
assert(!blankMethods.includes('copy-link'), 'copy-link not available without URL')

// --- PDF worksheet example ---

const readingPkg = buildLessonPackage({
  title: 'Mountain Passage',
  subject: 'reading',
  kind: 'pdf',
  source: '/files/mountain-passage.pdf',
  annotationMode: 'highlighter',
})
assert(readingPkg.annotationMode === 'highlighter', 'custom annotation mode')
assert(readingPkg.resource.source === '/files/mountain-passage.pdf', 'local source path')

console.log('All OmniNote bridge tests passed.')
