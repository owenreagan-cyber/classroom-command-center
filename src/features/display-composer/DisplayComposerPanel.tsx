import { useMemo, useState } from 'react'
import { ensureRoutineTimer, ensureTaskTimer, ensureTransitionTimer, useTimerStore } from '../../store/timerStore'
import { DisplayScreenRenderer } from './DisplayScreenRenderer'
import { toDisplaySafeScreen } from './displaySafe'
import { useDisplayComposerStore } from './displayComposerStore'
import { isDefaultScreenId } from './defaultScreens'
import { DISPLAY_BACKGROUND_GRADIENTS, DISPLAY_BACKGROUND_SOLIDS } from './backgroundStyles'
import { BACKGROUND_ASSETS } from '../../data/backgroundAssets'
import { draftLessonDisplayScreen, type LessonActivityType, type LessonDraftOutput } from './messageDraft'
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

const ACTIVITY_TYPE_OPTIONS: { value: LessonActivityType; label: string }[] = [
  { value: 'lessonLaunch', label: 'Lesson launch' },
  { value: 'workTime', label: 'Work time' },
  { value: 'wrapUp', label: 'Wrap-up' },
  { value: 'transition', label: 'Transition' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'general', label: 'General' },
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
  const [draftOpen, setDraftOpen] = useState(false)
  const [draftSubject, setDraftSubject] = useState('')
  const [draftLessonTitle, setDraftLessonTitle] = useState('')
  const [draftObjective, setDraftObjective] = useState('')
  const [draftMaterials, setDraftMaterials] = useState('')
  const [draftActivityType, setDraftActivityType] = useState<LessonActivityType>('lessonLaunch')
  const [draftResult, setDraftResult] = useState<LessonDraftOutput | null>(null)

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

  const handleGenerateDraft = () => {
    const materials = draftMaterials
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    const result = draftLessonDisplayScreen({
      subject: draftSubject || 'Class',
      lessonTitle: draftLessonTitle || 'today’s lesson',
      objective: draftObjective || undefined,
      materials,
      activityType: draftActivityType,
    })
    setDraftResult(result)
  }

  const handleSaveDraftAsScreen = () => {
    if (!draftResult) return
    const newId = createCustomScreen(draftResult.title)
    updateScreen(newId, {
      studentMessage: draftResult.studentMessage,
      materialsCard: draftResult.materialsChecklist.length
        ? { heading: 'Materials', sections: [{ id: 'materials', items: draftResult.materialsChecklist }] }
        : undefined,
      checklistCard: {
        heading: 'Checklist',
        items: draftResult.studentChecklist.map((text, i) => ({
          id: `step-${i + 1}`,
          icon: '✔',
          text,
          checked: false,
        })),
      },
      timerWidget: { kind: 'general', timerId: `dc-${newId}-general` },
    })
    setSelectedId(newId)
    setDraftResult(null)
    setDraftOpen(false)
    showStatus(`Draft saved as new screen "${draftResult.title}". Review before sending to display.`)
  }

  if (!selected) {
    return <p className="text-xs text-slate-400">No display screens available.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={labelClass}>Saved Screens</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {order.map((id) => {
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

      <div>
        <p className={labelClass}>Preview</p>
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

      <div className={sectionShell}>
        <button type="button" className={secondaryBtn} onClick={() => setDraftOpen((v) => !v)}>
          {draftOpen ? 'Hide' : 'Draft From Lesson (Beta)'}
        </button>
        {draftOpen && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[11px] text-slate-400">
              Deterministic draft only — no live AI. Review and save before sending to display.
            </p>
            <input className={inputClass} placeholder="Subject (e.g. Math)" value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} />
            <input className={inputClass} placeholder="Lesson title" value={draftLessonTitle} onChange={(e) => setDraftLessonTitle(e.target.value)} />
            <input className={inputClass} placeholder="Objective (optional)" value={draftObjective} onChange={(e) => setDraftObjective(e.target.value)} />
            <input className={inputClass} placeholder="Materials (comma separated)" value={draftMaterials} onChange={(e) => setDraftMaterials(e.target.value)} />
            <select className={inputClass} value={draftActivityType} onChange={(e) => setDraftActivityType(e.target.value as LessonActivityType)}>
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button type="button" className={primaryBtn} onClick={handleGenerateDraft}>Generate Draft</button>
            {draftResult && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-200">
                <p className="font-semibold">{draftResult.title}</p>
                <p className="mt-1">{draftResult.studentMessage}</p>
                <p className="mt-1 text-slate-400">Suggested timer: {draftResult.suggestedTimerMinutes} min</p>
                <button type="button" className={`${primaryBtn} mt-2`} onClick={handleSaveDraftAsScreen}>
                  Save as New Screen
                </button>
              </div>
            )}
          </div>
        )}
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
