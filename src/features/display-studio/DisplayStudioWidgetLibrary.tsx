import { useDisplayStudioUI } from './useDisplayStudioUI'
import { STUDIO_WIDGETS, WIDGET_CATEGORY_LABELS, type WidgetCategory } from './studioWidgets'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { QUICK_START_TEMPLATES } from '../display-composer/quickStartTemplates'

const CATEGORIES: WidgetCategory[] = ['time', 'classroom', 'engagement', 'rewards', 'instruction']

const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-800'

export function DisplayStudioWidgetLibrary() {
  const { widgetLibraryOpen, widgetLibraryCategory, toggleWidgetLibrary, closeWidgetLibrary, selectScreen } = useDisplayStudioUI()
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const order = useDisplayComposerStore((s) => s.order)
  const screens = useDisplayComposerStore((s) => s.screens)
  const selectedScreenId = useDisplayStudioUI().selectedScreenId

  if (!widgetLibraryOpen) return null

  const activeId = selectedScreenId ?? order[0] ?? null
  const screen = activeId ? screens[activeId] : undefined

  const handleWidgetToggle = (widgetId: string) => {
    if (!screen) return
    switch (widgetId) {
      case 'clock':
        updateScreen(screen.id, { showClock: !screen.showClock })
        break
      case 'countdown-timer':
        updateScreen(screen.id, {
          timerWidget: { kind: screen.timerWidget.kind === 'general' ? 'none' : 'general', timerId: screen.timerWidget.timerId },
        })
        break
      case 'transition-timer':
        updateScreen(screen.id, {
          timerWidget: { kind: screen.timerWidget.kind === 'transition' ? 'none' : 'transition', timerId: screen.timerWidget.timerId },
        })
        break
      case 'routine-timer':
        updateScreen(screen.id, {
          timerWidget: { kind: screen.timerWidget.kind === 'routine' ? 'none' : 'routine', timerId: screen.timerWidget.timerId },
        })
        break
      case 'directions-text':
        updateScreen(screen.id, { studentMessage: screen.studentMessage ? undefined : 'Add your message here.' })
        break
      case 'materials':
        updateScreen(screen.id, {
          materialsCard: screen.materialsCard
            ? undefined
            : { heading: 'Materials', sections: [{ id: 'sec-1', items: [] }] },
        })
        break
      case 'checklist':
        updateScreen(screen.id, {
          checklistCard: screen.checklistCard
            ? undefined
            : { heading: 'Checklist', items: [] },
        })
        break
      default:
        closeWidgetLibrary()
    }
  }

  const isWidgetActive = (widgetId: string): boolean => {
    if (!screen) return false
    switch (widgetId) {
      case 'clock': return screen.showClock
      case 'countdown-timer': return screen.timerWidget.kind === 'general'
      case 'transition-timer': return screen.timerWidget.kind === 'transition'
      case 'routine-timer': return screen.timerWidget.kind === 'routine'
      case 'directions-text': return Boolean(screen.studentMessage)
      case 'materials': return Boolean(screen.materialsCard)
      case 'checklist': return Boolean(screen.checklistCard)
      default: return false
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
              onClick={() => handleWidgetToggle(widget.id)}
              disabled={isPlaceholder}
              title={widget.description}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center transition ${
                active
                  ? 'border-cyan-400/40 bg-cyan-950/30'
                  : isPlaceholder
                    ? 'border-slate-800 bg-slate-900/30 opacity-50'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
              }`}
            >
              <span className="text-lg" aria-hidden="true">{widget.icon}</span>
              <span className="text-[9px] font-semibold leading-tight text-slate-300">{widget.label}</span>
              {active && <span className="text-[8px] text-cyan-400">● Active</span>}
              {isPlaceholder && <span className="text-[8px] text-slate-600">Coming soon</span>}
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
