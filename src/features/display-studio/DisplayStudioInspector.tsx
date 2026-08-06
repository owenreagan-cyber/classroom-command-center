import { useState, useCallback } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import type { InspectorSectionId } from './displayStudioTypes'
import { DISPLAY_BACKGROUND_GRADIENTS, DISPLAY_BACKGROUND_SOLIDS } from '../display-composer/backgroundStyles'
import { BACKGROUND_ASSETS } from '../../data/backgroundAssets'
import { computeReadabilityWarnings } from '../display-composer/readabilityChecks'
import { isDefaultScreenId } from '../display-composer/defaultScreens'
import { DisplayStudioThemePicker } from './DisplayStudioThemePicker'
import type {
  DisplayScreen,
  DisplayBackgroundType,
  DisplayTimerWidgetKind,
  CanvasWidget,
  WidgetSizePreset,
} from '../display-composer/types'

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5'
const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-800'
const dangerBtn =
  'rounded-lg border border-rose-400/40 bg-rose-950/30 px-2 py-1 text-[10px] font-semibold text-rose-100 transition hover:bg-rose-900/40'
const primarySmBtn =
  'rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-2 py-1 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-900/50'

const TIMER_KIND_OPTIONS: { value: DisplayTimerWidgetKind; label: string }[] = [
  { value: 'none', label: 'No timer' },
  { value: 'general', label: 'General timer' },
  { value: 'transition', label: 'Transition timer' },
  { value: 'task', label: 'Task (group rotation) timer' },
  { value: 'routine', label: 'Routine (auto-advancing) timer' },
]

const SIZE_PRESETS: { value: WidgetSizePreset; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'wide', label: 'Wide' },
  { value: 'full-width', label: 'Full Width' },
]

function InspectorSectionHeader({
  id,
  label,
  isExpanded,
  onToggle,
}: {
  id: InspectorSectionId
  label: string
  isExpanded: boolean
  onToggle: (section: InspectorSectionId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 transition hover:bg-slate-800/50"
      aria-expanded={isExpanded}
    >
      <span>{label}</span>
      <span className="text-slate-500 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
        ▶
      </span>
    </button>
  )
}

function ScreenSection({ screen }: { screen: DisplayScreen }) {
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)

  return (
    <div className="space-y-2 px-3 pb-3">
      <div>
        <label className={labelClass} htmlFor="studio-title">Screen Title</label>
        <input
          id="studio-title"
          className={inputClass}
          value={screen.title}
          onChange={(e) => updateScreen(screen.id, { title: e.target.value })}
          data-studio-field="title"
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
        <input
          type="checkbox"
          checked={screen.showClock}
          onChange={(e) => updateScreen(screen.id, { showClock: e.target.checked })}
        />
        Show clock
      </label>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
        <input
          type="checkbox"
          checked={screen.studentSafe}
          onChange={(e) => updateScreen(screen.id, { studentSafe: e.target.checked })}
        />
        Student-safe (visible on /display)
      </label>
      {!screen.studentSafe && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-100">
          Will not appear on /display until "Student-safe" is re-enabled.
        </p>
      )}
    </div>
  )
}

function ContentSection({ screen }: { screen: DisplayScreen }) {
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)

  return (
    <div className="space-y-2 px-3 pb-3">
      <div>
        <label className={labelClass} htmlFor="studio-message">Student Message</label>
        <textarea
          id="studio-message"
          className={inputClass}
          rows={3}
          value={screen.studentMessage ?? ''}
          onChange={(e) => updateScreen(screen.id, { studentMessage: e.target.value || undefined })}
          placeholder="Optional message shown to students..."
          data-studio-field="message"
        />
      </div>
    </div>
  )
}

