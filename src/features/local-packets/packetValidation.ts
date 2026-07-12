import type { LocalPacketEnvelope, PacketKind } from './types'
import { CURRENT_PACKET_VERSION, MAX_SUPPORTED_PACKET_VERSION, MIN_SUPPORTED_PACKET_VERSION } from './packetVersion'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

function err(field: string, message: string): ValidationError {
  return { field, message }
}

function ok(): ValidationResult {
  return { valid: true, errors: [] }
}

function fail(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors }
}

// ── Envelope validation ───────────────────────────────────────────────

const ALLOWED_KINDS: PacketKind[] = ['daily-brief', 'full-backup']

export function validateEnvelope(raw: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!raw || typeof raw !== 'object') {
    return fail([err('envelope', 'The packet must be a JSON object.')])
  }

  const env = raw as Record<string, unknown>

  if (env.format !== 'classroom-command-center') {
    errors.push(err('format', 'This is not a Classroom Command Center packet. Expected format "classroom-command-center".'))
  }

  if (!ALLOWED_KINDS.includes(env.kind as PacketKind)) {
    errors.push(err('kind', `Unknown packet kind "${String(env.kind)}". Expected "daily-brief" or "full-backup".`))
  }

  if (typeof env.version !== 'number') {
    errors.push(err('version', 'Packet version is missing or not a number.'))
  } else if (env.version > MAX_SUPPORTED_PACKET_VERSION) {
    errors.push(err('version', `This packet was created by a newer unsupported version (${env.version}). The current version is ${CURRENT_PACKET_VERSION}.`))
  } else if (env.version < MIN_SUPPORTED_PACKET_VERSION) {
    errors.push(err('version', `Packet version ${env.version} is too old and cannot be migrated. Minimum supported version is ${MIN_SUPPORTED_PACKET_VERSION}.`))
  }

  if (typeof env.exportedAt !== 'string' || !env.exportedAt) {
    errors.push(err('exportedAt', 'Export timestamp is missing or invalid.'))
  }

  if (env.payload === undefined || env.payload === null) {
    errors.push(err('payload', 'Packet payload is missing.'))
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Daily Brief validation ────────────────────────────────────────────

const VALID_SCREEN_IDS = [
  'homeroom', 'math', 'reading', 'snack-lunch', 'ready-position',
  'writing', 'science', 'social-studies', 'intervention', 'assessment',
  'flexible-groups', 'centers', 'homework-packup',
]

const VALID_VOICE_LEVELS = ['silent', 'whisper', 'normal', 'off']
const VALID_COACHING_STAGES = ['teach', 'practice', 'reinforce', 'maintain', 'reteach']
const VALID_PICKER_CLASSES = ['homeroom', 'math', 'reading']

const MAX_STRING_LENGTH = 10000
const MAX_ARRAY_LENGTH = 200

/** Private data keys that must NOT appear in a daily-brief payload. */
const PRIVATE_TOP_LEVEL_KEYS = ['students', 'roster', 'rosters', 'fairnessHistory',
  'fairness_history', 'activeMysterySessions', 'active_mystery_sessions',
  'mysterySessions', 'pickerHistory', 'picker_history',
  'observations', 'attendance', 'sessionIds', 'studentIds']

export function validateDailyBriefPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!payload || typeof payload !== 'object') {
    return fail([err('payload', 'Daily Brief payload must be a JSON object.')])
  }

  const dbp = payload as Record<string, unknown>

  // Check for private data at top level
  for (const key of PRIVATE_TOP_LEVEL_KEYS) {
    if (key in dbp) {
      errors.push(err(`payload.${key}`, `This Daily Brief packet unexpectedly contains "${key}" data and was rejected.`))
    }
  }

  // Check metadata
  if (!dbp.metadata || typeof dbp.metadata !== 'object') {
    errors.push(err('payload.metadata', 'Daily Brief packet is missing metadata.'))
  } else {
    const meta = dbp.metadata as Record<string, unknown>
    if (typeof meta.packetId !== 'string') errors.push(err('payload.metadata.packetId', 'Packet ID is missing or not a string.'))
    if (typeof meta.title !== 'string') errors.push(err('payload.metadata.title', 'Title is missing or not a string.'))
    if (typeof meta.createdAt !== 'string') errors.push(err('payload.metadata.createdAt', 'Creation timestamp is missing or invalid.'))
  }

  // Check targetScreens
  if (!Array.isArray(dbp.targetScreens)) {
    errors.push(err('payload.targetScreens', 'targetScreens must be an array.'))
  } else {
    for (let i = 0; i < dbp.targetScreens.length; i++) {
      if (!VALID_SCREEN_IDS.includes(dbp.targetScreens[i] as string)) {
        errors.push(err(`payload.targetScreens[${i}]`, `Invalid screen ID "${String(dbp.targetScreens[i])}".`))
      }
    }
  }

  // Check content structure
  if (dbp.content && typeof dbp.content === 'object') {
    const content = dbp.content as Record<string, unknown>
    for (const screenId of Object.keys(content)) {
      if (!VALID_SCREEN_IDS.includes(screenId)) {
        errors.push(err(`payload.content.${screenId}`, `Unknown screen ID "${screenId}" in content.`))
      }
      const screenContent = content[screenId]
      if (screenContent !== null && screenContent !== undefined && typeof screenContent === 'object') {
        const sc = screenContent as Record<string, unknown>
        if (sc.voiceLevel !== undefined && !VALID_VOICE_LEVELS.includes(sc.voiceLevel as string)) {
          errors.push(err(`payload.content.${screenId}.voiceLevel`, `Invalid voice level "${String(sc.voiceLevel)}".`))
        }
        // Check string lengths
        for (const [fieldName, value] of Object.entries(sc)) {
          if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
            errors.push(err(`payload.content.${screenId}.${fieldName}`, `String exceeds maximum length of ${MAX_STRING_LENGTH} characters.`))
          }
          if (Array.isArray(value)) {
            if (value.length > MAX_ARRAY_LENGTH) {
              errors.push(err(`payload.content.${screenId}.${fieldName}`, `Array exceeds maximum length of ${MAX_ARRAY_LENGTH} items.`))
            }
          }
        }
      }
    }
  }

  // Check coaching
  if (dbp.coaching && typeof dbp.coaching === 'object') {
    const coaching = dbp.coaching as Record<string, unknown>
    if (coaching.stage !== undefined && !VALID_COACHING_STAGES.includes(coaching.stage as string)) {
      errors.push(err('payload.coaching.stage', `Invalid coaching stage "${String(coaching.stage)}".`))
    }
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Full Backup validation ────────────────────────────────────────────

export function validateFullBackupPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!payload || typeof payload !== 'object') {
    return fail([err('payload', 'Full backup payload must be a JSON object.')])
  }

  const fbp = payload as Record<string, unknown>

  if (!fbp.categories || typeof fbp.categories !== 'object') {
    errors.push(err('payload.categories', 'Full backup must contain a categories object.'))
  } else {
    const cats = fbp.categories as Record<string, unknown>
    for (const [cat, value] of Object.entries(cats)) {
      if (value !== null && value !== undefined && typeof value === 'object') {
        const serialized = JSON.stringify(value)
        if (serialized.length > MAX_STRING_LENGTH * 100) {
          errors.push(err(`payload.categories.${cat}`, `Category "${cat}" is too large.`))
        }
      }
    }
  }

  if (!Array.isArray(fbp.exportedCategories)) {
    errors.push(err('payload.exportedCategories', 'exportedCategories must be an array.'))
  }

  return errors.length > 0 ? fail(errors) : ok()
}

