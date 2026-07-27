function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { getToolCapability, toolSupportsWorkspace } from '../teacher-dock/toolCapabilities'
import {
  TEACHING_WORKSPACE_REGISTRY,
  getWorkspaceById,
  isValidWorkspaceId,
} from './workspaceRegistry'
import {
  DEFAULT_WORKSPACE_STATE,
  hydrateWorkspaceState,
  parsePersistedWorkspaceState,
  serializeWorkspaceState,
} from './workspacePersistence'
import {
  getActiveWorkspaceTools,
  getPromotedWorkspaceTools,
  getWorkspaceAwareLauncherTools,
  getToolPriorityInWorkspace,
} from './workspaceResolver'
import { getDefaultDockOrder, getToolById, isToolLaunchable } from '../teacher-dock/toolRegistry'

function testMathWorkspaceLoadsCorrectTools() {
  const math = getWorkspaceById('math')
  assert(Boolean(math), 'math workspace exists')
  assert(math!.activeToolIds.includes('omninote'), 'math includes omninote')
  assert(math!.activeToolIds.includes('timers'), 'math includes timers')
  assert(math!.activeToolIds.includes('materials'), 'math includes materials')
  assert(math!.activeToolIds.includes('display'), 'math includes display')

  const active = getActiveWorkspaceTools('math')
  assert(active.some((tool) => tool.id === 'omninote'), 'active math tools include omninote')
  const promoted = getPromotedWorkspaceTools('math')
  assert(promoted[0]?.id === 'omninote', 'omninote promoted first in math mode')
  assert(promoted[1]?.id === 'materials', 'materials promoted second in math mode')
  assert(promoted[2]?.id === 'timers', 'timers promoted third in math mode')
  assert(promoted[3]?.id === 'display', 'display promoted fourth in math mode')
  console.log('  math workspace loads correct tools OK')
}

function testRewardWorkspaceLoadsPrizeBoard() {
  const reward = getWorkspaceById('reward')
  assert(Boolean(reward), 'reward workspace exists')
  assert(reward!.activeToolIds.includes('prize-board'), 'reward includes prize board')
  const active = getActiveWorkspaceTools('reward')
  assert(active.some((tool) => tool.id === 'prize-board'), 'prize board active in reward')
  console.log('  reward workspace loads prize board OK')
}

function testMorningWorkspaceLoadsScheduleTools() {
  const morning = getWorkspaceById('morning')
  assert(Boolean(morning), 'morning workspace exists')
  assert(morning!.activeToolIds.includes('dashboard'), 'morning includes dashboard')
  assert(morning!.activeToolIds.includes('morning-message'), 'morning includes message')
  assert(morning!.activeToolIds.includes('classroom-atmosphere'), 'morning includes atmosphere')
  assert(morning!.activeToolIds.includes('timers'), 'morning includes timers')
  console.log('  morning workspace loads schedule tools OK')
}

function testWorkspaceAwareOrdering() {
  const order = getDefaultDockOrder()
  const mathTools = getWorkspaceAwareLauncherTools(order, [], 'math')
  const firstFour = mathTools.slice(0, 4).map((tool) => tool.id)
  assert(firstFour.includes('omninote'), 'omninote near top in math mode')
  assert(firstFour.includes('timers'), 'timers near top in math mode')
  assert(mathTools.length >= order.length - 1, 'all launchable tools still accessible')

  const deprioritizedIndex = mathTools.findIndex((tool) => tool.id === 'jobs')
  const promotedIndex = mathTools.findIndex((tool) => tool.id === 'omninote')
  assert(promotedIndex < deprioritizedIndex, 'promoted tools sort before deprioritized')
  console.log('  workspace aware ordering OK')
}

function testDeprioritizedToolsRemainAccessible() {
  const math = getWorkspaceById('math')!
  const priority = getToolPriorityInWorkspace('jobs', math)
  assert(priority === 'deprioritized', 'jobs deprioritized in math mode')
  const allTools = getWorkspaceAwareLauncherTools(getDefaultDockOrder(), [], 'math')
  assert(allTools.some((tool) => tool.id === 'jobs'), 'jobs still in launcher')
  console.log('  deprioritized tools remain accessible OK')
}

