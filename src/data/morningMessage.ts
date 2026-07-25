import type { ClassWorkspace, ScreenId } from './types'

/** Ordered section identifiers for the Morning Message. */
export type MorningMessageSectionId =
  | 'greeting'
  | 'date'
  | 'mainMessage'
  | 'doNow'
  | 'announcements'
  | 'questionOfTheDay'
  | 'reminders'
  | 'celebration'
  | 'schedulePreview'
  | 'materials'
  | 'closing'

export type MorningMessageSectionVisibility = Record<MorningMessageSectionId, boolean>

export interface MorningMessageSectionMeta {
  id: MorningMessageSectionId
  label: string
  heading: string
  kind: 'text' | 'bullets' | 'date'
  placeholder: string
}

export const MORNING_MESSAGE_SECTION_ORDER: MorningMessageSectionId[] = [
  'greeting',
  'date',
  'mainMessage',
  'doNow',
  'announcements',
  'questionOfTheDay',
  'reminders',
  'celebration',
  'schedulePreview',
  'materials',
  'closing',
]

export const MORNING_MESSAGE_SECTION_META: MorningMessageSectionMeta[] = [
  { id: 'greeting', label: 'Greeting', heading: '', kind: 'text', placeholder: 'Good morning, scholars!' },
  { id: 'date', label: 'Date', heading: '', kind: 'date', placeholder: '' },
  { id: 'mainMessage', label: 'Morning Message', heading: 'Morning Message', kind: 'text', placeholder: 'Today we will…' },
  { id: 'doNow', label: 'Do Now', heading: 'Do Now', kind: 'text', placeholder: 'Complete your morning task.' },
  { id: 'announcements', label: 'Announcements', heading: 'Announcements', kind: 'bullets', placeholder: 'Add an announcement' },
  { id: 'questionOfTheDay', label: 'Question of the Day', heading: 'Question of the Day', kind: 'text', placeholder: 'What are you grateful for today?' },
  { id: 'reminders', label: 'Reminders', heading: 'Reminders', kind: 'bullets', placeholder: 'Add a reminder' },
  { id: 'celebration', label: 'Celebration / Birthday', heading: 'Celebrations', kind: 'text', placeholder: 'Happy birthday to…' },
  { id: 'schedulePreview', label: 'Schedule Preview', heading: 'Today\'s Schedule', kind: 'bullets', placeholder: 'Add a schedule item' },
  { id: 'materials', label: 'Materials Needed', heading: 'Materials Needed', kind: 'bullets', placeholder: 'Add a material' },
  { id: 'closing', label: 'Closing Encouragement', heading: '', kind: 'text', placeholder: 'Have a great day!' },
]

export interface MorningMessageContent {
  /** Text sections keyed by section id. */
  text: Partial<Record<MorningMessageSectionId, string>>
  /** Bullet-list sections keyed by section id. */
  bullets: Partial<Record<MorningMessageSectionId, string[]>>
  visibility: MorningMessageSectionVisibility
  /** When true, date section shows today's local date automatically. */
  useAutomaticDate: boolean
  /** ISO date string (YYYY-MM-DD) override when useAutomaticDate is false. */
  dateOverride: string | null
}

export interface MorningMessageTemplate {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  content: MorningMessageContent
}

export interface MorningMessageState {
  current: MorningMessageContent
  templates: MorningMessageTemplate[]
  selectedTemplateId: string | null
  lastUpdated: string | null
}

let morningMessageIdCounter = 0

export function createMorningMessageId(prefix: string): string {
  morningMessageIdCounter += 1
  return `${prefix}-${Date.now()}-${morningMessageIdCounter}`
}

export function defaultMorningMessageVisibility(): MorningMessageSectionVisibility {
  return {
    greeting: true,
    date: true,
    mainMessage: true,
    doNow: false,
    announcements: true,
    questionOfTheDay: false,
    reminders: false,
    celebration: false,
    schedulePreview: false,
    materials: false,
    closing: true,
  }
}

export function createDefaultMorningMessageContent(): MorningMessageContent {
  return {
    text: {
      greeting: 'Good morning!',
      mainMessage: 'Welcome to a new day of learning.',
      closing: 'Let\'s make today count!',
    },
    bullets: {
      announcements: [],
      reminders: [],
      schedulePreview: [],
      materials: [],
    },
    visibility: defaultMorningMessageVisibility(),
    useAutomaticDate: true,
    dateOverride: null,
  }
}

export function createDefaultMorningMessageState(): MorningMessageState {
  return {
    current: createDefaultMorningMessageContent(),
    templates: createSeedMorningMessageTemplates(),
    selectedTemplateId: null,
    lastUpdated: null,
  }
}

