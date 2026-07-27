import {
  DEVICE_STORAGE_VERSION,
  type DevicePersistedState,
  type DeviceRole,
} from './types'
import { getDeviceById, normalizeDeviceId } from './deviceRegistry'

const VALID_ROLES: DeviceRole[] = [
  'teacher-command-center',
  'omninote-controller',
  'student-display',
  'audio-device',
  'development-device',
]

function sanitizeRole(raw: unknown): DeviceRole | null {
  if (typeof raw !== 'string') return null
  return VALID_ROLES.includes(raw as DeviceRole) ? (raw as DeviceRole) : null
}

export function sanitizePreferredDeviceRoles(
  raw: unknown,
): Partial<Record<DeviceRole, string>> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Partial<Record<DeviceRole, string>> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const role = sanitizeRole(key)
    const deviceId = normalizeDeviceId(value)
    if (role && deviceId && getDeviceById(deviceId)) {
      result[role] = deviceId
    }
  }
  return result
}

export function sanitizeDeviceOverrides(
  raw: unknown,
): DevicePersistedState['deviceOverrides'] {
  if (!raw || typeof raw !== 'object') return {}
  const result: DevicePersistedState['deviceOverrides'] = {}
  for (const [id, patch] of Object.entries(raw as Record<string, unknown>)) {
    const deviceId = normalizeDeviceId(id)
    if (!deviceId || !getDeviceById(deviceId)) continue
    if (!patch || typeof patch !== 'object') continue
    const p = patch as Record<string, unknown>
    result[deviceId] = {
      ...(typeof p.name === 'string' ? { name: p.name } : {}),
      ...(p.status === 'online' || p.status === 'offline' || p.status === 'unknown'
        ? { status: p.status }
        : {}),
    }
  }
  return result
}

export const DEFAULT_DEVICE_STATE: DevicePersistedState = {
  version: DEVICE_STORAGE_VERSION,
  preferredDeviceRoles: {},
  deviceOverrides: {},
}

export function hydrateDeviceState(persisted: unknown): DevicePersistedState {
  const raw = (persisted ?? {}) as Partial<DevicePersistedState>
  return {
    version: DEVICE_STORAGE_VERSION,
    preferredDeviceRoles: sanitizePreferredDeviceRoles(raw.preferredDeviceRoles),
    deviceOverrides: sanitizeDeviceOverrides(raw.deviceOverrides),
  }
}

export function serializeDeviceState(state: DevicePersistedState): string {
  return JSON.stringify({
    version: state.version,
    preferredDeviceRoles: state.preferredDeviceRoles,
    deviceOverrides: state.deviceOverrides,
  })
}

export function parsePersistedDeviceState(json: string): DevicePersistedState {
  return hydrateDeviceState(JSON.parse(json) as unknown)
}
