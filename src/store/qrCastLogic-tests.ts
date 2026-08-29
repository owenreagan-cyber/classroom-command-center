import { normalizeCastUrl } from './qrCastLogic'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

assert(normalizeCastUrl('https://example.com') === 'https://example.com', 'a normal URL passes through unchanged')
assert(normalizeCastUrl('  https://example.com  ') === 'https://example.com', 'surrounding whitespace is trimmed')
assert(normalizeCastUrl('') === null, 'an empty string normalizes to null')
assert(normalizeCastUrl('   ') === null, 'a whitespace-only string normalizes to null')

console.log('qrCastLogic tests passed.')
