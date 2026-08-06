import { useState } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import { DEFAULT_DISPLAY_SCREENS } from '../display-composer/defaultScreens'
import { resolveDisplayBackground } from '../display-composer/backgroundStyles'
import { computeReadabilityWarnings } from '../display-composer/readabilityChecks'
import { countScreensByPack } from '../display-composer/screenPacks'
import type { DisplayScreen } from '../display-composer/types'

import { TEMPLATE_CATEGORIES } from './templateCategories'

// Map each default template to categories and brief descriptions
interface TemplateCardMeta {
  id: string
  title: string
  category: string
  description: string
  mode: string
  widgetCount: number
  backgroundToken: string
  backgroundType: string
  studentSafe: boolean
  hasTimer: boolean
  hasStudentMessage: boolean
}

function buildTemplateMeta(): TemplateCardMeta[] {
  return DEFAULT_DISPLAY_SCREENS.map((s) => {
    const category: string =
      s.mode === 'arrival' || s.mode === 'lunch' || s.mode === 'packUp' ? 'daily' :
      s.mode === 'transition' ? 'daily' :
      s.mode === 'lessonLaunch' ? 'instruction' :
      s.mode === 'workTime' ? 'management' :
      s.mode === 'specials' ? 'management' :
      s.mode === 'custom' && (s.title.includes('Mystery') || s.title.includes('Prize') || s.title.includes('Press')) ? 'engagement' :
      'daily'

    const descriptions: Record<string, string> = {
      '7:20 Arrival': 'Morning arrival with checklists and directions',
      'Morning Work → Math': 'Transition from morning work to math',
      'Math → Snack and Shurley': 'Transition to snack and grammar',
      'Shurley → Movement and Spelling/Reading': 'Movement break and subject switch',
      'Movement → Spelling/Reading': 'Return to seats for spelling and reading',
      'Spelling/Reading → Lunch': 'Lunch time checklist and routine',
      'Specials': 'Art, music, and PE schedule',
      'Lesson Launch': 'Set the stage for a new lesson',
      'Work Time': 'Independent work with visual cues and voice level',
      'Partner Talk': 'Collaborative partner discussion',
      'Cleanup': 'End-of-activity cleanup routine',
      'Pack Up': 'End-of-day pack up checklist',
      'End of Day': 'Wrap up and celebrate learning',
      'Game Review / Review Game': 'Fun games to review learning',
      'Prize Board': 'Celebrate achievements and award prizes',
      'Math Launch': 'Ready for math with timer and materials',
      'Quiet Work': 'Silent independent work with timer',
      'Mystery Student': 'Anonymous accountability — who is the Star?',
      'Lunch Routine': 'Structured lunch transition',
      'Reading Launch': 'Reading time with directions and timer',
      'Writing Workshop': 'Guided writing with prompts',
      'Shurley / Grammar': 'Grammar classification and sentence work',
      'Science Launch': 'Science investigation and exploration',
      'History / Social Studies': 'History inquiry and essential questions',
      'Spelling / Word Work': 'Spelling practice and word activities',
      'Independent Practice': 'Practice with timer and independent expectations',
      'Small Groups': 'Group work with voice level expectations',
      'Test / Assessment': 'Assessment mode with instructions and silent work',
    }

    return {
      id: s.id,
      title: s.title,
      category,
      description: descriptions[s.title] ?? 'Classroom-ready slide template',
      mode: s.mode,
      widgetCount: s.widgets?.length ?? 0,
      backgroundToken: s.background.token,
      backgroundType: s.background.type,
      studentSafe: s.studentSafe,
      hasTimer: s.timerWidget?.kind !== 'none',
      hasStudentMessage: Boolean(s.studentMessage),
    }
  })
}

const ALL_TEMPLATES = buildTemplateMeta()

// ── Component ──

