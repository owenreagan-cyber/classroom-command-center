import type { ClassWorkspace, ScreenId, VibePage, VibePageId, PageLayoutPreset, PageWidget, BackgroundAssetId } from './types'
import { seedWidgetsForPage } from '../lib/studioLayoutSeeds'

// ── Page Sequences ─────────────────────────────────────────────────────

export interface PageSequenceDefinition {
  classId: ScreenId
  title: string
  pages: VibePageDefinition[]
}

export interface VibePageDefinition {
  id: VibePageId
  title: string
  subtitle?: string
  backgroundId: BackgroundAssetId
  primaryMessage: string
  supportingContent?: string[]
  layoutPreset: PageLayoutPreset
  widgetTypes?: string[]
  routinePhaseIds?: string[]
}

function buildPage(
  def: VibePageDefinition,
  index: number,
  pages: VibePageDefinition[],
): VibePage {
  const widgets: PageWidget[] = seedWidgetsForPage(def.id, def.layoutPreset, def.widgetTypes ?? [])
  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle,
    backgroundId: def.backgroundId,
    primaryMessage: def.primaryMessage,
    supportingContent: def.supportingContent,
    widgetIds: widgets.map(w => w.id),
    layoutPreset: def.layoutPreset,
    widgets,
    previousPageId: index > 0 ? pages[index - 1].id : null,
    nextPageId: index < pages.length - 1 ? pages[index + 1].id : null,
    routinePhaseIds: def.routinePhaseIds ?? [],
    visibleInStudio: true,
    visibleInClassroom: true,
  }
}

function buildClassWorkspace(def: PageSequenceDefinition): ClassWorkspace {
  const pages = def.pages.map((p, i) => buildPage(p, i, def.pages))
  const activePageId = pages.length > 0 ? pages[0].id : null

  return {
    classId: def.classId,
    title: def.title,
    pages,
    activePageId,
    previousPageId: null,
    nextPageId: pages.length > 1 ? pages[1].id : null,
  }
}

// ── Sequence Definitions ───────────────────────────────────────────────

