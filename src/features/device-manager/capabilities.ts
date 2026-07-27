import type { DeviceCapability, DeviceProfile, DeviceRole } from './types'

/** Check whether a device exposes a specific capability. */
export function deviceHasCapability(
  device: DeviceProfile,
  capability: DeviceCapability,
): boolean {
  return device.capabilities.includes(capability)
}

/** Check whether a device is assigned a specific role. */
export function deviceHasRole(device: DeviceProfile, role: DeviceRole): boolean {
  return device.role === role
}

/** Find devices that match a role and are currently online or unknown. */
export function filterDevicesByRole(
  devices: readonly DeviceProfile[],
  role: DeviceRole,
): DeviceProfile[] {
  return devices.filter((device) => device.role === role)
}

/** Find the first available device for a role (online preferred). */
export function findAvailableDeviceForRole(
  devices: readonly DeviceProfile[],
  role: DeviceRole,
): DeviceProfile | undefined {
  const matches = filterDevicesByRole(devices, role)
  return (
    matches.find((device) => device.status === 'online') ??
    matches.find((device) => device.status === 'unknown') ??
    matches[0]
  )
}

/** Whether a device can act as a student-safe display output. */
export function isStudentDisplayDevice(device: DeviceProfile): boolean {
  return (
    device.role === 'student-display' &&
    deviceHasCapability(device, 'student-safe') &&
    deviceHasCapability(device, 'projector-output')
  )
}
