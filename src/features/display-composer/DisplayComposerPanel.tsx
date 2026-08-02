import { useMemo, useState } from 'react'
import { ensureRoutineTimer, ensureTaskTimer, ensureTransitionTimer, useTimerStore } from '../../store/timerStore'
import { DisplayScreenRenderer } from './DisplayScreenRenderer'
import { toDisplaySafeScreen } from './displaySafe'
import { useDisplayComposerStore } from './displayComposerStore'
import { isDefaultScreenId } from './defaultScreens'
import { DISPLAY_BACKGROUND_GRADIENTS, DISPLAY_BACKGROUND_SOLIDS } from './backgroundStyles'
import { BACKGROUND_ASSETS } from '../../data/backgroundAssets'
import { LessonMessageGeneratorPanel } from './LessonMessageGeneratorPanel'
import { mapLessonMessageDraftToScreenPatch } from './aiLessonMessageMapping'
import type { LessonMessageDraft } from './aiLessonMessageTypes'
import { countScreensByPack, DISPLAY_SCREEN_PACKS, filterScreensByPack } from './screenPacks'
import { buildQuickStartScreenPatch, QUICK_START_TEMPLATES } from './quickStartTemplates'
import { computeReadabilityWarnings } from './readabilityChecks'
import type {
  ChecklistItem,
  DisplayBackgroundType,
  DisplayScreen,
  DisplayTimerWidgetKind,
  MaterialsCardSection,
} from './types'

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-400'
const sectionShell = 'rounded-xl border border-slate-700 bg-slate-900/50 p-3'
const primaryBtn =
  'rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/50'
const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800'
const dangerBtn =
  'rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/40'

const TIMER_KIND_OPTIONS: { value: DisplayTimerWidgetKind; label: string }[] = [
  { value: 'none', label: 'No timer' },
  { value: 'general', label: 'General timer' },
  { value: 'transition', label: 'Transition timer' },
  { value: 'task', label: 'Task (group rotation) timer' },
  { value: 'routine', label: 'Routine (auto-advancing) timer' },
]

function TeacherTimerControls({ kind, timerId }: { kind: DisplayTimerWidgetKind; timerId?: string }) {
  const startTransition = useTimerStore((s) => s.startTransition)
  const pauseTransition = useTimerStore((s) => s.pauseTransition)
  const resumeTransition = useTimerStore((s) => s.resumeTransition)
  const resetTransition = useTimerStore((s) => s.resetTransition)
  const transitionTimer = useTimerStore((s) => (timerId ? ensureTransitionTimer(s.transitionTimers, timerId) : undefined))

  const startTask = useTimerStore((s) => s.startTask)
  const pauseTask = useTimerStore((s) => s.pauseTask)
  const resumeTask = useTimerStore((s) => s.resumeTask)
  const resetTask = useTimerStore((s) => s.resetTask)
  const taskTimer = useTimerStore((s) => (timerId ? ensureTaskTimer(s.taskTimers, timerId) : undefined))

  const startRoutine = useTimerStore((s) => s.startRoutine)
  const pauseRoutineTimer = useTimerStore((s) => s.pauseRoutineTimer)
  const resumeRoutineTimer = useTimerStore((s) => s.resumeRoutineTimer)
  const resetRoutineTimer = useTimerStore((s) => s.resetRoutineTimer)
  const routineTimer = useTimerStore((s) => (timerId ? ensureRoutineTimer(s.routineTimers, timerId) : undefined))

  if (!timerId || kind === 'none') return null

  let status = 'idle'
  let onStart = () => {}
  let onPause = () => {}
  let onResume = () => {}
  let onReset = () => {}

  if (kind === 'general' || kind === 'transition') {
    status = transitionTimer?.status ?? 'idle'
    onStart = () => startTransition(timerId)
    onPause = () => pauseTransition(timerId)
    onResume = () => resumeTransition(timerId)
    onReset = () => resetTransition(timerId)
  } else if (kind === 'task') {
    status = taskTimer?.status ?? 'idle'
    onStart = () => startTask(timerId)
    onPause = () => pauseTask(timerId)
    onResume = () => resumeTask(timerId)
    onReset = () => resetTask(timerId)
  } else if (kind === 'routine') {
    status = routineTimer?.status ?? 'idle'
    onStart = () => startRoutine(timerId)
    onPause = () => pauseRoutineTimer(timerId)
    onResume = () => resumeRoutineTimer(timerId)
    onReset = () => resetRoutineTimer(timerId)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Timer status: {status}
      </span>
      {status === 'running' ? (
        <button type="button" className={secondaryBtn} onClick={onPause}>Pause</button>
      ) : status === 'paused' ? (
        <button type="button" className={primaryBtn} onClick={onResume}>Resume</button>
      ) : (
        <button type="button" className={primaryBtn} onClick={onStart}>Start</button>
      )}
      <button type="button" className={secondaryBtn} onClick={onReset}>Reset</button>
    </div>
  )
}

