function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { shouldMountTeacherDock } from '../../app/appRouteShell'
import {
  getDefaultDockOrder,
  TEACHER_TOOL_REGISTRY,
  getLauncherTools,
  getToolById,
  isToolLaunchable,
  shouldExposeToolRegistryOnRoute,
} from './toolRegistry'
import { REGISTERED_TOOL_PANEL_IDS } from './toolPanelIds'
import {
  DEFAULT_DOCK_STATE,
  hydrateDockState,
  parsePersistedDockState,
  serializeDockState,
} from './dockPersistence'
import type { ToolId } from './types'
import { getToolCapability, TOOL_CAPABILITY_REGISTRY } from './toolCapabilities'
import { getWorkspaceAwareLauncherTools } from '../workspace/workspaceResolver'
import { resolveToolLaunch } from '../device-manager/launchResolver'
import { DEFAULT_DEVICE_REGISTRY } from '../device-manager/deviceRegistry'
import { isDisplaySafePayload, resolveDisplayTarget } from '../device-manager/displayTargetService'

function testToolCapabilitiesRegistered() {
  for (const tool of TEACHER_TOOL_REGISTRY) {
    const capability = getToolCapability(tool.id)
    assert(Boolean(capability.requiredDeviceRole), `${tool.id} has device role`)
    assert(Boolean(capability.displayTarget), `${tool.id} has display target`)
    assert(capability.permissions.includes('teacher-only'), `${tool.id} teacher-only capability`)
    assert(capability.modeSupport !== undefined, `${tool.id} has workspace mode support`)
  }
  assert(
    getToolCapability('omninote').requiredDeviceRole === 'omninote-controller',
    'omninote requires omninote-controller',
  )
  assert(
    getToolCapability('prize-board').displayTarget === 'student-display',
    'prize board routes to student display',
  )
  console.log('  tool capabilities registered OK')
}

function testToolCapabilityContracts() {
  const omninote = getToolCapability('omninote')
  assert(omninote.requiredDeviceRole === 'omninote-controller', 'omninote device role')
  assert(omninote.displayTarget === 'student-display', 'omninote display target')
  assert(omninote.modeSupport.includes('math'), 'omninote math workspace')

  const prizeBoard = getToolCapability('prize-board')
  assert(prizeBoard.requiredDeviceRole === 'teacher-command-center', 'prize board device role')
  assert(prizeBoard.displayTarget === 'student-display', 'prize board display target')
  assert(prizeBoard.modeSupport.includes('reward'), 'prize board reward workspace')

  const timers = getToolCapability('timers')
  assert(timers.requiredDeviceRole === 'teacher-command-center', 'timers device role')
  assert(timers.displayTarget === 'optional', 'timers optional display target')
  assert(timers.modeSupport.includes('morning'), 'timers morning workspace')

  const music = getToolCapability('classroom-atmosphere')
  assert(music.requiredDeviceRole === 'teacher-command-center', 'music device role')
  assert(music.displayTarget === 'optional', 'music optional display target')
  assert(music.modeSupport.includes('transition'), 'music transition workspace')
  console.log('  tool capability contracts OK')
}

function testWorkspaceAwareLauncher() {
  const order = getDefaultDockOrder()
  const mathTools = getWorkspaceAwareLauncherTools(order, [], 'math')
  const promotedIndex = mathTools.findIndex((tool) => tool.id === 'omninote')
  assert(promotedIndex >= 0 && promotedIndex < 4, 'omninote promoted in math')
  assert(mathTools.some((tool) => tool.id === 'jobs'), 'all tools remain in math launcher')
  console.log('  workspace aware launcher OK')
}

