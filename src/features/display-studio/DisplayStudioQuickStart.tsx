import { useDisplayStudioUI } from './useDisplayStudioUI'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { DEFAULT_DISPLAY_SCREENS } from '../display-composer/defaultScreens'
import type { DisplayScreen } from '../display-composer/types'

/**
 * Quick Start flow definition.
 * Each flow maps to a classroom moment and selects/applies the best template.
 */
interface QuickFlow {
  id: string
  label: string
  emoji: string
  /** Default template ID to clone, or a special action. */
  templateId?: string
  /** Special action key (for non-template flows like blank/restore). */
  action?: 'blank' | 'restore' | 'clear'
  /** Theme to apply (optional). */
  themeId?: string
  /** Optional timer kind to set. */
  timerKind?: string
}

const QUICK_FLOWS: QuickFlow[] = [
  { id: 'start-day', label: 'Start the Day', emoji: '🌅', templateId: 'arrival-720' },
  { id: 'begin-math', label: 'Begin Math', emoji: '🔢', templateId: 'math-launch-15c' },
  { id: 'begin-reading', label: 'Begin Reading', emoji: '📖', templateId: 'reading-launch' },
  { id: 'work-time', label: 'Work Time', emoji: '✏️', templateId: 'work-time' },
  { id: 'quiet-work', label: 'Quiet Work', emoji: '🤫', templateId: 'work-time-15c', timerKind: 'general' },
  { id: 'transition', label: 'Transition', emoji: '🔄', templateId: 'cleanup', timerKind: 'transition' },
  { id: 'lunch', label: 'Lunch', emoji: '🍽️', templateId: 'lunch-15c' },
  { id: 'review-game', label: 'Review Game', emoji: '🎮', templateId: 'review-game-15c' },
  { id: 'mystery-student', label: 'Mystery Star', emoji: '🌟', templateId: 'mystery-student-15c' },
  { id: 'prize-board', label: 'Prize Board', emoji: '🎁', templateId: 'prize-board-screen' },
  { id: 'pack-up', label: 'Pack Up', emoji: '🎒', templateId: 'pack-up' },
  { id: 'end-of-day', label: 'End of Day', emoji: '👋', templateId: 'end-of-day' },
  { id: 'blank', label: 'Blank Display', emoji: '⬛', action: 'blank' },
  { id: 'restore', label: 'Restore Display', emoji: '🖥️', action: 'restore' },
]

/**
 * Phase 15G — Quick Start classroom flows panel.
 * Appears above the canvas or in the command bar area as compact action buttons.
 */
export function DisplayStudioQuickStart() {
  const { quickStartOpen, closeQuickStart, selectScreen } = useDisplayStudioUI()
  const createCustomScreen = useDisplayComposerStore((s) => s.createCustomScreen)
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const blankDisplay = useDisplayComposerStore((s) => s.blankDisplay)
  const unblankDisplay = useDisplayComposerStore((s) => s.unblankDisplay)
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)

  if (!quickStartOpen) return null

  const handleFlow = (flow: QuickFlow) => {
    if (flow.action === 'blank') {
      blankDisplay()
      closeQuickStart()
      return
    }
    if (flow.action === 'restore') {
      unblankDisplay()
      closeQuickStart()
      return
    }
    if (flow.action === 'clear') {
      clearDisplay()
      closeQuickStart()
      return
    }

    // Clone template into a new screen
    const source = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === flow.templateId)
    if (!source) {
      closeQuickStart()
      return
    }

    const newId = createCustomScreen(source.title)
    updateScreen(newId, {
      title: source.title,
      mode: source.mode,
      background: source.background,
      showClock: source.showClock,
      timerWidget: flow.timerKind
        ? { kind: flow.timerKind as DisplayScreen['timerWidget']['kind'], timerId: `qs-${flow.id}` }
        : source.timerWidget,
      studentMessage: source.studentMessage,
      materialsCard: source.materialsCard ? { ...source.materialsCard } : undefined,
      checklistCard: source.checklistCard
        ? { heading: source.checklistCard.heading, items: source.checklistCard.items.map((i) => ({ ...i })) }
        : undefined,
      studentSafe: source.studentSafe,
    })

    if (source.widgets && source.widgets.length > 0) {
      const widgets = source.widgets.map((w) => ({
        ...w,
        id: `${w.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }))
      updateScreen(newId, { widgets } as Partial<DisplayScreen>)
    }

    selectScreen(newId)
    closeQuickStart()
  }

  const isBlanked = displayBlanked

  return (
    <div
      className="shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-2"
      data-display-studio-quick-start
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Start</h3>
        <button
          type="button"
          onClick={closeQuickStart}
          className="ml-auto text-[9px] text-slate-500 hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_FLOWS.map((flow) => {
          const isBlankRestore = flow.action === 'blank' || flow.action === 'restore'
          const showBlankRestore =
            (flow.action === 'blank' && !isBlanked) ||
            (flow.action === 'restore' && isBlanked) ||
            !isBlankRestore

          if (!showBlankRestore) return null

          return (
            <button
              key={flow.id}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
              onClick={() => handleFlow(flow)}
              title={flow.label}
            >
              <span className="text-sm">{flow.emoji}</span>
              <span>{flow.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