function StyleSection({ screen }: { screen: DisplayScreen }) {
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const imageAssetOptions = useState(() =>
    BACKGROUND_ASSETS.map((a) => ({ id: a.id, label: a.label })),
  )[0]

  return (
    <div className="space-y-2 px-3 pb-3">
      <div className="flex gap-2">
        <select
          className={inputClass}
          value={screen.background.type}
          onChange={(e) => {
            const type = e.target.value as DisplayBackgroundType
            const fallbackToken =
              type === 'gradient'
                ? DISPLAY_BACKGROUND_GRADIENTS[0].id
                : type === 'solid'
                  ? DISPLAY_BACKGROUND_SOLIDS[0].id
                  : imageAssetOptions[0]?.id ?? ''
            updateScreen(screen.id, { background: { type, token: fallbackToken } })
          }}
        >
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
          <option value="solid">Solid</option>
        </select>
        <select
          className={inputClass}
          value={screen.background.token}
          onChange={(e) => updateScreen(screen.id, { background: { ...screen.background, token: e.target.value } })}
        >
          {screen.background.type === 'gradient' &&
            DISPLAY_BACKGROUND_GRADIENTS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          {screen.background.type === 'solid' &&
            DISPLAY_BACKGROUND_SOLIDS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          {screen.background.type === 'image' &&
            imageAssetOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Timer</label>
        <div className="flex gap-2">
          <select
            className={inputClass}
            value={screen.timerWidget.kind}
            onChange={(e) =>
              updateScreen(screen.id, {
                timerWidget: { kind: e.target.value as DisplayTimerWidgetKind, timerId: screen.timerWidget.timerId },
              })
            }
          >
            {TIMER_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {screen.timerWidget.kind !== 'none' && (
            <input
              className={inputClass}
              placeholder="Timer ID"
              value={screen.timerWidget.timerId ?? ''}
              onChange={(e) =>
                updateScreen(screen.id, {
                  timerWidget: { kind: screen.timerWidget.kind, timerId: e.target.value },
                })
              }
            />
          )}
        </div>
      </div>

      {/* Phase 15G: Theme Picker */}
      <DisplayStudioThemePicker />
    </div>
  )
}

function WidgetsSection({ screen }: { screen: DisplayScreen }) {
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const { toggleWidgetLibrary, selectWidget, selectedWidgetId } = useDisplayStudioUI()

  const widgets = screen.widgets ?? []

  return (
    <div className="space-y-2 px-3 pb-3">
      {/* Canvas widgets list */}
      {widgets.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Canvas Widgets</p>
          {widgets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => { selectWidget(w.id); }}
              className={`w-full rounded-lg border px-2 py-1.5 text-left text-[10px] transition ${
                w.id === selectedWidgetId
                  ? 'border-cyan-400/50 bg-cyan-950/30'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{w.label}</span>
                <span className="text-[9px] text-slate-500">{w.type}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[8px] text-slate-500">
                {!w.visible && <span className="text-slate-600">Hidden</span>}
                {w.locked && <span className="text-amber-400">Locked</span>}
                {w.visible && !w.locked && <span>Active</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Materials Card */}
      {!screen.materialsCard ? (
        <button type="button" className={`w-full ${secondaryBtn}`} onClick={() => updateScreen(screen.id, { materialsCard: { heading: 'Materials', sections: [{ id: 'sec-1', items: [] }] } })}>
          + Add Materials Card
        </button>
      ) : (
        <MaterialsMiniEditor
          card={screen.materialsCard}
          onChange={(card) => updateScreen(screen.id, { materialsCard: card || undefined })}
        />
      )}

      {/* Checklist Card */}
      {!screen.checklistCard ? (
        <button type="button" className={`w-full ${secondaryBtn}`} onClick={() => updateScreen(screen.id, { checklistCard: { heading: 'Checklist', items: [] } })}>
          + Add Checklist Card
        </button>
      ) : (
        <ChecklistMiniEditor
          card={screen.checklistCard}
          onChange={(card) => updateScreen(screen.id, { checklistCard: card || undefined })}
        />
      )}

      <button
        type="button"
        className={`w-full ${secondaryBtn}`}
        onClick={() => toggleWidgetLibrary()}
      >
        Browse Widget Library...
      </button>
    </div>
  )
}

/** Widget-specific settings section shown when a widget is selected. */
function WidgetDetailSection({ screen, widget }: { screen: DisplayScreen; widget: CanvasWidget }) {
  const removeWidget = useDisplayComposerStore((s) => s.removeWidget)
  const duplicateWidget = useDisplayComposerStore((s) => s.duplicateWidget)
  const toggleWidgetVisibility = useDisplayComposerStore((s) => s.toggleWidgetVisibility)
  const toggleWidgetLock = useDisplayComposerStore((s) => s.toggleWidgetLock)
  const resizeWidget = useDisplayComposerStore((s) => s.resizeWidget)
  const bringWidgetForward = useDisplayComposerStore((s) => s.bringWidgetForward)
  const sendWidgetBackward = useDisplayComposerStore((s) => s.sendWidgetBackward)
  const updateWidget = useDisplayComposerStore((s) => s.updateWidget)
  const { selectWidget } = useDisplayStudioUI()

  return (
    <div className="space-y-2 px-3 pb-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {widget.label}
        </span>
        <span className="text-[8px] text-slate-500">{widget.type}</span>
      </div>

      {/* Label */}
      <div>
        <label className={labelClass}>Label</label>
        <input
          className={inputClass}
          value={widget.label}
          onChange={(e) => updateWidget(screen.id, widget.id, { label: e.target.value })}
        />
      </div>

      {/* Widget-specific controls */}
      {widget.type === 'directions-text' && (
        <div>
          <label className={labelClass}>Text</label>
          <textarea
            className={inputClass}
            rows={3}
            value={(widget.settings.text as string) ?? ''}
            onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, text: e.target.value } })}
            placeholder="Display text for students..."
          />
        </div>
      )}

      {widget.type === 'countdown-timer' && (
        <div>
          <label className={labelClass}>Timer Kind</label>
          <select
            className={inputClass}
            value={(widget.settings.timerKind as string) ?? 'general'}
            onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, timerKind: e.target.value } })}
          >
            <option value="general">General</option>
            <option value="transition">Transition</option>
          </select>
        </div>
      )}

      {widget.type === 'routine-timer' && (
        <div>
          <label className={labelClass}>Routine ID</label>
          <input
            className={inputClass}
            value={(widget.settings.routineId as string) ?? 'lunch-routine'}
            onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, routineId: e.target.value } })}
            placeholder="e.g. lunch-routine"
          />
        </div>
      )}

      {widget.type === 'noise-meter' && (
        <>
          <div>
            <label className={labelClass}>Mode</label>
            <select
              className={inputClass}
              value={(widget.settings.mode as string) ?? 'manual'}
              onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, mode: e.target.value } })}
            >
              <option value="manual">Manual</option>
              <option value="live">Live (board store)</option>
            </select>
          </div>
          {(widget.settings.mode as string) !== 'live' && (
            <div>
              <label className={labelClass}>Level</label>
              <select
                className={inputClass}
                value={(widget.settings.level as string) ?? 'whisper'}
                onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, level: e.target.value } })}
              >
                <option value="silent">Silent</option>
                <option value="whisper">Whisper</option>
                <option value="normal">Normal</option>
                <option value="loud">Too Loud</option>
              </select>
            </div>
          )}
        </>
      )}

      {widget.type === 'work-symbols' && (
        <div>
          <label className={labelClass}>Symbol</label>
          <select
            className={inputClass}
            value={(widget.settings.symbol as string) ?? 'silent'}
            onChange={(e) => updateWidget(screen.id, widget.id, { settings: { ...widget.settings, symbol: e.target.value } })}
          >
            <option value="silent">Silent Work</option>
            <option value="whisper">Whisper</option>
            <option value="partner">Partner Work</option>
            <option value="group">Group Work</option>
            <option value="independent">Independent</option>
          </select>
        </div>
      )}

      {/* Status badges for connected widgets */}
      {['mystery-student', 'random-picker', '100-board', 'prize-board', 'press-your-luck', 'atmosphere'].includes(widget.type) && (
        <p className="rounded-lg border border-cyan-400/30 bg-cyan-950/20 px-2 py-1 text-[9px] text-cyan-200">
          Connected to existing tool — status shown in widget
        </p>
      )}

      {/* Size preset */}
      <div>
        <label className={labelClass}>Size</label>
        <select
          className={inputClass}
          value={SIZE_PRESETS.find((preset) => {
            const dim = { small: { w: 20, h: 20 }, medium: { w: 30, h: 30 }, large: { w: 45, h: 45 }, wide: { w: 60, h: 30 }, 'full-width': { w: 90, h: 20 } }[preset.value]
            if (!dim) return false
            return Math.abs(widget.w - dim.w) < 2 && Math.abs(widget.h - dim.h) < 2
          })?.value ?? 'medium'}
          onChange={(e) => resizeWidget(screen.id, widget.id, e.target.value as WidgetSizePreset)}
        >
          {SIZE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>{preset.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={primarySmBtn}
          onClick={() => {
            toggleWidgetVisibility(screen.id, widget.id)
          }}
        >
          {widget.visible ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            toggleWidgetLock(screen.id, widget.id)
          }}
        >
          {widget.locked ? 'Unlock' : 'Lock'}
        </button>
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            const newId = duplicateWidget(screen.id, widget.id)
            if (newId) selectWidget(newId)
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className={dangerBtn}
          onClick={() => {
            removeWidget(screen.id, widget.id)
            selectWidget(null)
          }}
        >
          Delete
        </button>
      </div>

      {/* Layer controls */}
      <div className="flex gap-1">
        <button type="button" className={secondaryBtn} onClick={() => bringWidgetForward(screen.id, widget.id)}>
          Forward
        </button>
        <button type="button" className={secondaryBtn} onClick={() => sendWidgetBackward(screen.id, widget.id)}>
          Back
        </button>
      </div>
    </div>
  )
}

function MaterialsMiniEditor({
  card,
  onChange,
}: {
  card: DisplayScreen['materialsCard']
  onChange: (card: DisplayScreen['materialsCard'] | undefined) => void
}) {
  if (!card) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materials</span>
        <button type="button" className={dangerBtn} onClick={() => onChange(undefined)}>Remove</button>
      </div>
      <input
        className={`${inputClass} mt-1`}
        value={card.heading}
        onChange={(e) => onChange({ ...card, heading: e.target.value })}
        placeholder="Heading"
      />
      {card.sections.map((section, i) => (
        <textarea
          key={section.id}
          className={`${inputClass} mt-1`}
          rows={2}
          placeholder={section.label ?? 'One item per line'}
          value={section.items.join('\n')}
          onChange={(e) => {
            const newSections = card.sections.map((s, idx) =>
              idx === i ? { ...s, items: e.target.value.split('\n').filter((line) => line.length > 0) } : s,
            )
            onChange({ ...card, sections: newSections })
          }}
        />
      ))}
    </div>
  )
}

function ChecklistMiniEditor({
  card,
  onChange,
}: {
  card: DisplayScreen['checklistCard']
  onChange: (card: DisplayScreen['checklistCard'] | undefined) => void
}) {
  if (!card) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Checklist</span>
        <button type="button" className={dangerBtn} onClick={() => onChange(undefined)}>Remove</button>
      </div>
      <input
        className={`${inputClass} mt-1`}
        value={card.heading}
        onChange={(e) => onChange({ ...card, heading: e.target.value })}
        placeholder="Heading"
      />
      <div className="mt-1 flex flex-col gap-1">
        {card.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1">
            <input
              className={`${inputClass} w-10 text-center`}
              value={item.icon}
              onChange={(e) => {
                const items = card.items.map((it, idx) => (idx === i ? { ...it, icon: e.target.value } : it))
                onChange({ ...card, items })
              }}
            />
            <input
              className={inputClass}
              value={item.text}
              onChange={(e) => {
                const items = card.items.map((it, idx) => (idx === i ? { ...it, text: e.target.value } : it))
                onChange({ ...card, items })
              }}
            />
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => {
                const items = card.items.map((it, idx) => (idx === i ? { ...it, checked: e.target.checked } : it))
                onChange({ ...card, items })
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className={`${secondaryBtn} mt-1 w-full`}
        onClick={() =>
          onChange({
            ...card,
            items: [...card.items, { id: `item-${card.items.length + 1}`, icon: '\u2714', text: '', checked: false }],
          })
        }
      >
        + Add Item
      </button>
    </div>
  )
}

function TeacherNotesSection({ screen }: { screen: DisplayScreen }) {
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)

  return (
    <div className="space-y-2 px-3 pb-3">
      <textarea
        className={inputClass}
        rows={4}
        placeholder="Teacher notes — never shown on /display. Use for timing cues, reminders, or group notes."
        aria-label="Teacher notes"
        data-studio-field="teacher-notes"
        value={screen.teacherNotes ?? ''}
        onChange={(e) => updateScreen(screen.id, { teacherNotes: e.target.value || undefined })}
      />
      <p className="text-[9px] text-slate-500">Teacher notes are private and never render on /display.</p>
    </div>
  )
}

function DisplaySection({ screen }: { screen: DisplayScreen }) {
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const duplicateScreen = useDisplayComposerStore((s) => s.duplicateScreen)
  const resetScreenToDefault = useDisplayComposerStore((s) => s.resetScreenToDefault)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const { togglePresenterMode } = useDisplayStudioUI()

  const isLive = screen.id === activeScreenId

  const readabilityWarnings = computeReadabilityWarnings(screen)

  const [status, setStatus] = useState<string | null>(null)
  const showStatus = useCallback((msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 3000)
  }, [])

  return (
    <div className="space-y-2 px-3 pb-3">
      {readabilityWarnings.length > 0 && (
        <div
          className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-100"
          data-readability-warnings
        >
          <p className="font-semibold uppercase tracking-wide text-amber-300/90">
            Readability (teacher-only)
          </p>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {readabilityWarnings.map((w) => (
              <li key={w.id} className="flex items-start gap-1">
                <span aria-hidden="true">{w.icon}</span>
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={primarySmBtn}
          onClick={() => {
            sendToDisplay(screen.id)
            showStatus(`"${screen.title}" sent to display.`)
          }}
          data-studio-action="send-to-display"
        >
          {isLive ? '🟢 Live on Display' : 'Send to Display'}
        </button>
        {activeScreenId && (
          <button
            type="button"
            className={secondaryBtn}
            onClick={clearDisplay}
            data-studio-action="clear-display"
          >
            Clear Display
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            const newId = duplicateScreen(screen.id)
            if (newId) showStatus('Screen duplicated.')
          }}
        >
          Duplicate Screen
        </button>
        {isDefaultScreenId(screen.id) && (
          <button
            type="button"
            className={dangerBtn}
            onClick={() => {
              resetScreenToDefault(screen.id)
              showStatus('Screen reset to shipped defaults.')
            }}
          >
            Reset
          </button>
        )}
        <button
          type="button"
          className={secondaryBtn}
          onClick={togglePresenterMode}
        >
          Presenter
        </button>
      </div>

      {status && (
        <p role="status" className="rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-200">
          {status}
        </p>
      )}
    </div>
  )
}

const INSPECTOR_SECTIONS: { id: InspectorSectionId; label: string }[] = [
  { id: 'screen', label: 'Screen' },
  { id: 'content', label: 'Content' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'style', label: 'Style' },
  { id: 'teacher-notes', label: 'Teacher Notes' },
  { id: 'display', label: 'Display' },
]

export function DisplayStudioInspector() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const { selectedScreenId, selectedWidgetId, expandedInspectorSections, toggleInspectorSection } = useDisplayStudioUI()

  const activeId = selectedScreenId ?? order[0] ?? null
  const screen = activeId ? screens[activeId] : undefined
  const selectedWidget = (selectedWidgetId && screen) ? (screen.widgets ?? []).find((w) => w.id === selectedWidgetId) : undefined

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-800 px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {selectedWidget ? 'Widget' : 'Inspector'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {!screen ? (
          <p className="px-3 py-4 text-xs text-slate-500">Select a screen to edit.</p>
        ) : selectedWidget ? (
          <WidgetDetailSection screen={screen} widget={selectedWidget} />
        ) : (
          INSPECTOR_SECTIONS.map(({ id, label }) => {
            const isExpanded = expandedInspectorSections.includes(id)
            return (
              <div key={id} className="border-b border-slate-800/50 py-1">
                <InspectorSectionHeader
                  id={id}
                  label={label}
                  isExpanded={isExpanded}
                  onToggle={toggleInspectorSection}
                />
                {isExpanded && (
                  <>
                    {id === 'screen' && <ScreenSection screen={screen} />}
                    {id === 'content' && <ContentSection screen={screen} />}
                    {id === 'widgets' && <WidgetsSection screen={screen} />}
                    {id === 'style' && <StyleSection screen={screen} />}
                    {id === 'teacher-notes' && <TeacherNotesSection screen={screen} />}
                    {id === 'display' && <DisplaySection screen={screen} />}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
