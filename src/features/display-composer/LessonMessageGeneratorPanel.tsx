import { useState } from 'react'
import { generateLessonMessageDraft } from './aiLessonMessageGenerator'
import { createHttpLessonMessageProvider } from './httpLessonMessageProvider'
import { useAiProviderSettingsStore } from './aiProviderSettingsStore'
import { ProviderStatusControls } from './ProviderStatusControls'
import type { LessonMessageProviderStatus } from './aiProviderConfig'
import {
  LESSON_ACTIVITY_LABELS,
  LESSON_SUBJECT_LABELS,
  defaultLessonMessageInput,
  type LessonActivityKind,
  type LessonMessageDraft,
  type LessonMessageInput,
  type LessonMessageProvider,
  type LessonSubject,
  type LessonTone,
} from './aiLessonMessageTypes'

/** Only localOllama/customEndpoint ever construct a real (never-key-bearing) provider instance. */
function buildConfiguredProvider(settings: ReturnType<typeof useAiProviderSettingsStore.getState>['settings']): LessonMessageProvider | undefined {
  const usesEndpoint = settings.provider === 'localOllama' || settings.provider === 'customEndpoint'
  if (!usesEndpoint || !settings.endpoint) return undefined
  return createHttpLessonMessageProvider({
    endpoint: settings.endpoint,
    modelName: settings.modelName,
    timeoutMs: settings.timeoutMs,
  })
}

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-400'
const primaryBtn =
  'rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/50 disabled:cursor-not-allowed disabled:opacity-40'
const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800'

const SUBJECT_OPTIONS: LessonSubject[] = ['math', 'reading', 'spelling', 'shurley', 'history', 'science', 'homeroom', 'custom']
const ACTIVITY_OPTIONS: LessonActivityKind[] = [
  'arrival',
  'lessonLaunch',
  'transition',
  'workTime',
  'partnerWork',
  'independentWork',
  'reviewGame',
  'exitTicket',
  'packUp',
  'lunch',
  'custom',
]
const TONE_OPTIONS: { value: LessonTone; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'focused', label: 'Focused' },
  { value: 'playful', label: 'Playful' },
  { value: 'testPrep', label: 'Test Prep' },
  { value: 'routine', label: 'Routine' },
]

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

interface LessonMessageGeneratorPanelProps {
  /** Applies the draft to the currently selected screen (editor only — never touches /display). */
  onApplyDraft: (draft: LessonMessageDraft) => void
  /** Creates a brand-new screen from the draft (editor only — never touches /display). */
  onSaveDraftAsNewScreen: (draft: LessonMessageDraft) => void
}