const HOMEROOM_SEQUENCE: PageSequenceDefinition = {
  classId: 'homeroom',
  title: 'Homeroom',
  pages: [
    {
      id: 'homeroom-morning-arrival',
      title: 'Morning Arrival',
      subtitle: 'Start your day',
      backgroundId: 'homeroom-morning-briefing',
      primaryMessage: 'Unpack, turn in homework, begin silently',
      supportingContent: ['Hang up backpack', 'Put away jacket', 'Turn in homework'],
      layoutPreset: 'full-focus',
      widgetTypes: ['do-now'],
      routinePhaseIds: ['silent-work'],
    },
    {
      id: 'homeroom-silent-work',
      title: 'Silent Work',
      subtitle: 'Independent morning work',
      backgroundId: 'homeroom-morning-briefing',
      primaryMessage: 'Complete your morning work silently',
      supportingContent: ['Work independently', 'Stay in your seat', 'Raise hand for help'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['timer', 'materials'],
      routinePhaseIds: ['silent-work'],
    },
    {
      id: 'homeroom-clean-up-math',
      title: 'Clean Up for Math',
      subtitle: 'Prepare for math',
      backgroundId: 'homeroom-morning-briefing',
      primaryMessage: 'Clean up and get ready for Math',
      supportingContent: ['Put away morning work', 'Get math materials', 'Clear desk'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials', 'ready'],
      routinePhaseIds: ['clean-up'],
    },
    {
      id: 'homeroom-morning-message',
      title: 'Morning Message',
      subtitle: 'Daily announcements',
      backgroundId: 'homeroom-morning-briefing',
      primaryMessage: 'Good morning! Here is today\'s message.',
      supportingContent: ['Announcements', 'Birthdays', 'Special events'],
      layoutPreset: 'centered-message',
      widgetTypes: ['morning-message'],
      routinePhaseIds: [],
    },
    {
      id: 'homeroom-announcements',
      title: 'Announcements',
      subtitle: 'Important information',
      backgroundId: 'homeroom-morning-briefing',
      primaryMessage: 'Today\'s schedule and announcements',
      supportingContent: ['Morning broadcast', 'Lunch menu', 'After-school plans'],
      layoutPreset: 'centered-message',
      widgetTypes: ['reminders'],
      routinePhaseIds: [],
    },
  ],
}

const MATH_SEQUENCE: PageSequenceDefinition = {
  classId: 'math',
  title: 'Math',
  pages: [
    {
      id: 'math-get-ready',
      title: 'Get Ready',
      subtitle: 'Prepare for math',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Get your materials ready and begin the warm-up',
      supportingContent: ['Power Up Packet', 'Pen', 'Pencil', 'Homework'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials', 'timer'],
      routinePhaseIds: [],
    },
    {
      id: 'math-warm-up',
      title: 'Warm-Up',
      subtitle: 'Power Up',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Complete the Power Up',
      supportingContent: ['Work quickly', 'Check your answers', 'Ask for help if stuck'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'math-lesson',
      title: 'Lesson',
      subtitle: 'New learning',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Today\'s math lesson',
      supportingContent: ['Listen carefully', 'Take notes', 'Ask questions'],
      layoutPreset: 'split-content',
      widgetTypes: ['lesson', 'lesson-card'],
      routinePhaseIds: [],
    },
    {
      id: 'math-guided-practice',
      title: 'Guided Practice',
      subtitle: 'Practice together',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Work through problems together',
      supportingContent: ['Follow along', 'Show your work', 'Check with a partner'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'math-independent-work',
      title: 'Independent Work',
      subtitle: 'Work on your own',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Complete your independent work',
      supportingContent: ['Work silently', 'Raise hand for questions', 'Check your work'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'math-wrap-up',
      title: 'Wrap Up',
      subtitle: 'Clean up and review',
      backgroundId: 'math-training-lab',
      primaryMessage: 'Clean up and review what we learned',
      supportingContent: ['Put materials away', 'Review key ideas', 'Ready Position'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials', 'ready'],
      routinePhaseIds: [],
    },
  ],
}

const READING_SEQUENCE: PageSequenceDefinition = {
  classId: 'reading',
  title: 'Reading',
  pages: [
    {
      id: 'reading-get-ready',
      title: 'Get Ready',
      subtitle: 'Prepare for reading',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Get your reading materials ready',
      supportingContent: ['Homework', 'Pen', 'Pencil', 'Reading book'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials', 'ready'],
      routinePhaseIds: [],
    },
    {
      id: 'reading-focus',
      title: 'Reading Focus',
      subtitle: 'Today\'s skill',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Today\'s reading focus',
      supportingContent: ['Follow along', 'Find text evidence', 'Be ready to share'],
      layoutPreset: 'split-content',
      widgetTypes: ['lesson', 'vocabulary-card'],
      routinePhaseIds: [],
    },
    {
      id: 'reading-random-reader',
      title: 'Random Reader',
      subtitle: 'Placeholder',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Random Reader coming soon',
      supportingContent: ['This feature is not yet implemented'],
      layoutPreset: 'centered-message',
      widgetTypes: [],
      routinePhaseIds: [],
    },
    {
      id: 'reading-independent',
      title: 'Independent Reading',
      subtitle: 'Read on your own',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Read silently and independently',
      supportingContent: ['Choose a book', 'Read quietly', 'Be ready to discuss'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'reading-response-prompt',
      title: 'Response Prompt',
      subtitle: 'Show your understanding',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Respond to the reading prompt',
      supportingContent: ['Write in your journal', 'Use text evidence', 'Check your work'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'reading-wrap-up',
      title: 'Wrap Up',
      subtitle: 'Clean up and review',
      backgroundId: 'reading-sky-book-world',
      primaryMessage: 'Clean up and review what we read',
      supportingContent: ['Put materials away', 'Share one thing you learned', 'Ready Position'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials', 'ready'],
      routinePhaseIds: [],
    },
  ],
}

const SNACK_SEQUENCE: PageSequenceDefinition = {
  classId: 'snack',
  title: 'Snack',
  pages: [
    {
      id: 'snack-quiet-snack',
      title: 'Quiet Snack',
      subtitle: 'Eat quietly',
      backgroundId: 'snack-flow-control',
      primaryMessage: 'Eat your snack quietly at your seat',
      supportingContent: ['Stay seated', 'Use quiet voices', 'Keep area tidy'],
      layoutPreset: 'centered-message',
      routinePhaseIds: ['quiet-snack'],
    },
    {
      id: 'snack-silent-clean-up',
      title: 'Silent Clean Up',
      subtitle: 'Clean up silently',
      backgroundId: 'snack-flow-control',
      primaryMessage: 'Clean up silently',
      supportingContent: ['Throw away trash', 'Push in chairs', 'Pack up quietly'],
      layoutPreset: 'cleanup-checklist',
      routinePhaseIds: ['silent-clean-up'],
    },
  ],
}

const LUNCH_SEQUENCE: PageSequenceDefinition = {
  classId: 'lunch',
  title: 'Lunch',
  pages: [
    {
      id: 'lunch-quiet-lunch-a',
      title: 'Quiet Lunch',
      subtitle: 'Eat quietly',
      backgroundId: 'lunch-flow-control',
      primaryMessage: 'Eat your lunch quietly at your table',
      supportingContent: ['Stay seated', 'Use quiet voices', 'Keep area tidy'],
      layoutPreset: 'centered-message',
      routinePhaseIds: ['quiet-lunch-a'],
    },
    {
      id: 'lunch-silent-chew',
      title: 'Silent Chew',
      subtitle: 'No talking while eating',
      backgroundId: 'lunch-flow-control',
      primaryMessage: 'Chew with no talking',
      supportingContent: ['Stay calm', 'Focus on eating', 'No talking'],
      layoutPreset: 'centered-message',
      routinePhaseIds: ['silent-chew'],
    },
    {
      id: 'lunch-quiet-lunch-b',
      title: 'Quiet Lunch',
      subtitle: 'Finish eating',
      backgroundId: 'lunch-flow-control',
      primaryMessage: 'Finish eating with quiet voices',
      supportingContent: ['Finish your lunch', 'Stay calm at the table', 'Get ready to clean up'],
      layoutPreset: 'centered-message',
      routinePhaseIds: ['quiet-lunch-b'],
    },
    {
      id: 'lunch-silent-clean-up',
      title: 'Silent Clean Up',
      subtitle: 'Clean up silently',
      backgroundId: 'lunch-flow-control',
      primaryMessage: 'Clean up silently',
      supportingContent: ['Throw away trash', 'Push in chairs', 'Line up quietly'],
      layoutPreset: 'cleanup-checklist',
      routinePhaseIds: ['silent-clean-up-lunch'],
    },
  ],
}

const HOMEWORK_SEQUENCE: PageSequenceDefinition = {
  classId: 'homework',
  title: 'Homework',
  pages: [
    {
      id: 'homework-copy-homework',
      title: 'Copy Homework',
      subtitle: 'Write down assignments',
      backgroundId: 'homework-station',
      primaryMessage: 'Copy all homework assignments into your planner',
      supportingContent: ['Write neatly', 'Check for due dates', 'Check your folders', 'Ask if unsure'],
      layoutPreset: 'centered-message',
      widgetTypes: ['focus'],
    },
    {
      id: 'homework-check-planner',
      title: 'Check Planner',
      subtitle: 'Verify everything',
      backgroundId: 'homework-station',
      primaryMessage: 'Check your planner for completeness',
      supportingContent: ['Verify all subjects', 'Check due dates', 'Get parent signature if needed'],
      layoutPreset: 'centered-message',
      widgetTypes: ['focus'],
    },
    {
      id: 'homework-pack-materials',
      title: 'Pack Materials',
      subtitle: 'Pack your bag',
      backgroundId: 'homework-station',
      primaryMessage: 'Pack all necessary materials',
      supportingContent: ['Homework folder', 'Books', 'Signed forms'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials', 'focus'],
    },
  ],
}

const PACK_UP_SEQUENCE: PageSequenceDefinition = {
  classId: 'pack-up',
  title: 'Pack Up',
  pages: [
    {
      id: 'pack-up-pack-up',
      title: 'Pack Up',
      subtitle: 'End of day',
      backgroundId: 'pack-up-station',
      primaryMessage: 'Pack your backpack and clean your area',
      supportingContent: ['Pack all materials', 'Clean desk area', 'Throw away trash', 'Organize folders'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials', 'focus'],
    },
    {
      id: 'pack-up-ready-position',
      title: 'Ready Position',
      subtitle: 'Wait for dismissal',
      backgroundId: 'ready-position-expectations',
      primaryMessage: 'Ready Position: seated, silent, ready',
      supportingContent: ['Seated', 'Silent', 'Sitting up', 'Hands on desk', 'Alert'],
      layoutPreset: 'full-focus',
      widgetTypes: ['ready'],
    },
    {
      id: 'pack-up-dismissal',
      title: 'Dismissal',
      subtitle: 'End of day',
      backgroundId: 'pack-up-station',
      primaryMessage: 'Wait quietly for dismissal directions',
      supportingContent: ['Stay seated', 'Listen for your name', 'Walk calmly'],
      layoutPreset: 'centered-message',
      widgetTypes: [],
    },
  ],
}

const HISTORY_SCIENCE_SEQUENCE: PageSequenceDefinition = {
  classId: 'science',
  title: 'History / Science',
  pages: [
    {
      id: 'history-science-get-ready',
      title: 'Get Ready',
      subtitle: 'Prepare for class',
      backgroundId: 'science-lab',
      primaryMessage: 'Get your materials ready',
      supportingContent: ['Science notebook', 'Pencil', 'Lab sheet / handout'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials'],
      routinePhaseIds: [],
    },
    {
      id: 'history-science-lesson-focus',
      title: 'Lesson Focus',
      subtitle: 'Today\'s topic',
      backgroundId: 'science-lab',
      primaryMessage: 'Today\'s focus',
      supportingContent: ['Listen carefully', 'Take notes', 'Ask questions'],
      layoutPreset: 'split-content',
      widgetTypes: ['focus', 'vocabulary-card'],
      routinePhaseIds: [],
    },
    {
      id: 'history-science-activity',
      title: 'Activity',
      subtitle: 'Hands-on learning',
      backgroundId: 'science-lab',
      primaryMessage: 'Complete today\'s activity',
      supportingContent: ['Follow instructions', 'Work with your group', 'Record observations'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'history-science-wrap-up',
      title: 'Wrap Up',
      subtitle: 'Review and clean up',
      backgroundId: 'science-lab',
      primaryMessage: 'Clean up and review what we learned',
      supportingContent: ['Put materials away', 'Share findings', 'Ready Position'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials'],
      routinePhaseIds: [],
    },
  ],
}

const SPELLING_SEQUENCE: PageSequenceDefinition = {
  classId: 'spelling',
  title: 'Spelling',
  pages: [
    {
      id: 'spelling-get-ready',
      title: 'Get Ready',
      subtitle: 'Prepare for spelling',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Get your spelling materials ready',
      supportingContent: ['Spelling notebook', 'Pencil', 'Spelling list'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials'],
      routinePhaseIds: [],
    },
    {
      id: 'spelling-focus',
      title: 'Spelling Focus',
      subtitle: 'Today\'s words',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Today\'s spelling focus',
      supportingContent: ['Review word list', 'Practice spelling', 'Write sentences'],
      layoutPreset: 'split-content',
      widgetTypes: ['focus', 'vocabulary-card'],
      routinePhaseIds: [],
    },
    {
      id: 'spelling-practice',
      title: 'Practice',
      subtitle: 'Independent practice',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Practice your spelling words',
      supportingContent: ['Write each word', 'Use in a sentence', 'Check your work'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
  ],
}

const SHURLEY_WRITING_SEQUENCE: PageSequenceDefinition = {
  classId: 'writing',
  title: 'Shurley / Writing',
  pages: [
    {
      id: 'shurley-get-ready',
      title: 'Get Ready',
      subtitle: 'Prepare for writing',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Get your writing materials ready',
      supportingContent: ['Writing notebook', 'Pencil', 'Draft folder'],
      layoutPreset: 'message-plus-materials',
      widgetTypes: ['materials'],
      routinePhaseIds: [],
    },
    {
      id: 'shurley-writing-focus',
      title: 'Writing Focus',
      subtitle: 'Today\'s skill',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Today\'s writing focus',
      supportingContent: ['Listen to the lesson', 'Follow along', 'Take notes'],
      layoutPreset: 'split-content',
      widgetTypes: ['focus', 'lesson-card'],
      routinePhaseIds: [],
    },
    {
      id: 'shurley-independent-work',
      title: 'Independent Work',
      subtitle: 'Write on your own',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Write independently',
      supportingContent: ['Apply the skill', 'Use your notes', 'Check your writing'],
      layoutPreset: 'centered-message',
      widgetTypes: ['timer'],
      routinePhaseIds: [],
    },
    {
      id: 'shurley-wrap-up',
      title: 'Wrap Up',
      subtitle: 'Review and share',
      backgroundId: 'writing-workshop',
      primaryMessage: 'Clean up and share your writing',
      supportingContent: ['Put materials away', 'Share with a partner', 'Ready Position'],
      layoutPreset: 'cleanup-checklist',
      widgetTypes: ['materials'],
      routinePhaseIds: [],
    },
  ],
}

// Single-page sequences for classes without full page sequences yet
const DEFAULT_SINGLE_PAGE_SEQUENCES: PageSequenceDefinition[] = [
  { classId: 'social-studies', title: 'Social Studies', pages: [{ id: 'social-studies-focus', title: 'Lesson Focus', subtitle: undefined, backgroundId: 'social-studies-map', primaryMessage: 'Today\'s social studies focus', supportingContent: ['Analyze sources', 'Participate in discussion'], layoutPreset: 'split-content', widgetTypes: ['focus', 'vocabulary-card'], routinePhaseIds: [] }] },
  { classId: 'assessment', title: 'Assessment', pages: [{ id: 'assessment-default', title: 'Assessment Mode', subtitle: undefined, backgroundId: 'assessment-mode', primaryMessage: 'Clear your desk and wait silently', supportingContent: ['Work independently', 'No talking', 'Raise hand when done'], layoutPreset: 'full-focus', widgetTypes: ['focus'], routinePhaseIds: [] }] },
  { classId: 'centers', title: 'Group Work', pages: [{ id: 'centers-default', title: 'Group Work', subtitle: undefined, backgroundId: 'centers-rotations', primaryMessage: 'Go to your assigned center', supportingContent: ['Work quietly', 'Stay on task', 'Clean up when called'], layoutPreset: 'centered-message', widgetTypes: ['focus', 'timer'], routinePhaseIds: [] }] },
  { classId: 'recess', title: 'Recess', pages: [{ id: 'recess-play', title: 'Recess', subtitle: undefined, backgroundId: 'recess-play', primaryMessage: 'Play safely and line up quickly', supportingContent: ['Keep hands/feet to yourself', 'Listen for the signal', 'Return ready to learn'], layoutPreset: 'centered-message', widgetTypes: ['ready'], routinePhaseIds: [] }] },
  { classId: 'ready-position', title: 'Ready Position', pages: [{ id: 'ready-position-default', title: 'Ready Position', subtitle: undefined, backgroundId: 'ready-position-expectations', primaryMessage: 'Ready Position expectations', supportingContent: ['Seated', 'Silent', 'Sitting up', 'Hands on desk', 'Alert', 'Eyes on me', 'Ready to learn'], layoutPreset: 'full-focus', widgetTypes: ['ready', 'compact-cue'], routinePhaseIds: [] }] },
]

// ── All Sequences ──────────────────────────────────────────────────────

export const ALL_PAGE_SEQUENCES: PageSequenceDefinition[] = [
  HOMEROOM_SEQUENCE,
  MATH_SEQUENCE,
  READING_SEQUENCE,
  SNACK_SEQUENCE,
  LUNCH_SEQUENCE,
  HOMEWORK_SEQUENCE,
  PACK_UP_SEQUENCE,
  HISTORY_SCIENCE_SEQUENCE,
  SPELLING_SEQUENCE,
  SHURLEY_WRITING_SEQUENCE,
  ...DEFAULT_SINGLE_PAGE_SEQUENCES,
]

// ── Built Workspaces ───────────────────────────────────────────────────

export function buildClassWorkspaces(): Record<ScreenId, ClassWorkspace | undefined> {
  const workspaces: Record<string, ClassWorkspace | undefined> = {}
  for (const def of ALL_PAGE_SEQUENCES) {
    workspaces[def.classId] = buildClassWorkspace(def)
  }
  // Add spelling (currently only in sequences, not in workspace record yet)
  // spelling is already handled above
  return workspaces as Record<ScreenId, ClassWorkspace | undefined>
}

export function getWorkspaceForClass(classId: ScreenId): ClassWorkspace | undefined {
  return buildClassWorkspaces()[classId]
}

export function getPageForId(pageId: VibePageId, workspaces: Record<string, ClassWorkspace | undefined>): VibePage | undefined {
  for (const ws of Object.values(workspaces)) {
    if (!ws) continue
    const page = ws.pages.find(p => p.id === pageId)
    if (page) return page
  }
  return undefined
}

// ── Phase-to-Page Mappings ─────────────────────────────────────────────

export const PHASE_TO_PAGE_MAP: Record<string, { screenId: ScreenId; pageId: VibePageId | null }> = {
  'silent-work': { screenId: 'homeroom', pageId: 'homeroom-silent-work' },
  'clean-up': { screenId: 'homeroom', pageId: 'homeroom-clean-up-math' },
  'quiet-snack': { screenId: 'snack', pageId: 'snack-quiet-snack' },
  'silent-clean-up': { screenId: 'snack', pageId: 'snack-silent-clean-up' },
  'quiet-lunch-a': { screenId: 'lunch', pageId: 'lunch-quiet-lunch-a' },
  'silent-chew': { screenId: 'lunch', pageId: 'lunch-silent-chew' },
  'quiet-lunch-b': { screenId: 'lunch', pageId: 'lunch-quiet-lunch-b' },
  'silent-clean-up-lunch': { screenId: 'lunch', pageId: 'lunch-silent-clean-up' },
}

export const BLOCK_TO_PAGE_SUGGESTION: Record<string, { screenId: ScreenId; pageId: VibePageId }> = {
  'carpool-homeroom': { screenId: 'homeroom', pageId: 'homeroom-morning-arrival' },
  'math': { screenId: 'math', pageId: 'math-get-ready' },
  'snack': { screenId: 'snack', pageId: 'snack-quiet-snack' },
  'lunch': { screenId: 'lunch', pageId: 'lunch-quiet-lunch-a' },
  'reading': { screenId: 'reading', pageId: 'reading-get-ready' },
  'history-science': { screenId: 'science', pageId: 'history-science-get-ready' },
  'writing': { screenId: 'writing', pageId: 'shurley-get-ready' },
  'spelling': { screenId: 'spelling', pageId: 'spelling-get-ready' },
  'pack-up': { screenId: 'pack-up', pageId: 'pack-up-pack-up' },
  'recess': { screenId: 'recess', pageId: 'recess-play' },
}
