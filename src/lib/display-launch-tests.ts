// Display launch helper tests.
// Run via: bash scripts/test-display-launch.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import {
  CLIPBOARD_UNAVAILABLE_MESSAGE,
  DISPLAY_LINK_COPIED_MESSAGE,
  POPUP_BLOCKED_MESSAGE,
  copyDisplayLink,
  getDisplayUrl,
  openStudentDisplay,
} from '../app/displayLaunch'

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

assert(
  'getDisplayUrl builds absolute display URL',
  getDisplayUrl({ origin: 'http://localhost:5173' }) === 'http://localhost:5173/display',
)

assert(
  'getDisplayUrl preserves origin',
  getDisplayUrl({ origin: 'https://classroom.example' }) === 'https://classroom.example/display',
)

const openedWindow = { closed: false }
const popupAllowed = openStudentDisplay(
  {
    open: () => openedWindow as Window,
  },
  { origin: 'http://localhost:5173' },
)
assert('openStudentDisplay succeeds when popup opens', popupAllowed.ok === true)

const popupBlocked = openStudentDisplay(
  {
    open: () => null,
  },
  { origin: 'http://localhost:5173' },
)
assert('openStudentDisplay reports popup blocked', popupBlocked.ok === false)
if (!popupBlocked.ok) {
  assert('popup blocked reason is popup_blocked', popupBlocked.reason === 'popup_blocked')
}

async function runAsyncTests() {
  const copied: string[] = []
  const copyOk = await copyDisplayLink(
    {
      writeText: async (text: string) => {
        copied.push(text)
      },
    },
    { origin: 'http://localhost:5173' },
  )
  assert('copyDisplayLink succeeds with clipboard', copyOk.ok === true)
  assert('copyDisplayLink writes display URL', copied[0] === 'http://localhost:5173/display')

  const noClipboard = await copyDisplayLink(undefined, { origin: 'http://localhost:5173' })
  assert('copyDisplayLink fails without clipboard', noClipboard.ok === false)

  const failingClipboard = await copyDisplayLink(
    {
      writeText: async () => {
        throw new Error('denied')
      },
    },
    { origin: 'http://localhost:5173' },
  )
  assert('copyDisplayLink fails when writeText throws', failingClipboard.ok === false)

  assert('popup blocked message is documented', POPUP_BLOCKED_MESSAGE.includes('Allow popups'))
  assert('copied message is documented', DISPLAY_LINK_COPIED_MESSAGE === 'Display link copied')
  assert('clipboard failure message is documented', CLIPBOARD_UNAVAILABLE_MESSAGE.includes('Clipboard'))

  console.log(`Display launch tests: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  }
}

void runAsyncTests()
