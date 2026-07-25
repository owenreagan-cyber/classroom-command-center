// Now Showing selection + deletion behavior tests.
// Run via: bash scripts/test-app-route-shell.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import type { TeacherMaterialLink, TodayPrepState } from '../data/types'
import { resolveNowShowingDisplay } from './nowShowing'

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

const sampleLinks: TeacherMaterialLink[] = [
  {
    id: 'link-slides',
    label: 'Chapter 2 Slides',
    url: 'https://docs.google.com/presentation/d/abc/edit',
    preset: 'google-slides',
    note: 'Teacher-only note',
    visibility: 'teacherOnly',
  },
  {
    id: 'link-video',
    label: 'Mountain Engineering Video',
    url: 'https://www.youtube.com/watch?v=abc',
    preset: 'youtube',
    visibility: 'teacherOnly',
  },
]

assert('null id resolves to null', resolveNowShowingDisplay(null, sampleLinks) === null)
assert('undefined id resolves to null', resolveNowShowingDisplay(undefined, sampleLinks) === null)
assert('missing resource resolves to null', resolveNowShowingDisplay('missing-id', sampleLinks) === null)

const slides = resolveNowShowingDisplay('link-slides', sampleLinks)
assert('valid resource resolves label', slides?.label === 'Chapter 2 Slides')
assert('valid resource resolves preset label', slides?.presetLabel === 'Google Slides')
assert('resolved info excludes url field', slides !== null && !('url' in slides))
assert('resolved info excludes note field', slides !== null && !('note' in slides))

const emptyLabelLink: TeacherMaterialLink[] = [
  { id: 'empty', label: '   ', url: 'https://example.com', visibility: 'teacherOnly' },
]
assert('blank label resolves to null', resolveNowShowingDisplay('empty', emptyLabelLink) === null)

function simulateRemoveMaterialLink(state: TodayPrepState, id: string): TodayPrepState {
  return {
    ...state,
    resourceLinks: state.resourceLinks.filter((link) => link.id !== id),
    nowShowingResourceId:
      state.nowShowingResourceId === id ? null : (state.nowShowingResourceId ?? null),
  }
}

const prepState: TodayPrepState = {
  checklistItems: [],
  resourceLinks: sampleLinks,
  nowShowingResourceId: 'link-slides',
}

const afterDelete = simulateRemoveMaterialLink(prepState, 'link-slides')
assert('deleting now-showing resource clears selection', afterDelete.nowShowingResourceId === null)
assert(
  'display resolves null after deletion',
  resolveNowShowingDisplay(afterDelete.nowShowingResourceId, afterDelete.resourceLinks) === null,
)

const afterOtherDelete = simulateRemoveMaterialLink(prepState, 'link-video')
assert(
  'deleting other resource keeps now showing',
  afterOtherDelete.nowShowingResourceId === 'link-slides',
)
assert(
  'display still resolves after deleting other resource',
  resolveNowShowingDisplay(afterOtherDelete.nowShowingResourceId, afterOtherDelete.resourceLinks)
    ?.label === 'Chapter 2 Slides',
)

console.log(`Now Showing tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