function testDeviceAwareLaunchResolution() {
  const resolution = resolveToolLaunch('omninote', DEFAULT_DEVICE_REGISTRY)
  assert(resolution.success, 'omninote resolves with default devices')
  assert(resolution.controlDevice?.id === 'school-ipad', 'omninote targets ipad')

  const prizeBoard = resolveToolLaunch('prize-board', DEFAULT_DEVICE_REGISTRY)
  assert(prizeBoard.controlDevice?.role === 'teacher-command-center', 'prize board teacher control')
  assert(prizeBoard.displayDevice?.role === 'student-display', 'prize board student display')
  console.log('  device aware launch resolution OK')
}

function testDisplayNeverReceivesPrivateRegistry() {
  const unsafe = { toolRegistry: TOOL_CAPABILITY_REGISTRY, teacherSettings: {} }
  assert(!isDisplaySafePayload(unsafe), 'registry payload unsafe for display')
  const route = resolveDisplayTarget({
    toolId: 'display',
    payload: unsafe,
    devices: DEFAULT_DEVICE_REGISTRY,
  })
  assert(!route.allowed, 'display route blocks private registry')
  console.log('  display never receives private registry OK')
}

function testRegistryShape() {
  for (const tool of TEACHER_TOOL_REGISTRY) {
    assert(Boolean(tool.id), 'tool id required')
    assert(Boolean(tool.title), 'tool title required')
    assert(Boolean(tool.category), 'tool category required')
    assert(Boolean(tool.icon), 'tool icon required')
    assert(Boolean(tool.description), 'tool description required')
    assert(tool.permissions.includes('teacher-only'), `${tool.id} must be teacher-only`)
    assert(
      tool.permissions.includes('control-route-only'),
      `${tool.id} must be control-route-only`,
    )
    assert(tool.componentId === tool.id, `${tool.id} componentId must match id`)
  }
  console.log('  registry shape OK')
}

function testInactiveToolsHiddenFromLauncher() {
  const inactive = TEACHER_TOOL_REGISTRY.filter((tool) => tool.status === 'inactive')
  assert(inactive.length > 0, 'expected at least one inactive tool for test')
  const launcher = getLauncherTools(
    TEACHER_TOOL_REGISTRY.map((tool) => tool.id),
    [],
  )
  for (const tool of inactive) {
    assert(
      !launcher.some((entry) => entry.id === tool.id),
      `${tool.id} must not appear in launcher`,
    )
  }
  console.log('  inactive tools hidden from launcher OK')
}

function testInactiveToolLaunchGuard() {
  const noise = getToolById('noise')
  assert(Boolean(noise), 'noise tool must exist')
  assert(noise!.status === 'inactive', 'noise must be inactive by default')
  assert(!isToolLaunchable(noise!.status), 'inactive tool must not be launchable')
  console.log('  inactive tool launch guard OK')
}

function testInactiveToolRegisteredButNotLaunchable() {
  assert(REGISTERED_TOOL_PANEL_IDS.includes('noise'), 'noise panel registered for future activation')
  assert(!isToolLaunchable(getToolById('noise')!.status), 'noise must stay inactive in registry')
  console.log('  inactive tool registered but not launchable OK')
}

function testRegistryPrivacyOnDisplayRoute() {
  assert(shouldExposeToolRegistryOnRoute('control'), 'registry exposed on control')
  assert(!shouldExposeToolRegistryOnRoute('display'), 'registry hidden on display')
  assert(shouldMountTeacherDock('control'), 'dock mounts on control')
  assert(!shouldMountTeacherDock('display'), 'dock hidden on display')
  console.log('  registry privacy on display route OK')
}

function testAllActiveToolsHavePanels() {
  assert(
    REGISTERED_TOOL_PANEL_IDS.length === TEACHER_TOOL_REGISTRY.length,
    'panel id count must match registry',
  )
  for (const tool of TEACHER_TOOL_REGISTRY) {
    assert(
      REGISTERED_TOOL_PANEL_IDS.includes(tool.id),
      `missing panel registration for ${tool.id}`,
    )
  }
  console.log('  all tools mapped to panels OK')
}

