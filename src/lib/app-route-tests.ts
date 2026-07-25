// Deterministic app route tests.
// Run via: bash scripts/test-app-route.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

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

assert('root path maps to root', getAppRoute('/') === 'root')
assert('empty path maps to root', getAppRoute('') === 'root')
assert('control path maps to control', getAppRoute('/control') === 'control')
assert('display path maps to display', getAppRoute('/display') === 'display')
assert('control trailing slash maps to control', getAppRoute('/control/') === 'control')
assert('display trailing slash maps to display', getAppRoute('/display/') === 'display')
assert('unknown path maps to root', getAppRoute('/settings') === 'root')

console.log(`App route tests: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
