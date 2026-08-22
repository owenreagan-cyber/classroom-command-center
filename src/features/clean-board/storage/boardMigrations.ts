import { BOARD_SCHEMA_VERSION, sanitizeBoardState } from './boardSerialization'
import type { BoardState } from '../types'

/**
 * DB-4A — board migrations (pure, no DOM).
 *
 * Version gate for persisted board state. `migrateBoardState` maps an unknown
 * persisted value to the current schema, or returns null so the caller falls
 * back to seed/empty state (never crash). Future schema bumps add explicit
 * migration steps here; unknown/higher versions are rejected rather than
 * guessed at.
 */

/**
 * The single migration entrypoint. Returns a sanitized `BoardState` at the
 * current schema version, or null when the value is missing, corrupt, or from
 * a schema version this build does not understand.
 */
export function migrateBoardState(raw: unknown): BoardState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const record = raw as Record<string, unknown>
  const version = record.schemaVersion

  // No version → pre-versioned data we cannot safely interpret.
  if (typeof version !== 'number') return null

  // Future version → this build is too old; do not guess.
  if (version > BOARD_SCHEMA_VERSION) return null

  // Current (and any historical versions) funnel through sanitization. A
  // historical version could add a `version < BOARD_SCHEMA_VERSION` branch here
  // to reshape fields before sanitizing.
  return sanitizeBoardState(raw)
}
