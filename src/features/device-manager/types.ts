/** Hardware form factor for a classroom device. */
export type DeviceType = 'mac' | 'ipad' | 'apple-tv' | 'display' | 'unknown'

/** Role a device plays in the classroom operating system. */
export type DeviceRole =
  | 'teacher-command-center'
  | 'omninote-controller'
  | 'student-display'
  | 'audio-device'
  | 'development-device'

export type DeviceStatus = 'online' | 'offline' | 'unknown'

/** Capability tokens a device may expose. */
export type DeviceCapability =
  | 'planning'
  | 'lesson-launch'
  | 'ai-tools'
  | 'apple-pencil'
  | 'touch'
  | 'annotation'
  | 'presentation'
  | 'projector-output'
  | 'student-safe'
  | 'audio-output'
  | 'development'

export interface DeviceProfile {
  id: string
  name: string
  type: DeviceType
  role: DeviceRole
  capabilities: readonly DeviceCapability[]
  status: DeviceStatus
  lastSeen: string | null
}

export interface DevicePersistedState {
  version: 1
  preferredDeviceRoles: Partial<Record<DeviceRole, string>>
  deviceOverrides: Record<string, Partial<Pick<DeviceProfile, 'name' | 'status'>>>
}

export const DEVICE_STORAGE_KEY = 'classroom-device-manager-v1'
export const DEVICE_STORAGE_VERSION = 1 as const
