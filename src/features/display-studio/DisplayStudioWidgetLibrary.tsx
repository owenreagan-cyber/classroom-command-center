import { useDisplayStudioUI } from './useDisplayStudioUI'
import { STUDIO_WIDGETS, WIDGET_CATEGORY_LABELS, type WidgetCategory } from './studioWidgets'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { QUICK_START_TEMPLATES } from '../display-composer/quickStartTemplates'
import type { CanvasWidgetType, WidgetSizePreset } from '../display-composer/types'

const CATEGORIES: WidgetCategory[] = ['time', 'classroom', 'engagement', 'rewards', 'instruction']

const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-800'

const WIDGET_TYPE_MAP: Record<string, { canvasType: CanvasWidgetType | string | null; defaultSize: WidgetSizePreset }> = {
  clock: { canvasType: null, defaultSize: 'small' },
  'countdown-timer': { canvasType: 'countdown-timer', defaultSize: 'medium' },
  stopwatch: { canvasType: null, defaultSize: 'medium' },
  'routine-timer': { canvasType: 'routine-timer', defaultSize: 'large' },
  'directions-text': { canvasType: 'directions-text', defaultSize: 'wide' },
  materials: { canvasType: 'materials', defaultSize: 'medium' },
  checklist: { canvasType: 'checklist', defaultSize: 'medium' },
  'work-symbols': { canvasType: 'work-symbols', defaultSize: 'small' },
  'random-picker': { canvasType: 'random-picker', defaultSize: 'medium' },
  'mystery-student': { canvasType: 'mystery-student', defaultSize: 'medium' },
  '100-board': { canvasType: '100-board', defaultSize: 'medium' },
  'prize-board': { canvasType: 'prize-board', defaultSize: 'large' },
  'press-your-luck': { canvasType: 'press-your-luck', defaultSize: 'large' },
  'lotto-board': { canvasType: 'lotto-board', defaultSize: 'medium' },
  'jobs-manager': { canvasType: 'jobs-manager', defaultSize: 'large' },
  'noise-meter': { canvasType: 'noise-meter', defaultSize: 'small' },
  atmosphere: { canvasType: 'atmosphere', defaultSize: 'small' },
  'qr-code': { canvasType: null, defaultSize: 'small' },
  'dice-spinner': { canvasType: null, defaultSize: 'medium' },
  poll: { canvasType: null, defaultSize: 'medium' },
  scoreboard: { canvasType: null, defaultSize: 'wide' },
  image: { canvasType: null, defaultSize: 'large' },
  'pdf-embed': { canvasType: null, defaultSize: 'large' },
}

export function DisplayStudioWidgetLibrary() {
  const { widgetLibraryOpen, widgetLibraryCategory, toggleWidgetLibrary, closeWidgetLibrary, selectScreen, selectWidget } = useDisplayStudioUI()
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const addWidget = useDisplayComposerStore((s) => s.addWidget)
  const order = useDisplayComposerStore((s) => s.order)
  const screens = useDisplayComposerStore((s) => s.screens)
  const selectedScreenId = useDisplayStudioUI().selectedScreenId

  if (!widgetLibraryOpen) return null

  const activeId = selectedScreenId ?? order[0] ?? null
  const screen = activeId ? screens[activeId] : undefined

  const handleWidgetAdd = (widgetId: string) => {
    if (!screen) return
    const map = WIDGET_TYPE_MAP[widgetId]
    if (!map) return

    if (widgetId === 'clock') {
      updateScreen(screen.id, { showClock: !screen.showClock })
      return
    }

    if (map.canvasType) {
      const definition = STUDIO_WIDGETS.find((w) => w.id === widgetId)
      const newWidgetId = addWidget(screen.id, map.canvasType as CanvasWidgetType, definition?.label ?? widgetId, map.defaultSize)
      if (newWidgetId) {
        selectWidget(newWidgetId)
        closeWidgetLibrary()
      }
      return
    }

    // Fallback for non-canvas widgets: toggle existing screen fields
    if (widgetId === 'materials') {
      updateScreen(screen.id, {
        materialsCard: screen.materialsCard
          ? undefined
          : { heading: 'Materials', sections: [{ id: 'sec-1', items: [] }] },
      })
    } else if (widgetId === 'checklist') {
      updateScreen(screen.id, {
        checklistCard: screen.checklistCard
          ? undefined
          : { heading: 'Checklist', items: [] },
      })
    }
    closeWidgetLibrary()
  }

  const isWidgetActive = (widgetId: string): boolean => {
    if (!screen) return false
    switch (widgetId) {
      case 'clock': return screen.showClock
      default: {
        const map = WIDGET_TYPE_MAP[widgetId]
        if (map?.canvasType) {
          const widgets = screen.widgets ?? []
          return widgets.some((w) => w.type === map.canvasType)
        }
        return false
      }
    }
  }

  const displayedCategory = widgetLibraryCategory ?? CATEGORIES[0]

  const handleCreateFromTemplate = (templateId: string) => {
    const template = QUICK_START_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    const patch = template.build()
    const store = useDisplayComposerStore.getState()
    const newId = store.createCustomScreen(patch.title ?? template.label)
    store.updateScreen(newId, { studentSafe: true, ...patch })
    selectScreen(newId)
  }

  return (
    <div className="shrink-0 border-b border-slate-800" data-display-studio-widget-library>
      <div className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Widgets</h2>
        <button
          type="button"
          onClick={closeWidgetLibrary}
          className="text-[10px] text-slate-500 hover:text-slate-300"
          aria-label="Close widget library"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-0.5 overflow-x-auto px-3 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggleWidgetLibrary(cat)}
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
              displayedCategory === cat
                ? 'bg-cyan-950/50 text-cyan-200'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            {WIDGET_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
        {STUDIO_WIDGETS.filter((w) => w.category === displayedCategory).map((widget) => {
          const active = isWidgetActive(widget.id)
          const isPlaceholder = widget.status === 'placeholder'
          return (
            <button
              key={widget.id}
              type="button"
              onClick={() => handleWidgetAdd(widget.id)}
              disabled={isPlaceholder}
              title={widget.description}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center transition ${
                active
                  ? 'border-cyan-400/40 bg-cyan-950/30'
                  : isPlaceholder
                    ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{widget.icon}</span>
              <span className="text-[9px] font-semibold leading-tight text-slate-300">{widget.label}</span>
              {active && <span className="text-[8px] text-cyan-400">● Active</span>}
              {isPlaceholder && <span className="text-[8px] text-slate-600">Coming soon</span>}
              {widget.status === 'connected' && !active && <span className="text-[8px] text-emerald-500">Ready</span>}
            </button>
          )
        })}
      </div>

      <div className="border-t border-slate-800 px-3 py-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quick Templates</p>
        <div className="flex flex-wrap gap-1">
          {QUICK_START_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              title={template.description}
              className={secondaryBtn}
              onClick={() => handleCreateFromTemplate(template.id)}
            >
              + {template.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