function templateContent(
  overrides: {
    text?: Partial<Record<MorningMessageSectionId, string>>
    bullets?: Partial<Record<MorningMessageSectionId, string[]>>
    visibility?: Partial<MorningMessageSectionVisibility>
  },
): MorningMessageContent {
  const base = createDefaultMorningMessageContent()
  return {
    ...base,
    text: { ...base.text, ...overrides.text },
    bullets: { ...base.bullets, ...overrides.bullets },
    visibility: { ...base.visibility, ...overrides.visibility },
  }
}

/** Seed examples — teachers may rename, overwrite, or delete these. */
export function createSeedMorningMessageTemplates(): MorningMessageTemplate[] {
  const now = new Date().toISOString()
  return [
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Standard School Day',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Good morning, scholars!',
          mainMessage: 'Today we will follow our regular schedule and give our best effort.',
          closing: 'Let\'s make today a great day of learning!',
        },
        bullets: {
          announcements: ['Remember to turn in homework', 'Library books due Friday'],
          reminders: ['Raise your hand for help', 'Stay in your seat during instruction'],
        },
        visibility: { ...defaultMorningMessageVisibility(), reminders: true },
      }),
    },
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Monday Reset',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Happy Monday!',
          mainMessage: 'Fresh week, fresh start. Set a goal for yourself today.',
          questionOfTheDay: 'What is one thing you want to accomplish this week?',
          closing: 'You\'ve got this — let\'s go!',
        },
        bullets: {
          announcements: ['Weekly goal check-in today'],
          reminders: ['Organize your desk', 'Check your planner'],
        },
        visibility: { ...defaultMorningMessageVisibility(), questionOfTheDay: true },
      }),
    },
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Assessment Day',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Good morning!',
          mainMessage: 'Today is assessment day. Do your best and show what you know.',
          closing: 'Take your time and read carefully.',
        },
        bullets: {
          announcements: ['Assessment today — listen for directions'],
          reminders: ['Pencils ready', 'No talking during the assessment'],
          materials: ['Pencil', 'Eraser'],
        },
        visibility: {
          ...defaultMorningMessageVisibility(),
          reminders: true,
          materials: true,
        },
      }),
    },
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Field Trip Day',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Good morning, travelers!',
          mainMessage: 'Field trip day! We leave after morning announcements.',
          closing: 'Be respectful and represent our class well!',
        },
        bullets: {
          announcements: ['Field trip today — wear comfortable shoes'],
          reminders: ['Bring lunch or order school lunch', 'Use the restroom before we leave'],
          materials: ['Permission slip', 'Water bottle'],
          schedulePreview: ['Morning message', 'Pack up', 'Board buses at 9:30'],
        },
        visibility: {
          ...defaultMorningMessageVisibility(),
          reminders: true,
          materials: true,
          schedulePreview: true,
        },
      }),
    },
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Friday Celebration',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Happy Friday!',
          mainMessage: 'We made it through the week. Celebrate your hard work!',
          celebration: 'Shout-out to everyone who showed growth this week!',
          questionOfTheDay: 'What was your favorite moment this week?',
          closing: 'Have a wonderful weekend!',
        },
        bullets: {
          announcements: ['Spirit day — wear school colors'],
        },
        visibility: {
          ...defaultMorningMessageVisibility(),
          celebration: true,
          questionOfTheDay: true,
        },
      }),
    },
    {
      id: createMorningMessageId('mmtpl'),
      name: 'Substitute Day',
      createdAt: now,
      updatedAt: now,
      content: templateContent({
        text: {
          greeting: 'Good morning!',
          mainMessage: 'We have a guest teacher today. Show our class expectations.',
          closing: 'Thank you for being helpful and respectful.',
        },
        bullets: {
          announcements: ['Guest teacher today'],
          reminders: ['Follow directions the first time', 'Help the substitute feel welcome'],
          schedulePreview: ['Morning work', 'Math', 'Reading', 'Lunch', 'Pack up'],
        },
        visibility: {
          ...defaultMorningMessageVisibility(),
          reminders: true,
          schedulePreview: true,
        },
      }),
    },
  ]
}