export function DisplayComposerPanel() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const duplicateScreen = useDisplayComposerStore((s) => s.duplicateScreen)
  const resetScreenToDefault = useDisplayComposerStore((s) => s.resetScreenToDefault)
  const createCustomScreen = useDisplayComposerStore((s) => s.createCustomScreen)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)

  const [selectedId, setSelectedId] = useState<string>(order[0] ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [packFilter, setPackFilter] = useState<string>('all')

  const selected: DisplayScreen | undefined = screens[selectedId]

  const showStatus = (message: string) => {
    setStatus(message)
    window.setTimeout(() => setStatus(null), 3000)
  }

  const safePreviewScreen = useMemo(
    () => (selected ? toDisplaySafeScreen(selected) : null),
    [selected],
  )

  const imageAssetOptions = useMemo(
    () => BACKGROUND_ASSETS.map((a) => ({ id: a.id, label: a.label })),
    [],
  )

  const allScreens = useMemo(
    () => order.map((id) => screens[id]).filter((s): s is DisplayScreen => Boolean(s)),
    [order, screens],
  )
  const packCounts = useMemo(() => countScreensByPack(allScreens), [allScreens])
  const visibleScreenIds = useMemo(() => {
    if (packFilter === 'all') return order
    return filterScreensByPack(allScreens, packFilter).map((s) => s.id)
  }, [order, allScreens, packFilter])

  const handleSaveDraftAsNewScreen = (draft: LessonMessageDraft) => {
    const newId = createCustomScreen(draft.title)
    updateScreen(newId, mapLessonMessageDraftToScreenPatch(draft, newId))
    setSelectedId(newId)
  }

  const handleCreateFromTemplate = (templateId: string, templateLabel: string) => {
    const patch = buildQuickStartScreenPatch(templateId)
    if (!patch) return
    const newId = createCustomScreen(patch.title ?? templateLabel)
    updateScreen(newId, patch)
    setSelectedId(newId)
    showStatus(`Created a new screen from "${templateLabel}". Edit it below before sending to display.`)
  }

  if (!selected) {
    return <p className="text-xs text-slate-400">No display screens available.</p>
  }

  const handleApplyDraft = (draft: LessonMessageDraft) => {
    updateScreen(selected.id, mapLessonMessageDraftToScreenPatch(draft, selected.id))
  }

  const readabilityWarnings = computeReadabilityWarnings(selected)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Saved Screens</p>
          <label className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pack</span>
            <select
              className={`${inputClass} w-auto`}
              value={packFilter}
              onChange={(e) => setPackFilter(e.target.value)}
              aria-label="Filter saved screens by pack"
            >
              <option value="all">All ({allScreens.length})</option>
              {DISPLAY_SCREEN_PACKS.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.label} ({packCounts[pack.id] ?? 0})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5" data-screen-pack-list>
          {visibleScreenIds.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-[11px] text-slate-500">
              No screens in this pack yet.
            </p>
          )}
          {visibleScreenIds.map((id) => {
            const screen = screens[id]
            if (!screen) return null
            const isSelected = id === selectedId
            const isLive = id === activeScreenId
            return (
              <button
                key={id}
                type="button"
                data-display-screen-card={id}
                onClick={() => setSelectedId(id)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-100'
                    : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {screen.title}
                {isLive && <span className="ml-1 text-emerald-400">●</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className={sectionShell} data-quick-start-templates>
        <p className={labelClass}>Quick-Start Templates</p>
        <p className="mt-1 text-[11px] text-slate-400">Create a new blank screen to customize — separate from the Lesson Message Generator below.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_START_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              title={template.description}
              className={secondaryBtn}
              onClick={() => handleCreateFromTemplate(template.id, template.label)}
            >
              + {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={primaryBtn}
          onClick={() => {
            sendToDisplay(selected.id)
            showStatus(`"${selected.title}" sent to display.`)
          }}
        >
          Send to Display
        </button>
        {activeScreenId && (
          <button type="button" className={secondaryBtn} onClick={clearDisplay}>
            Clear Display
          </button>
        )}
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            const newId = duplicateScreen(selected.id)
            if (newId) {
              setSelectedId(newId)
              showStatus('Screen duplicated.')
            }
          }}
        >
          Duplicate
        </button>
        {isDefaultScreenId(selected.id) && (
          <button
            type="button"
            className={dangerBtn}
            onClick={() => {
              resetScreenToDefault(selected.id)
              showStatus('Screen reset to shipped defaults.')
            }}
          >
            Reset to Defaults
          </button>
        )}
      </div>

      {status && (
        <p role="status" className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
          {status}
        </p>
      )}

      {!selected.studentSafe && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
          ⚠ This screen is marked not student-safe — it will never appear on /display, even if sent, until you
          re-enable "Student-safe" below.
        </p>
      )}

      {readabilityWarnings.length > 0 && (
        <div
          className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100"
          data-readability-warnings
        >
          <p className="font-semibold uppercase tracking-wide text-[10px] text-amber-300/90">Readability Check (teacher-only, not shown on /display)</p>
          <ul className="mt-1 flex flex-col gap-1">
            {readabilityWarnings.map((w) => (
              <li key={w.id} className="flex items-start gap-1.5">
                <span aria-hidden="true">{w.icon}</span>
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className={labelClass}>Student-Facing Preview (exactly what /display shows)</p>
        <div className="mt-1 aspect-video w-full overflow-hidden rounded-xl border border-slate-700">
          {safePreviewScreen && <DisplayScreenRenderer screen={safePreviewScreen} variant="controlPreview" />}
        </div>
      </div>

      <div className={sectionShell}>
        <label className={labelClass} htmlFor="dc-title">Screen Title</label>
        <input
          id="dc-title"
          className={`${inputClass} mt-1`}
          value={selected.title}
          onChange={(e) => updateScreen(selected.id, { title: e.target.value })}
        />

        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <input
            type="checkbox"
            checked={selected.showClock}
            onChange={(e) => updateScreen(selected.id, { showClock: e.target.checked })}
          />
          Show clock
        </label>

        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <input
            type="checkbox"
            checked={selected.studentSafe}
            onChange={(e) => updateScreen(selected.id, { studentSafe: e.target.checked })}
          />
          Student-safe (visible on /display)
        </label>

        <label className={`${labelClass} mt-3`} htmlFor="dc-message">Student Message (optional)</label>
        <textarea
          id="dc-message"
          className={`${inputClass} mt-1`}
          rows={2}
          value={selected.studentMessage ?? ''}
          onChange={(e) => updateScreen(selected.id, { studentMessage: e.target.value || undefined })}
        />
      </div>

      <div className={sectionShell}>
        <p className={labelClass}>Background</p>
        <div className="mt-1 flex gap-2">
          <select
            className={inputClass}
            value={selected.background.type}
            onChange={(e) => {
              const type = e.target.value as DisplayBackgroundType
              const fallbackToken =
                type === 'gradient'
                  ? DISPLAY_BACKGROUND_GRADIENTS[0].id
                  : type === 'solid'
                    ? DISPLAY_BACKGROUND_SOLIDS[0].id
                    : imageAssetOptions[0]?.id ?? ''
              updateScreen(selected.id, { background: { type, token: fallbackToken } })
            }}
          >
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
            <option value="solid">Solid</option>
          </select>
          <select
            className={inputClass}
            value={selected.background.token}
            onChange={(e) => updateScreen(selected.id, { background: { ...selected.background, token: e.target.value } })}
          >
            {selected.background.type === 'gradient' &&
              DISPLAY_BACKGROUND_GRADIENTS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            {selected.background.type === 'solid' &&
              DISPLAY_BACKGROUND_SOLIDS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            {selected.background.type === 'image' &&
              imageAssetOptions.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
          </select>
        </div>
      </div>

      <div className={sectionShell}>
        <p className={labelClass}>Timer</p>
        <div className="mt-1 flex gap-2">
          <select
            className={inputClass}
            value={selected.timerWidget.kind}
            onChange={(e) =>
              updateScreen(selected.id, {
                timerWidget: { kind: e.target.value as DisplayTimerWidgetKind, timerId: selected.timerWidget.timerId },
              })
            }
          >
            {TIMER_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {selected.timerWidget.kind !== 'none' && (
            <input
              className={inputClass}
              placeholder="timer id"
              value={selected.timerWidget.timerId ?? ''}
              onChange={(e) =>
                updateScreen(selected.id, {
                  timerWidget: { kind: selected.timerWidget.kind, timerId: e.target.value },
                })
              }
            />
          )}
        </div>
        <div className="mt-2">
          <TeacherTimerControls kind={selected.timerWidget.kind} timerId={selected.timerWidget.timerId} />
        </div>
      </div>

      <MaterialsCardEditor
        screen={selected}
        onChange={(materialsCard) => updateScreen(selected.id, { materialsCard })}
      />

      <ChecklistCardEditor
        screen={selected}
        onChange={(checklistCard) => updateScreen(selected.id, { checklistCard })}
      />

      <div className={sectionShell} data-lesson-message-generator>
        <LessonMessageGeneratorPanel
          onApplyDraft={handleApplyDraft}
          onSaveDraftAsNewScreen={handleSaveDraftAsNewScreen}
        />
      </div>
    </div>
  )
}

function MaterialsCardEditor({
  screen,
  onChange,
}: {
  screen: DisplayScreen
  onChange: (card: DisplayScreen['materialsCard']) => void
}) {
  const card = screen.materialsCard

  if (!card) {
    return (
      <div className={sectionShell}>
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => onChange({ heading: 'Materials', sections: [{ id: 'section-1', items: [] }] })}
        >
          + Add Materials Card
        </button>
      </div>
    )
  }

  const updateSection = (index: number, patch: Partial<MaterialsCardSection>) => {
    const sections = card.sections.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange({ ...card, sections })
  }

  return (
    <div className={sectionShell}>
      <div className="flex items-center justify-between">
        <p className={labelClass}>Materials Card</p>
        <button type="button" className={dangerBtn} onClick={() => onChange(undefined)}>Remove</button>
      </div>
      <input
        className={`${inputClass} mt-1`}
        value={card.heading}
        onChange={(e) => onChange({ ...card, heading: e.target.value })}
      />
      <div className="mt-2 flex flex-col gap-2">
        {card.sections.map((section, i) => (
          <div key={section.id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-2">
            <input
              className={inputClass}
              placeholder="Section label (optional)"
              value={section.label ?? ''}
              onChange={(e) => updateSection(i, { label: e.target.value || undefined })}
            />
            <textarea
              className={`${inputClass} mt-1`}
              rows={3}
              placeholder="One item per line"
              value={section.items.join('\n')}
              onChange={(e) => updateSection(i, { items: e.target.value.split('\n').filter((line) => line.length > 0) })}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className={`${secondaryBtn} mt-2`}
        onClick={() =>
          onChange({
            ...card,
            sections: [...card.sections, { id: `section-${card.sections.length + 1}`, items: [] }],
          })
        }
      >
        + Add Section
      </button>
    </div>
  )
}

function ChecklistCardEditor({
  screen,
  onChange,
}: {
  screen: DisplayScreen
  onChange: (card: DisplayScreen['checklistCard']) => void
}) {
  const card = screen.checklistCard

  if (!card) {
    return (
      <div className={sectionShell}>
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => onChange({ heading: 'Checklist', items: [] })}
        >
          + Add Checklist Card
        </button>
      </div>
    )
  }

  const updateItem = (index: number, patch: Partial<ChecklistItem>) => {
    const items = card.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...card, items })
  }

  const removeItem = (index: number) => {
    onChange({ ...card, items: card.items.filter((_, i) => i !== index) })
  }

  return (
    <div className={sectionShell}>
      <div className="flex items-center justify-between">
        <p className={labelClass}>Checklist Card</p>
        <button type="button" className={dangerBtn} onClick={() => onChange(undefined)}>Remove</button>
      </div>
      <input
        className={`${inputClass} mt-1`}
        value={card.heading}
        onChange={(e) => onChange({ ...card, heading: e.target.value })}
      />
      <div className="mt-2 flex flex-col gap-1.5">
        {card.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <input
              className={`${inputClass} w-12 text-center`}
              value={item.icon}
              onChange={(e) => updateItem(i, { icon: e.target.value })}
            />
            <input
              className={inputClass}
              value={item.text}
              onChange={(e) => updateItem(i, { text: e.target.value })}
            />
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => updateItem(i, { checked: e.target.checked })}
            />
            <button type="button" className={dangerBtn} onClick={() => removeItem(i)}>×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={`${secondaryBtn} mt-2`}
        onClick={() =>
          onChange({
            ...card,
            items: [...card.items, { id: `item-${card.items.length + 1}`, icon: '✔', text: '', checked: false }],
          })
        }
      >
        + Add Item
      </button>
    </div>
  )
}
