/**
 * Keyboard safety helper — prevents global keyboard shortcuts from
 * firing while the user is typing in a text input, textarea, or
 * contenteditable element.
 *
 * Works in both browser (HTMLElement) and test environments (plain objects).
 */

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false
  // Browser environment: use instanceof
  if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true
    if (target.getAttribute('role') === 'textbox') return true
    return false
  }
  // Node.js / test environment: duck-type check
  const el = target as unknown as Record<string, unknown>
  const tag = typeof el.tagName === 'string' ? el.tagName : ''
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable === true || (typeof el.isContentEditable === 'string' && el.isContentEditable === 'true')) return true
  if (typeof el.getAttribute === 'function' && (el.getAttribute as (attr: string) => string | null)('role') === 'textbox') return true
  return false
}