export function normalizeMorningMessageContent(raw: unknown): MorningMessageContent {
  const defaults = createDefaultMorningMessageContent()
  if (!raw || typeof raw !== 'object') return defaults

  const r = raw as Partial<MorningMessageContent>
  const visibility = { ...defaults.visibility }
  if (r.visibility && typeof r.visibility === 'object') {
    for (const id of MORNING_MESSAGE_SECTION_ORDER) {
      if (typeof r.visibility[id] === 'boolean') {
        visibility[id] = r.visibility[id]!
      }
    }
  }

  const text: Partial<Record<MorningMessageSectionId, string>> = { ...defaults.text }
  if (r.text && typeof r.text === 'object') {
    for (const id of MORNING_MESSAGE_SECTION_ORDER) {
      if (typeof r.text[id] === 'string') text[id] = r.text[id]
    }
  }

  const bullets: Partial<Record<MorningMessageSectionId, string[]>> = { ...defaults.bullets }
  if (r.bullets && typeof r.bullets === 'object') {
    for (const id of MORNING_MESSAGE_SECTION_ORDER) {
      if (Array.isArray(r.bullets[id])) {
        bullets[id] = r.bullets[id]!.filter((item) => typeof item === 'string')
      }
    }
  }

  return {
    text,
    bullets,
    visibility,
    useAutomaticDate: typeof r.useAutomaticDate === 'boolean' ? r.useAutomaticDate : defaults.useAutomaticDate,
    dateOverride: typeof r.dateOverride === 'string' ? r.dateOverride : null,
  }
}

export function normalizeMorningMessageState(raw: unknown): MorningMessageState {
  const defaults = createDefaultMorningMessageState()
  if (!raw || typeof raw !== 'object') return defaults

  const r = raw as Partial<MorningMessageState>
  const templates: MorningMessageTemplate[] = []
  if (Array.isArray(r.templates)) {
    for (const t of r.templates) {
      if (!t || typeof t !== 'object') continue
      const tpl = t as Partial<MorningMessageTemplate>
      if (typeof tpl.id !== 'string' || typeof tpl.name !== 'string') continue
      templates.push({
        id: tpl.id,
        name: tpl.name.trim(),
        createdAt: typeof tpl.createdAt === 'string' ? tpl.createdAt : new Date().toISOString(),
        updatedAt: typeof tpl.updatedAt === 'string' ? tpl.updatedAt : new Date().toISOString(),
        content: normalizeMorningMessageContent(tpl.content),
      })
    }
  }

  return {
    current: normalizeMorningMessageContent(r.current),
    templates: templates.length > 0 ? templates : defaults.templates,
    selectedTemplateId: typeof r.selectedTemplateId === 'string' ? r.selectedTemplateId : null,
    lastUpdated: typeof r.lastUpdated === 'string' ? r.lastUpdated : null,
  }
}

export function cloneMorningMessageContent(content: MorningMessageContent): MorningMessageContent {
  return structuredClone(content)
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Format a date as "Saturday, July 25" using local browser time. */
export function formatFriendlyDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export function resolveMorningMessageDate(content: MorningMessageContent, now = new Date()): string {
  if (content.useAutomaticDate) {
    return formatFriendlyDate(now)
  }
  if (content.dateOverride) {
    const parsed = parseLocalDate(content.dateOverride)
    if (parsed) return formatFriendlyDate(parsed)
  }
  return formatFriendlyDate(now)
}

function parseLocalDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const d = new Date(year, month, day)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null
  return d
}

export function sectionHasContent(
  sectionId: MorningMessageSectionId,
  content: MorningMessageContent,
): boolean {
  if (!content.visibility[sectionId]) return false
  if (sectionId === 'date') return true

  const meta = MORNING_MESSAGE_SECTION_META.find((m) => m.id === sectionId)
  if (!meta) return false

  if (meta.kind === 'bullets') {
    const items = content.bullets[sectionId] ?? []
    return items.some((item) => item.trim().length > 0)
  }

  if (meta.kind === 'text') {
    const text = content.text[sectionId] ?? ''
    return text.trim().length > 0
  }

  return false
}

export function enabledMorningMessageSections(
  content: MorningMessageContent,
): MorningMessageSectionId[] {
  return MORNING_MESSAGE_SECTION_ORDER.filter((id) => sectionHasContent(id, content))
}

export function schedulePreviewFromHomeroomPages(
  classWorkspaces: Record<ScreenId, ClassWorkspace | undefined>,
): string[] {
  const ws = classWorkspaces.homeroom
  if (!ws) return []
  return ws.pages.map((page) => page.title)
}

export function isTemplateNameValid(name: string): boolean {
  return name.trim().length > 0
}

export function isDuplicateTemplateName(
  templates: MorningMessageTemplate[],
  name: string,
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase()
  return templates.some(
    (t) => t.id !== excludeId && t.name.trim().toLowerCase() === normalized,
  )
}