export function DisplayStudioTemplatePicker() {
  const { templatePickerOpen, closeTemplatePicker, selectScreen } = useDisplayStudioUI()
  const createCustomScreen = useDisplayComposerStore((s) => s.createCustomScreen)
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const [activeCategory, setActiveCategory] = useState('daily')
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)

  if (!templatePickerOpen) return null

  const filtered = ALL_TEMPLATES.filter((t) => t.category === activeCategory)
  const allScreens = order.map((id) => screens[id]).filter(Boolean)
  const packCounts = countScreensByPack(allScreens)

  const handleUseTemplate = (templateId: string) => {
    const source = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === templateId)
    if (!source) return
    // Clone the template into a new screen
    const newId = createCustomScreen(source.title)
    // Copy template properties into the new screen (but not the original id)
    updateScreen(newId, {
      title: source.title + (screens[newId]?.id !== source.id ? '' : ''),
      mode: source.mode,
      background: source.background,
      showClock: source.showClock,
      timerWidget: source.timerWidget,
      studentMessage: source.studentMessage,
      materialsCard: source.materialsCard ? { ...source.materialsCard } : undefined,
      checklistCard: source.checklistCard ? {
        heading: source.checklistCard.heading,
        items: source.checklistCard.items.map((i) => ({ ...i })),
      } : undefined,
      studentSafe: source.studentSafe,
    })
    // Copy widgets
    if (source.widgets && source.widgets.length > 0) {
      const widgets = source.widgets.map((w) => ({ ...w, id: `${w.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))
      updateScreen(newId, { widgets } as Partial<DisplayScreen>)
    }
    selectScreen(newId)
    setAppliedTemplate(templateId)
    setTimeout(() => setAppliedTemplate(null), 2000)
  }

  const colorMap: Record<string, string> = {
    daily: 'border-sky-400/40 bg-sky-950/30 text-sky-200',
    instruction: 'border-violet-400/40 bg-violet-950/30 text-violet-200',
    management: 'border-emerald-400/40 bg-emerald-950/30 text-emerald-200',
    engagement: 'border-amber-400/40 bg-amber-950/30 text-amber-200',
  }

  const catBtnBase = 'rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition'

  return (
    <div className="flex h-full flex-col overflow-hidden" data-display-studio-template-picker>
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Templates</h3>
          <button type="button" onClick={closeTemplatePicker} className="text-xs text-slate-500 hover:text-slate-300">
            ✕
          </button>
        </div>
        <p className="text-[9px] text-slate-500 mt-0.5">Choose a template to get started</p>
      </div>

      {/* Category tabs */}
      <div className="shrink-0 flex gap-1.5 px-3 py-2 border-b border-slate-800/50">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${catBtnBase} ${
              activeCategory === cat.id
                ? `${colorMap[cat.id] ?? 'border-cyan-400/50 bg-cyan-950/40 text-cyan-200'}`
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {filtered.map((template) => {
            const resolved = resolveDisplayBackground({
              type: template.backgroundType as 'gradient' | 'solid' | 'image',
              token: template.backgroundToken,
            })
            const warnings = computeReadabilityWarnings(
              DEFAULT_DISPLAY_SCREENS.find((s) => s.id === template.id) ?? DEFAULT_DISPLAY_SCREENS[0],
            )
            return (
              <div
                key={template.id}
                className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden transition hover:border-slate-500"
              >
                {/* Background preview stripe */}
                <div
                  className="h-10 w-full"
                  style={{
                    background: resolved.backgroundImage !== 'none' ? resolved.backgroundImage : resolved.backgroundColor ?? '#0f172a',
                  }}
                />
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-semibold text-slate-200 truncate">{template.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{template.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {template.studentSafe && (
                        <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300">
                          Safe
                        </span>
                      )}
                      {warnings.length > 0 && (
                        <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-[8px] font-semibold text-amber-300">
                          {warnings.length} note{warnings.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">
                      {template.backgroundType}
                    </span>
                    {template.widgetCount > 0 && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">
                        {template.widgetCount} widget{template.widgetCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {template.hasTimer && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">
                        Timer
                      </span>
                    )}
                    {template.hasStudentMessage && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">
                        Message
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg border border-cyan-400/50 bg-cyan-950/40 py-1.5 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    {appliedTemplate === template.id ? '✓ Applied' : 'Use Template'}
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-[10px] text-slate-500 py-8">No templates in this category.</p>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="shrink-0 border-t border-slate-800 p-2">
        <p className="text-center text-[9px] text-slate-500">
          {DEFAULT_DISPLAY_SCREENS.length} templates · {Object.values(packCounts).reduce((a, b) => a + b, 0)} total screens
        </p>
      </div>
    </div>
  )
}
