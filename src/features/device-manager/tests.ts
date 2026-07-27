function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import {
  DEFAULT_DEVICE_REGISTRY,
  getDeviceById,
  hydrateDeviceRegistry,
  resolveUnknownDevice,
} from './deviceRegistry'
import {
  deviceHasCapability,
  deviceHasRole,
  findAvailableDeviceForRole,
  isStudentDisplayDevice,
} from './capabilities'
import {
  hydrateDeviceState,
  parsePersistedDeviceState,
  serializeDeviceState,
} from './devicePersistence'
import {
  isToolBlockedByDevices,
  resolveToolLaunch,
} from './launchResolver'
import {
  DISPLAY_FORBIDDEN_KEYS,
  isDisplaySafePayload,
  resolveDisplayTarget,
  sanitizeForDisplayRoute,
  shouldExposeOnDisplayRoute,
} from './displayTargetService'
import { getWorkspaceById } from '../workspace/workspaceRegistry'

function testDeviceRegistryLoads() {
  assert(DEFAULT_DEVICE_REGISTRY.length >= 3, 'expected default device registry')
  const mac = getDeviceById('teacher-mac')
  assert(Boolean(mac), 'teacher-mac must exist')
  assert(mac!.role === 'teacher-command-center', 'mac must be teacher command center')
  const ipad = getDeviceById('school-ipad')
  assert(Boolean(ipad), 'school-ipad must exist')
  assert(ipad!.role === 'omninote-controller', 'ipad must be omninote controller')
  console.log('  device registry loads OK')
}

function testUnknownDevicesHandled() {
  const unknown = resolveUnknownDevice('random-device')
  assert(unknown.type === 'unknown', 'unknown device type')
  assert(unknown.role === 'development-device', 'unknown device role')
  assert(unknown.status === 'unknown', 'unknown device status')
  const hydrated = hydrateDeviceRegistry({})
  assert(hydrated.length === DEFAULT_DEVICE_REGISTRY.length, 'hydrate preserves count')
  console.log('  unknown devices handled OK')
}

function testCapabilityChecksWork() {
  const mac = getDeviceById('teacher-mac')!
  assert(deviceHasRole(mac, 'teacher-command-center'), 'mac role check')
  assert(deviceHasCapability(mac, 'planning'), 'mac planning capability')
  assert(!deviceHasCapability(mac, 'apple-pencil'), 'mac lacks pencil')
  const display = getDeviceById('classroom-display')!
  assert(isStudentDisplayDevice(display), 'display is student display device')
  const online = findAvailableDeviceForRole(DEFAULT_DEVICE_REGISTRY, 'omninote-controller')
  assert(online?.id === 'school-ipad', 'find ipad for omninote role')
  console.log('  capability checks work OK')
}

function testOmniNoteRequiresIpadRole() {
  const resolution = resolveToolLaunch('omninote', DEFAULT_DEVICE_REGISTRY)
  assert(resolution.success, 'omninote launches when ipad online')
  assert(resolution.controlDevice?.role === 'omninote-controller', 'omninote control on ipad')

  const offlineIpad = DEFAULT_DEVICE_REGISTRY.map((device) =>
    device.id === 'school-ipad' ? { ...device, status: 'offline' as const } : device,
  )
  const blocked = resolveToolLaunch('omninote', offlineIpad)
  assert(!blocked.success, 'omninote blocked when ipad offline')
  assert(blocked.fallbackAvailable, 'fallback available for omninote')
  assert(
    blocked.message === 'OmniNote controller unavailable',
    'omninote fallback message',
  )
  assert(isToolBlockedByDevices('omninote', offlineIpad), 'omninote blocked by devices')
  console.log('  omninote requires ipad role OK')
}

function testPrizeBoardLaunchRouting() {
  const resolution = resolveToolLaunch('prize-board', DEFAULT_DEVICE_REGISTRY)
  assert(resolution.success, 'prize board launches with default devices')
  assert(
    resolution.controlDevice?.role === 'teacher-command-center',
    'prize board control on teacher mac',
  )
  assert(
    resolution.displayDevice?.role === 'student-display',
    'prize board display on student display',
  )
  console.log('  prize board launch routing OK')
}

function testOmniNoteLaunchWithDisplayTarget() {
  const resolution = resolveToolLaunch('omninote', DEFAULT_DEVICE_REGISTRY)
  assert(resolution.controlDevice?.id === 'school-ipad', 'omninote control on ipad')
  assert(
    resolution.displayDevice?.id === 'classroom-display',
    'omninote display on classroom display',
  )
  console.log('  omninote launch with display target OK')
}

