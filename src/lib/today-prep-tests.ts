// Today Prep URL validation tests.
// Run via: bash scripts/test-app-route-shell.sh (bundled with route shell compile)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import {
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

console.log(`Today prep URL tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