// ── Combined ──────────────────────────────────────────────────────────

export function validatePacket(raw: string): ValidationResult {
  // Step 1: Is it valid JSON?
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fail([err('json', 'The file does not contain valid JSON.')])
  }

  // Step 2: Validate envelope
  const envResult = validateEnvelope(parsed)
  if (!envResult.valid) return envResult

  const envelope = parsed as LocalPacketEnvelope

  // Step 3: Validate payload by kind
  let payloadResult: ValidationResult
  if (envelope.kind === 'daily-brief') {
    payloadResult = validateDailyBriefPayload(envelope.payload)
  } else if (envelope.kind === 'full-backup') {
    payloadResult = validateFullBackupPayload(envelope.payload)
  } else {
    return fail([err('kind', `Unsupported packet kind "${envelope.kind}".`)])
  }

  return payloadResult
}

// ── Sanitization ──────────────────────────────────────────────────────

export function sanitizeString(value: string, maxLen = MAX_STRING_LENGTH): string {
  return value.slice(0, maxLen).trim()
}

export function sanitizeArray<T>(items: T[], maxLen = MAX_ARRAY_LENGTH): T[] {
  if (!Array.isArray(items)) return []
  return items.slice(0, maxLen)
}

// ── Limits used by validators ─────────────────────────────────────────

export const LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024,     // 10 MB
  maxScreens: 20,
  maxChecklistItems: 50,
  maxVocabularyItems: 50,
  maxStudents: 200,
  maxHistoryEntries: 10000,
  maxStringLength: MAX_STRING_LENGTH,
  maxNestedArraySize: 100,
} as const

export { VALID_SCREEN_IDS, VALID_VOICE_LEVELS, VALID_COACHING_STAGES, VALID_PICKER_CLASSES }
