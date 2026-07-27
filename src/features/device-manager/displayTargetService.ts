import type { ToolId } from '../teacher-dock/types'
import { getToolCapability } from '../teacher-dock/toolCapabilities'
import type { DeviceProfile } from './types'
import { isStudentDisplayDevice } from './capabilities'

/** Payload keys that must never reach the student display route. */
export const DISPLAY_FORBIDDEN_KEYS = [
  'teacherDock',
  'toolRegistry',
  'deviceRegistry',
  'deviceStore',
  'workspaceStore',
  'preferredDeviceRoles',
  'deviceOverrides',
  'dockOrder',
  'favoriteToolIds',
  'activeToolId',
  'teacherSettings',
  'privateRegistry',
  'rosterRaw',
  'studentId',
  'prizeId',
  'readiness',
  'lessonReadiness',
  'missingResources',
  'missingRecommended',
  'curriculumReadiness',
  'teacherOverride',
] as const

export type DisplayForbiddenKey = (typeof DISPLAY_FORBIDDEN_KEYS)[number]

export interface DisplayRouteRequest {
  toolId: ToolId
  payload: unknown
  devices: readonly DeviceProfile[]
}

export interface DisplayRouteResult {
  allowed: boolean
  targetDeviceId: string | null
  sanitizedPayload: unknown
  blockedReason: string | null
}

function containsForbiddenKey(value: unknown, depth = 0): string | null {
  if (depth > 8 || value === null || value === undefined) return null
  if (typeof value !== 'object') return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = containsForbiddenKey(item, depth + 1)
      if (nested) return nested
    }
    return null
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (DISPLAY_FORBIDDEN_KEYS.includes(key as DisplayForbiddenKey)) {
      return key
    }
    const nested = containsForbiddenKey(
      (value as Record<string, unknown>)[key],
      depth + 1,
    )
    if (nested) return nested
  }
  return null
}

/** Strip forbidden keys from a payload before routing to display. */
export function sanitizeForDisplayRoute(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload
  if (typeof payload !== 'object') return payload

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeForDisplayRoute(item))
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (DISPLAY_FORBIDDEN_KEYS.includes(key as DisplayForbiddenKey)) continue
    result[key] = sanitizeForDisplayRoute(value)
  }
  return result
}

export function isDisplaySafePayload(payload: unknown): boolean {
  return containsForbiddenKey(payload) === null
}

/**
 * Route tool output to student display when capability requires it.
 * Teacher control surfaces never receive display-only routing.
 */
export function resolveDisplayTarget(request: DisplayRouteRequest): DisplayRouteResult {
  const capability = getToolCapability(request.toolId)
  const forbidden = containsForbiddenKey(request.payload)

  if (forbidden) {
    return {
      allowed: false,
      targetDeviceId: null,
      sanitizedPayload: null,
      blockedReason: `Private field "${forbidden}" cannot be sent to student display.`,
    }
  }

  if (capability.displayTarget === 'optional' || capability.displayTarget === 'none') {
    return {
      allowed: true,
      targetDeviceId: null,
      sanitizedPayload: sanitizeForDisplayRoute(request.payload),
      blockedReason: null,
    }
  }

  const displayDevice = request.devices.find(isStudentDisplayDevice)
  if (!displayDevice || displayDevice.status === 'offline') {
    return {
      allowed: false,
      targetDeviceId: null,
      sanitizedPayload: null,
      blockedReason: 'Student display unavailable for routing.',
    }
  }

  return {
    allowed: true,
    targetDeviceId: displayDevice.id,
    sanitizedPayload: sanitizeForDisplayRoute(request.payload),
    blockedReason: null,
  }
}

/** Student display route must never mount teacher dock or registries. */
export function shouldExposeOnDisplayRoute(
  surface: 'teacher-dock' | 'tool-registry' | 'device-registry',
): boolean {
  void surface
  return false
}
