import type { ToolId } from '../teacher-dock/types'
import { getToolCapability } from '../teacher-dock/toolCapabilities'
import { findAvailableDeviceForRole } from './capabilities'
import type { DeviceProfile, DeviceRole } from './types'

export interface LaunchResolution {
  success: boolean
  toolId: ToolId
  controlDevice: DeviceProfile | null
  displayDevice: DeviceProfile | null
  fallbackAvailable: boolean
  message: string
}

export interface LaunchResolverOptions {
  allowFallback?: boolean
}

const FALLBACK_MESSAGES: Partial<Record<DeviceRole, string>> = {
  'omninote-controller': 'OmniNote controller unavailable',
  'teacher-command-center':
    'Teacher command center unavailable. Some tools may be limited.',
  'student-display':
    'Student display unavailable. Output will stay on teacher screen.',
}

/**
 * Resolve where a tool should launch based on device roles and availability.
 */
export function resolveToolLaunch(
  toolId: ToolId,
  devices: readonly DeviceProfile[],
  options: LaunchResolverOptions = {},
): LaunchResolution {
  const capability = getToolCapability(toolId)
  const { allowFallback = true } = options

  const controlDevice = findAvailableDeviceForRole(
    devices,
    capability.requiredDeviceRole,
  )

  if (!controlDevice || controlDevice.status === 'offline') {
    const fallbackAvailable = allowFallback && capability.requiredDeviceRole !== 'student-display'
    return {
      success: false,
      toolId,
      controlDevice: null,
      displayDevice: null,
      fallbackAvailable,
      message:
        FALLBACK_MESSAGES[capability.requiredDeviceRole] ??
        `${capability.requiredDeviceRole} device unavailable.`,
    }
  }

  let displayDevice: DeviceProfile | null = null
  if (capability.displayTarget === 'student-display') {
    displayDevice = findAvailableDeviceForRole(devices, 'student-display') ?? null
    if (!displayDevice || displayDevice.status === 'offline') {
      return {
        success: true,
        toolId,
        controlDevice,
        displayDevice: null,
        fallbackAvailable: true,
        message: 'Student display unavailable. Teacher can continue with on-screen preview.',
      }
    }
  }

  return {
    success: true,
    toolId,
    controlDevice,
    displayDevice,
    fallbackAvailable: false,
    message: `Launch ${toolId} on ${controlDevice.name}.`,
  }
}

/** Whether a tool can launch given current device availability. */
export function canLaunchTool(
  toolId: ToolId,
  devices: readonly DeviceProfile[],
): boolean {
  const resolution = resolveToolLaunch(toolId, devices, { allowFallback: true })
  return resolution.success || resolution.fallbackAvailable
}

/** Block tools that require unavailable roles with no fallback path. */
export function isToolBlockedByDevices(
  toolId: ToolId,
  devices: readonly DeviceProfile[],
): boolean {
  const capability = getToolCapability(toolId)
  const controlDevice = findAvailableDeviceForRole(
    devices,
    capability.requiredDeviceRole,
  )
  if (!controlDevice || controlDevice.status === 'offline') {
    return capability.requiredDeviceRole === 'omninote-controller'
  }
  return false
}