function testWorkspacePersistence() {
  const saved = hydrateWorkspaceState({
    activeWorkspaceId: 'math',
    favoriteWorkspaceId: 'reward',
    lastActiveWorkspaceId: 'math',
  })
  assert(saved.activeWorkspaceId === 'math', 'active workspace math')
  assert(saved.favoriteWorkspaceId === 'reward', 'favorite workspace reward')
  const invalid = hydrateWorkspaceState({
    activeWorkspaceId: 'invalid',
    favoriteWorkspaceId: 'bogus',
  })
  assert(isValidWorkspaceId(invalid.activeWorkspaceId), 'invalid workspace falls back safely')
  assert(invalid.favoriteWorkspaceId === null, 'invalid favorite cleared')
  const reloaded = parsePersistedWorkspaceState(serializeWorkspaceState(saved))
  assert(reloaded.activeWorkspaceId === 'math', 'workspace round-trip')
  assert(DEFAULT_WORKSPACE_STATE.activeWorkspaceId === 'morning', 'default is morning')
  console.log('  workspace persistence OK')
}

function testToolCapabilityModeSupport() {
  assert(toolSupportsWorkspace('omninote', 'math'), 'omninote supports math')
  assert(toolSupportsWorkspace('prize-board', 'reward'), 'prize board supports reward')
  assert(!toolSupportsWorkspace('prize-board', 'math'), 'prize board not in math')
  const omninote = getToolCapability('omninote')
  assert(omninote.requiredDeviceRole === 'omninote-controller', 'omninote device role')
  assert(omninote.displayTarget === 'student-display', 'omninote display target')
  console.log('  tool capability mode support OK')
}

function testReadingWorkspaceLoadsCorrectTools() {
  const reading = getWorkspaceById('reading')
  assert(Boolean(reading), 'reading workspace exists')
  const expected = ['materials', 'omninote', 'classroom-atmosphere', 'mystery-star']
  assert(
    JSON.stringify(reading!.promotedToolIds) === JSON.stringify(expected),
    'reading promoted tools order',
  )
  console.log('  reading workspace loads correct tools OK')
}

function testWorkspacePromotedOrderDeterministic() {
  for (const workspace of TEACHING_WORKSPACE_REGISTRY) {
    const promoted = getPromotedWorkspaceTools(workspace.id)
    const expectedIds = workspace.promotedToolIds.filter((id) => {
      const tool = getToolById(id)
      return Boolean(tool && isToolLaunchable(tool.status))
    })
    const actualIds = promoted.map((tool) => tool.id)
    assert(
      JSON.stringify(actualIds) === JSON.stringify(expectedIds),
      `${workspace.id} promoted order matches registry`,
    )
  }
  console.log('  workspace promoted order deterministic OK')
}

function testAllWorkspacesRegistered() {
  assert(TEACHING_WORKSPACE_REGISTRY.length === 6, 'six teaching workspaces')
  for (const workspace of TEACHING_WORKSPACE_REGISTRY) {
    assert(Boolean(workspace.name), `${workspace.id} has name`)
    assert(workspace.activeToolIds.length > 0, `${workspace.id} has active tools`)
  }
  console.log('  all workspaces registered OK')
}

function testShurleyWorkspaceLoadsCorrectTools() {
  const shurley = getWorkspaceById('shurley')
  assert(Boolean(shurley), 'shurley workspace exists')
  assert(
    JSON.stringify(shurley!.promotedToolIds) ===
      JSON.stringify(['omninote', 'materials', 'display', 'timers']),
    'shurley promoted tools order',
  )
  const promoted = getPromotedWorkspaceTools('shurley')
  assert(promoted[0]?.id === 'omninote', 'omninote promoted first in shurley')
  assert(promoted.some((tool) => tool.id === 'timers'), 'timers promoted in shurley')
  console.log('  shurley workspace loads correct tools OK')
}

console.log('Workspace intelligence tests')
testMathWorkspaceLoadsCorrectTools()
testRewardWorkspaceLoadsPrizeBoard()
testMorningWorkspaceLoadsScheduleTools()
testReadingWorkspaceLoadsCorrectTools()
testWorkspaceAwareOrdering()
testDeprioritizedToolsRemainAccessible()
testWorkspacePersistence()
testToolCapabilityModeSupport()
testWorkspacePromotedOrderDeterministic()
testAllWorkspacesRegistered()
testShurleyWorkspaceLoadsCorrectTools()
console.log('All workspace intelligence tests passed.')
