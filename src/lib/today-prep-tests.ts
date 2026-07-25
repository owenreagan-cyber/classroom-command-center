// Today Prep URL validation + Open With preset tests.
// Run via: bash scripts/test-app-route-shell.sh (bundled with route shell compile)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import {
  DEFAULT_RESOURCE_OPEN_PRESET,
  inferResourceOpenPresetFromUrl,
  normalizeResourceOpenPreset,
  RESOURCE_OPEN_PRESETS,
} from './resourcePresets'
import {
  copyResourceUrl,
  getResourceUrlStatus,
  getResourceUrlWarning,
  isValidResourceUrl,
} from './resourceUrl'

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

assert('blank URL is not valid', !isValidResourceUrl(''))
assert('https URL is valid', isValidResourceUrl('https://example.com/slides'))
assert('http URL is valid', isValidResourceUrl('http://localhost:5173/display'))
assert('ftp URL is invalid', getResourceUrlStatus('ftp://files.example.com') === 'invalid')
assert('missing scheme is invalid', getResourceUrlStatus('example.com') === 'invalid')
assert('blank URL warning mentions missing', getResourceUrlWarning('')?.includes('Missing') === true)
assert('invalid URL warning mentions http', getResourceUrlWarning('not-a-url')?.includes('http') === true)
assert('valid URL has no warning', getResourceUrlWarning('https://classroom.example') === null)

assert('seven resource presets are defined', RESOURCE_OPEN_PRESETS.length === 7)
assert(
  'preset labels include Google Slides',
  RESOURCE_OPEN_PRESETS.some((preset) => preset.label === 'Google Slides'),
)
assert(
  'preset labels include PDF / File Link',
  RESOURCE_OPEN_PRESETS.some((preset) => preset.label === 'PDF / File Link'),
)
assert('unknown preset normalizes to website', normalizeResourceOpenPreset('bad') === 'website')
assert(
  'google-slides preset normalizes',
  normalizeResourceOpenPreset('google-slides') === 'google-slides',
)
assert('default preset is website', DEFAULT_RESOURCE_OPEN_PRESET === 'website')

assert(
  'slides URL infers google-slides',
  inferResourceOpenPresetFromUrl('https://docs.google.com/presentation/d/abc/edit') ===
    'google-slides',
)
assert(
  'docs URL infers google-docs',
  inferResourceOpenPresetFromUrl('https://docs.google.com/document/d/abc/edit') === 'google-docs',
)
assert(
  'drive URL infers google-drive',
  inferResourceOpenPresetFromUrl('https://drive.google.com/file/d/abc/view') === 'google-drive',
)
assert(
  'youtube URL infers youtube',
  inferResourceOpenPresetFromUrl('https://www.youtube.com/watch?v=abc') === 'youtube',
)
assert(
  'pdf URL infers pdf',
  inferResourceOpenPresetFromUrl('https://school.example/lesson.pdf') === 'pdf',
)
assert(
  'generic https URL infers website',
  inferResourceOpenPresetFromUrl('https://classroom.example') === 'website',
)

async function runCopyTests() {
  const copied: string[] = []
  const ok = await copyResourceUrl(
    {
      writeText: async (text: string) => {
        copied.push(text)
      },
    },
    'https://example.com/lesson',
  )
  assert('copyResourceUrl succeeds with clipboard', ok.ok === true)
  assert('copyResourceUrl writes trimmed URL', copied[0] === 'https://example.com/lesson')

  const invalid = await copyResourceUrl(undefined, 'not-a-url')
  assert('copyResourceUrl rejects invalid URL', invalid.ok === false)

  const noClipboard = await copyResourceUrl(undefined, 'https://example.com')
  assert('copyResourceUrl fails without clipboard', noClipboard.ok === false)
}

void runCopyTests().then(() => {
  console.log(`Today prep URL tests: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  }
})