export function LessonMessageGeneratorPanel({
  onApplyDraft,
  onSaveDraftAsNewScreen,
}: LessonMessageGeneratorPanelProps) {
  const [form, setForm] = useState<LessonMessageInput>(defaultLessonMessageInput())
  const [materialsText, setMaterialsText] = useState('')
  const [mustIncludeText, setMustIncludeText] = useState('')
  const [avoidText, setAvoidText] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [draft, setDraft] = useState<LessonMessageDraft | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const settings = useAiProviderSettingsStore((s) => s.settings)
  const draftCounter = useAiProviderSettingsStore((s) => s.draftCounter)
  const setLastProviderStatus = useAiProviderSettingsStore((s) => s.setLastProviderStatus)
  const recordDraftGenerated = useAiProviderSettingsStore((s) => s.recordDraftGenerated)

  const showStatus = (message: string) => {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const input: LessonMessageInput = {
        ...form,
        materials: linesToList(materialsText),
        mustInclude: linesToList(mustIncludeText),
        avoid: linesToList(avoidText),
        teacherNotes: teacherNotes.trim() || undefined,
      }
      // Deterministic local mode is the default; a provider is only ever attempted
      // when the teacher has explicitly switched modes AND configured+enabled one
      // (see ProviderStatusControls / aiProviderConfig.ts). Generating a draft
      // never touches /display regardless of which path was used.
      let resultStatus: LessonMessageProviderStatus = 'disabled'
      const result = await generateLessonMessageDraft(input, {
        provider: buildConfiguredProvider(settings),
        settings,
        draftCounter,
        onStatusChange: (status) => {
          resultStatus = status
        },
      })
      setLastProviderStatus(resultStatus)
      const statusReflectsAnAttempt: LessonMessageProviderStatus[] = ['ready', 'error', 'timedOut']
      if (statusReflectsAnAttempt.includes(resultStatus)) {
        recordDraftGenerated()
      }
      setDraft(result)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleResetForm = () => {
    setForm(defaultLessonMessageInput())
    setMaterialsText('')
    setMustIncludeText('')
    setAvoidText('')
    setTeacherNotes('')
    setDraft(null)
  }

  const handleApply = () => {
    if (!draft) return
    onApplyDraft(draft)
    showStatus('Draft applied to the current screen. Review it, then use Send to Display when ready.')
  }

  const handleSaveAsNew = () => {
    if (!draft) return
    onSaveDraftAsNewScreen(draft)
    showStatus(`Draft saved as a new screen "${draft.title}". Review it, then use Send to Display when ready.`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-slate-100">Lesson Message Generator</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Deterministic local draft by default — no live AI call is made unless a provider is explicitly
          configured below. Generating a draft never sends anything to /display; review it below, then
          explicitly apply it to a screen and use Send to Display when ready.
        </p>
      </div>

      <ProviderStatusControls />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Subject</span>
          <select
            className={inputClass}
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value as LessonSubject }))}
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>{LESSON_SUBJECT_LABELS[s]}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Activity Type</span>
          <select
            className={inputClass}
            value={form.activityType}
            onChange={(e) => setForm((f) => ({ ...f, activityType: e.target.value as LessonActivityKind }))}
          >
            {ACTIVITY_OPTIONS.map((a) => (
              <option key={a} value={a}>{LESSON_ACTIVITY_LABELS[a]}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Tone</span>
          <select
            className={inputClass}
            value={form.tone}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value as LessonTone }))}
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Time Available (minutes, optional)</span>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.timeAvailableMinutes ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                timeAvailableMinutes: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>
      </div>

      {form.subject === 'custom' && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Custom Subject Label</span>
          <input
            className={inputClass}
            placeholder="e.g. Art"
            value={form.customSubjectLabel ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, customSubjectLabel: e.target.value }))}
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Lesson Title</span>
        <input
          className={inputClass}
          placeholder="e.g. Fractions"
          value={form.lessonTitle}
          onChange={(e) => setForm((f) => ({ ...f, lessonTitle: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Lesson Number (optional)</span>
        <input
          className={inputClass}
          placeholder="e.g. 5"
          value={form.lessonNumber ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, lessonNumber: e.target.value || undefined }))}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Objective (optional)</span>
        <input
          className={inputClass}
          placeholder="e.g. Add fractions with like denominators"
          value={form.objective ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value || undefined }))}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Materials (one per line, optional)</span>
        <textarea
          className={`${inputClass} leading-relaxed`}
          rows={3}
          placeholder={'Math notebook\nPencil'}
          value={materialsText}
          onChange={(e) => setMaterialsText(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Must Include (one per line, optional)</span>
        <textarea
          className={`${inputClass} leading-relaxed`}
          rows={2}
          value={mustIncludeText}
          onChange={(e) => setMustIncludeText(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Avoid (one per line, optional)</span>
        <textarea
          className={`${inputClass} leading-relaxed`}
          rows={2}
          value={avoidText}
          onChange={(e) => setAvoidText(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Teacher Notes (optional — teacher-only, never shown to students)</span>
        <textarea
          className={`${inputClass} leading-relaxed`}
          rows={2}
          value={teacherNotes}
          onChange={(e) => setTeacherNotes(e.target.value)}
        />
        {teacherNotes.trim() && (
          <p className="text-[10px] italic text-amber-300/80">
            These notes are for your context only and will not be projected or sent to /display.
          </p>
        )}
      </label>

      <div className="flex gap-2">
        <button type="button" className={primaryBtn} onClick={() => void handleGenerate()} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate Draft'}
        </button>
        <button type="button" className={secondaryBtn} onClick={handleResetForm}>
          Reset Form
        </button>
      </div>

      {statusMessage && (
        <p role="status" className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
          {statusMessage}
        </p>
      )}

      {draft ? (
        <div className="rounded-xl border border-cyan-400/30 bg-slate-900/70 p-3" data-lesson-draft-preview>
          <p className={labelClass}>Draft Preview — Student-Facing Content</p>
          <p className="mt-1 text-sm font-bold text-slate-100">{draft.title}</p>
          <p className="mt-1 text-xs text-slate-200">{draft.studentMessage}</p>

          {draft.materialsCard && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{draft.materialsCard.heading}</p>
              <ul className="mt-1 list-inside list-disc text-xs text-slate-300">
                {draft.materialsCard.sections.flatMap((s) => s.items).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{draft.checklistCard.heading}</p>
            <ul className="mt-1 list-inside list-disc text-xs text-slate-300">
              {draft.checklistCard.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {draft.suggestedTimer.kind !== 'none' && (
            <p className="mt-2 text-[11px] text-slate-400">
              Suggested timer: {draft.suggestedTimer.kind}
              {draft.suggestedTimer.minutes ? ` (${draft.suggestedTimer.minutes} min)` : ''}
            </p>
          )}

          <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-950/20 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
              Teacher Only — never shown on /display
            </p>
            <p className="mt-1 text-[11px] text-amber-100/80">{draft.teacherRationale}</p>
            {draft.warnings.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-[11px] text-amber-200/80">
                {draft.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primaryBtn} onClick={handleApply}>
              Apply Draft to Current Screen
            </button>
            <button type="button" className={secondaryBtn} onClick={handleSaveAsNew}>
              Save as New Screen
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Applying or saving only updates the editor. Sending to the projector is always a separate, explicit
            "Send to Display" action above.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-center text-[11px] text-slate-500">
          No draft yet. Fill in lesson context above and click "Generate Draft" to see a preview here.
        </p>
      )}
    </div>
  )
}