function testDisplayToolsRouteCorrectly() {
  const prizeBoard = resolveDisplayTarget({
    toolId: 'prize-board',
    payload: { tileCount: 12, revealedTiles: [] },
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(prizeBoard.allowed, 'prize board routes to display')
  assert(prizeBoard.targetDeviceId === 'classroom-display', 'prize board display target')

  const timers = resolveDisplayTarget({
    toolId: 'timers',
    payload: { remainingSeconds: 120 },
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(timers.allowed, 'timers allowed on display route')
  assert(timers.targetDeviceId === null, 'timers display target optional')
  console.log('  display tools route correctly OK')
}

function testIncompatibleToolsBlocked() {
  const offlineTeacher = DEFAULT_DEVICE_REGISTRY.map((device) =>
    device.role === 'teacher-command-center'
      ? { ...device, status: 'offline' as const }
      : device,
  )
  const blocked = resolveToolLaunch('dashboard', offlineTeacher, { allowFallback: false })
  assert(!blocked.success, 'dashboard blocked without teacher mac when no fallback')
  assert(!blocked.fallbackAvailable, 'no fallback when disabled')
  console.log('  incompatible tools blocked OK')
}

function testDevicePersistence() {
  const saved = hydrateDeviceState({
    preferredDeviceRoles: { 'omninote-controller': 'school-ipad', bogus: 'nope' },
    deviceOverrides: { 'school-ipad': { status: 'offline' } },
  })
  assert(
    saved.preferredDeviceRoles['omninote-controller'] === 'school-ipad',
    'preferred role persisted',
  )
  assert(!('bogus' in saved.preferredDeviceRoles), 'invalid preferred role removed')
  assert(saved.deviceOverrides['school-ipad']?.status === 'offline', 'device override persisted')
  const reloaded = parsePersistedDeviceState(serializeDeviceState(saved))
  assert(
    reloaded.preferredDeviceRoles['omninote-controller'] === 'school-ipad',
    'device state round-trip',
  )
  console.log('  device persistence OK')
}

function testDisplayPrivacyBoundaries() {
  assert(!shouldExposeOnDisplayRoute('teacher-dock'), 'dock hidden on display')
  assert(!shouldExposeOnDisplayRoute('tool-registry'), 'registry hidden on display')
  assert(!shouldExposeOnDisplayRoute('device-registry'), 'device registry hidden on display')

  const unsafe = {
    tileCount: 12,
    teacherDock: { activeToolId: 'prize-board' },
  }
  assert(!isDisplaySafePayload(unsafe), 'unsafe payload detected')
  const blocked = resolveDisplayTarget({
    toolId: 'prize-board',
    payload: unsafe,
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(!blocked.allowed, 'unsafe payload blocked from display')

  const sanitized = sanitizeForDisplayRoute(unsafe) as Record<string, unknown>
  assert(!('teacherDock' in sanitized), 'teacher dock stripped')
  assert(isDisplaySafePayload(sanitized), 'sanitized payload safe')
  assert(DISPLAY_FORBIDDEN_KEYS.includes('toolRegistry'), 'forbidden keys include registry')
  console.log('  display privacy boundaries OK')
}

function testTeacherToolsNeverRouteToDisplayAsControl() {
  const teacherOnly = resolveDisplayTarget({
    toolId: 'dashboard',
    payload: { widgets: [] },
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(teacherOnly.allowed, 'dashboard payload allowed when optional')
  assert(teacherOnly.targetDeviceId === null, 'teacher dashboard never targets display')

  const deviceSettings = resolveDisplayTarget({
    toolId: 'prize-board',
    payload: { deviceRegistry: DEFAULT_DEVICE_REGISTRY, tileCount: 12 },
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(!deviceSettings.allowed, 'device registry blocked on display route')
  console.log('  teacher tools never route private control to display OK')
}

function testClassroomWorkflowMathLesson() {
  const launch = resolveToolLaunch('omninote', DEFAULT_DEVICE_REGISTRY)
  assert(launch.success, 'math lesson omninote launch succeeds')
  assert(launch.controlDevice?.role === 'omninote-controller', 'math omninote targets ipad')
  const display = resolveDisplayTarget({
    toolId: 'omninote',
    payload: { lessonTitle: 'Fractions', slideIndex: 0 },
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(display.allowed, 'math omninote display route allowed')
  assert(display.targetDeviceId === 'classroom-display', 'math omninote routes to display')
  console.log('  classroom workflow math lesson OK')
}

function testClassroomWorkflowRewardMode() {
  const launch = resolveToolLaunch('prize-board', DEFAULT_DEVICE_REGISTRY)
  assert(launch.success, 'reward mode prize board launch succeeds')
  assert(launch.controlDevice?.role === 'teacher-command-center', 'prize board control on teacher')
  assert(launch.displayDevice?.role === 'student-display', 'prize board output on display')
  console.log('  classroom workflow reward mode OK')
}

function testClassroomWorkflowMorningMode() {
  const morning = getWorkspaceById('morning')
  assert(Boolean(morning), 'morning workspace exists')
  const expected = ['dashboard', 'morning-message', 'classroom-atmosphere', 'timers']
  assert(
    JSON.stringify(morning!.promotedToolIds) === JSON.stringify(expected),
    'morning promoted tools order',
  )
  console.log('  classroom workflow morning mode OK')
}

console.log('Device manager tests')
testDeviceRegistryLoads()
testUnknownDevicesHandled()
testCapabilityChecksWork()
testOmniNoteRequiresIpadRole()
testPrizeBoardLaunchRouting()
testOmniNoteLaunchWithDisplayTarget()
testDisplayToolsRouteCorrectly()
testIncompatibleToolsBlocked()
testDevicePersistence()
testDisplayPrivacyBoundaries()
testTeacherToolsNeverRouteToDisplayAsControl()
testClassroomWorkflowMathLesson()
testClassroomWorkflowRewardMode()
testClassroomWorkflowMorningMode()
console.log('All device manager tests passed.')
