import type { DeviceProfile, DeviceRole, DeviceType } from './types'

/** Default classroom device profiles for the local operating system. */
export const DEFAULT_DEVICE_REGISTRY: readonly DeviceProfile[] = [
  {
    id: 'teacher-mac',
    name: 'Teacher MacBook',
    type: 'mac',
    role: 'teacher-command-center',
    capabilities: ['planning', 'lesson-launch', 'ai-tools'],
    status: 'online',
    lastSeen: null,
  },
  {
    id: 'school-ipad',
    name: 'School iPad A16',
    type: 'ipad',
    role: 'omninote-controller',
    capabilities: ['apple-pencil', 'touch', 'annotation', 'presentation'],
    status: 'online',
    lastSeen: null,
  },
  {
    id: 'classroom-display',
    name: 'Apple TV / Samsung Display',
    type: 'display',
    role: 'student-display',
    capabilities: ['projector-output', 'student-safe'],
    status: 'online',
    lastSeen: null,
  },
] as const

const REGISTRY_BY_ID = new Map<string, DeviceProfile>(
  DEFAULT_DEVICE_REGISTRY.map((device) => [device.id, device]),
)

export function getDeviceById(id: string): DeviceProfile | undefined {
  return REGISTRY_BY_ID.get(id)
}

export function getDevicesByRole(role: DeviceRole): DeviceProfile[] {
  return DEFAULT_DEVICE_REGISTRY.filter((device) => device.role === role)
}

export function getDevicesByType(type: DeviceType): DeviceProfile[] {
  return DEFAULT_DEVICE_REGISTRY.filter((device) => device.type === type)
}

/** Merge registry defaults with persisted overrides (name, status). */
export function hydrateDeviceRegistry(
  overrides: Record<string, Partial<Pick<DeviceProfile, 'name' | 'status'>>> = {},
): DeviceProfile[] {
  return DEFAULT_DEVICE_REGISTRY.map((device) => {
    const patch = overrides[device.id]
    if (!patch) return { ...device }
    return {
      ...device,
      name: patch.name ?? device.name,
      status: patch.status ?? device.status,
    }
  })
}

/** Unknown device ids resolve to a safe placeholder profile. */
export function resolveUnknownDevice(id: string): DeviceProfile {
  return {
    id,
    name: 'Unknown Device',
    type: 'unknown',
    role: 'development-device',
    capabilities: [],
    status: 'unknown',
    lastSeen: null,
  }
}

export function normalizeDeviceId(id: unknown): string | null {
  if (typeof id !== 'string' || !id.trim()) return null
  return id.trim()
}