function testRequiredMigrationToolsPresent() {
  const required: ToolId[] = [
    'dashboard',
    'timers',
    'classroom-atmosphere',
    'morning-message',
    'today-prep',
    'curriculum-sync',
    'mystery-star',
    'quick-picker',
    'prize-board',
    'materials',
    'display',
    'omninote',
    'jobs',
    'noise',
  ]
  for (const id of required) {
    assert(Boolean(getToolById(id)), `missing migrated tool ${id}`)
  }
  console.log('  required migrated tools present OK')
}

function testCollapsePersistence() {
  const saved = hydrateDockState({ collapsed: true, activeToolId: 'dashboard' })
  assert(saved.collapsed === true, 'collapsed state must persist through hydrate')
  const reloaded = parsePersistedDockState(serializeDockState(saved))
  assert(reloaded.collapsed === true, 'collapsed state must survive JSON round-trip')
  console.log('  collapse persistence OK')
}

function testToolOrderPersistence() {
  const customOrder: ToolId[] = [
    'prize-board',
    'dashboard',
    'timers',
    'morning-message',
    'today-prep',
    'display',
    'materials',
    'omninote',
    'mystery-star',
    'quick-picker',
    'jobs',
    'classroom-atmosphere',
    'board-control',
  ]
  const saved = hydrateDockState({
    dockOrder: customOrder,
    favoriteToolIds: ['prize-board', 'dashboard'],
  })
  assert(saved.dockOrder[0] === 'prize-board', 'custom dock order must be preserved')
  assert(saved.favoriteToolIds.includes('prize-board'), 'favorites must be preserved')
  const reloaded = parsePersistedDockState(serializeDockState(saved))
  assert(reloaded.dockOrder[0] === 'prize-board', 'dock order must survive JSON round-trip')
  console.log('  tool order persistence OK')
}

function testActiveToolPersistence() {
  const saved = hydrateDockState({ activeToolId: 'prize-board', collapsed: false })
  assert(saved.activeToolId === 'prize-board', 'active tool must hydrate as prize-board')
  const reloaded = parsePersistedDockState(serializeDockState(saved))
  assert(reloaded.activeToolId === 'prize-board', 'active tool must survive JSON round-trip')
  console.log('  active tool persistence OK')
}

function testInactiveActiveToolRejectedOnHydrate() {
  const saved = hydrateDockState({ activeToolId: 'noise' })
  assert(
    saved.activeToolId === DEFAULT_DOCK_STATE.activeToolId,
    'inactive activeToolId must fall back to default',
  )
  console.log('  inactive active tool rejected on hydrate OK')
}

function testInvalidToolIdsSanitizedOnHydrate() {
  const saved = hydrateDockState({
    dockOrder: ['not-a-tool', 'dashboard', 'noise'],
    favoriteToolIds: ['unknown', 'timers'],
    activeToolId: 'bogus',
  })
  assert(!saved.dockOrder.includes('not-a-tool' as ToolId), 'unknown order ids removed')
  assert(!saved.dockOrder.includes('noise'), 'inactive tool removed from order')
  assert(saved.favoriteToolIds.includes('timers'), 'valid favorite kept')
  assert(saved.activeToolId === 'dashboard', 'invalid active tool falls back')
  console.log('  invalid tool ids sanitized on hydrate OK')
}

console.log('Teacher command dock tests')
testToolCapabilitiesRegistered()
testToolCapabilityContracts()
testWorkspaceAwareLauncher()
testDeviceAwareLaunchResolution()
testDisplayNeverReceivesPrivateRegistry()
testRegistryShape()
testInactiveToolsHiddenFromLauncher()
testInactiveToolLaunchGuard()
testInactiveToolRegisteredButNotLaunchable()
testRegistryPrivacyOnDisplayRoute()
testAllActiveToolsHavePanels()
testRequiredMigrationToolsPresent()
testCollapsePersistence()
testToolOrderPersistence()
testActiveToolPersistence()
testInactiveActiveToolRejectedOnHydrate()
testInvalidToolIdsSanitizedOnHydrate()
console.log('All teacher command dock tests passed.')
