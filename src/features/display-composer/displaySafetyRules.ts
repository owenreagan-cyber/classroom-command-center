/**
 * Phase 15L.1 — Student display safety rules.
 *
 * Centralizes the forbidden phrases/keys that must never reach the student
 * /display route. Pure functions — no React, no store, no DOM. Consumed by:
 *   - scripts/test-display-studio.sh (shell-level file scan guard)
 *   - src/lib/display-studio-tests.ts (executable regression tests)
 *
 * This is the executable replacement for "don't rely on comments": the leaked
 * implementation-note regression ("I'll actually do this differently…") is now
 * a phrase in DISPLAY_FORBIDDEN_PHRASES that both the guard and the tests check.
 */

/** Forbidden keys that must never appear on a display-safe projection. */
export const DISPLAY_FORBIDDEN_KEYS: readonly string[] = ['updatedAt', 'version', 'teacherNotes']

/**
 * Phrases that must never appear in a student-facing renderer file (the files
 * that actually mount on /display). "teacherNotes" is listed even though it is
 * a valid field name in teacher-side files, because no student-facing renderer
 * should ever reference it. The shell guard scopes this list to the renderer
 * files only, so teacher-side references remain legitimate.
 */
export const DISPLAY_FORBIDDEN_PHRASES: readonly string[] = [
  "I'll actually do this differently",
  'actually do this differently',
  'update key layout areas',
  'teacherNotes',
  'teacher notes',
  'console.log',
]

/** Case-insensitive scan of a block of text for any forbidden phrase. */
export function scanForForbiddenPhrases(text: string): string[] {
  const lower = text.toLowerCase()
  const matches: string[] = []
  for (const phrase of DISPLAY_FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) matches.push(phrase)
  }
  return matches
}

/** Whether an object carries any forbidden (teacher-only) key at the top level. */
export function hasForbiddenDisplayKeys(obj: object): boolean {
  return DISPLAY_FORBIDDEN_KEYS.some((key) => key in obj)
}
