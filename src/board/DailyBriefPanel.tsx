import { useState, useEffect } from 'react'
import type { ScreenId, ScreenContents, VoiceLevel, NoiseTrackerId } from '../data/types'
import { SCREEN_META } from '../data/defaults'
import { DAILY_BRIEF_TEMPLATES } from '../data/dailyBriefTemplates'
import { getNoiseTrackerIdForScreen } from '../lib/noiseTowers'

interface DailyBriefPanelProps {
  activeScreen: ScreenId
  contents: ScreenContents
  onContentsChange: (contents: ScreenContents) => void
  onNoiseVoiceLevelChange: (trackerId: NoiseTrackerId, voiceLevel: VoiceLevel) => void
}

const LOCAL_STORAGE_KEY = 'cc_daily_brief_draft'

function getSavedDraft() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to parse saved draft from localStorage', e)
  }
  return null
}

export function DailyBriefPanel({
  activeScreen,
  contents,
  onContentsChange,
  onNoiseVoiceLevelChange,
}: DailyBriefPanelProps) {
  const [draftData] = useState(() => getSavedDraft() || {})

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(draftData.selectedTemplateId || '')
  const [displayTitle, setDisplayTitle] = useState(draftData.displayTitle || '')
  const [voiceLevel, setVoiceLevel] = useState<VoiceLevel>(draftData.voiceLevel || 'off')
  const [mainInstruction, setMainInstruction] = useState(draftData.mainInstruction || '')
  const [checklist, setChecklist] = useState(draftData.checklist || '')
  const [materialsOut, setMaterialsOut] = useState(draftData.materialsOut || '')
  const [materialsAway, setMaterialsAway] = useState(draftData.materialsAway || '')
  const [smartTvReminder, setSmartTvReminder] = useState(draftData.smartTvReminder || '')
  const [lessonObjective, setLessonObjective] = useState(draftData.lessonObjective || '')
  const [successCriteria, setSuccessCriteria] = useState(draftData.successCriteria || '')
  const [vocabularyTerms, setVocabularyTerms] = useState(draftData.vocabularyTerms || '')
  const [optionalTeacherNote, setOptionalTeacherNote] = useState(draftData.optionalTeacherNote || '')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null)

  // Save draft to localStorage whenever fields change
  useEffect(() => {
    const draft = {
      selectedTemplateId,
      displayTitle,
      voiceLevel,
      mainInstruction,
      checklist,
      materialsOut,
      materialsAway,
      smartTvReminder,
      lessonObjective,
      successCriteria,
      vocabularyTerms,
      optionalTeacherNote,
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft))
  }, [
    selectedTemplateId,
    displayTitle,
    voiceLevel,
    mainInstruction,
    checklist,
    materialsOut,
    materialsAway,
    smartTvReminder,
    lessonObjective,
    successCriteria,
    vocabularyTerms,
    optionalTeacherNote,
  ])

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return

    const template = DAILY_BRIEF_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    setDisplayTitle(template.displayTitle || '')
    setVoiceLevel(template.voiceLevel || 'off')
    setMainInstruction(template.mainInstruction || '')
    setChecklist(template.checklist ? template.checklist.join('\n') : '')
    setMaterialsOut(template.materialsOut ? template.materialsOut.join('\n') : '')
    setMaterialsAway(template.materialsAway ? template.materialsAway.join('\n') : '')
    setSmartTvReminder(template.smartTvReminder || '')
    setLessonObjective(template.lessonObjective || '')
    setSuccessCriteria(template.successCriteria ? template.successCriteria.join('\n') : '')
    setVocabularyTerms(template.vocabularyTerms ? template.vocabularyTerms.join('\n') : '')
    setOptionalTeacherNote(template.optionalTeacherNote || '')

    // Show feedback that template is previewed
    setApplyFeedback(`Loaded "${template.name}" template preview!`)
    setTimeout(() => setApplyFeedback(null), 3000)
  };

  const activeScreenMeta = SCREEN_META.find((s) => s.id === activeScreen)
  const activeScreenLabel = activeScreenMeta ? activeScreenMeta.label : activeScreen

  const handleApply = () => {
    const draftChecklist = checklist.split('\n').map((line: string) => line.trim()).filter(Boolean)
    const draftMaterialsOut = materialsOut.split('\n').map((line: string) => line.trim()).filter(Boolean)
    const draftMaterialsAway = materialsAway.split('\n').map((line: string) => line.trim()).filter(Boolean)

    const next = structuredClone(contents)

    switch (activeScreen) {
      case 'homeroom': {
        if (displayTitle) next.homeroom.remindersTitle = displayTitle
        next.homeroom.reminders = draftChecklist
        if (mainInstruction) next.homeroom.doNow = mainInstruction
        next.homeroom.materials.haveOut = draftMaterialsOut
        next.homeroom.materials.putAway = draftMaterialsAway
        break
      }
      case 'math': {
        if (displayTitle) next.math.lessonTitle = displayTitle
        else if (mainInstruction) next.math.lessonTitle = mainInstruction
        next.math.materials.haveOut = draftMaterialsOut
        next.math.materials.putAway = draftMaterialsAway
        if (smartTvReminder) next.math.timerNote = smartTvReminder
        const draftSuccessCriteria = successCriteria.split('\n').map((line: string) => line.trim()).filter(Boolean)
        const draftVocabEntries = vocabularyTerms.split('\n').map((line: string) => {
          const parts = line.split(':')
          return parts.length > 1
            ? { term: parts[0].trim(), definition: parts.slice(1).join(':').trim() }
            : { term: line.trim() }
        }).filter((e: { term: string; definition?: string }) => e.term)

        if (next.math.lesson && lessonObjective) {
          next.math.lesson.objective = lessonObjective
        }
        if (next.math.lesson && draftSuccessCriteria.length > 0) {
          next.math.lesson.successCriteria = draftSuccessCriteria
        }
        if (next.math.vocabulary && draftVocabEntries.length > 0) {
          next.math.vocabulary.entries = draftVocabEntries
        }
        break
      }
      case 'reading': {
        if (displayTitle) next.reading.lessonTitle = displayTitle
        else if (mainInstruction) next.reading.lessonTitle = mainInstruction
        next.reading.materials.haveOut = draftMaterialsOut
        next.reading.materials.putAway = draftMaterialsAway
        if (smartTvReminder) next.reading.timerNote = smartTvReminder
        if (optionalTeacherNote) {
          next.reading.readyPosition.steps = optionalTeacherNote.split('\n').map((line: string) => line.trim()).filter(Boolean)
        }

        const draftSuccessCriteria = successCriteria.split('\n').map((line: string) => line.trim()).filter(Boolean)
        const draftVocabEntries = vocabularyTerms.split('\n').map((line: string) => {
          const parts = line.split(':')
          return parts.length > 1
            ? { term: parts[0].trim(), definition: parts.slice(1).join(':').trim() }
            : { term: line.trim() }
        }).filter((e: { term: string; definition?: string }) => e.term)

        if (next.reading.lesson && lessonObjective) {
          next.reading.lesson.objective = lessonObjective
        }
        if (next.reading.lesson && draftSuccessCriteria.length > 0) {
          next.reading.lesson.successCriteria = draftSuccessCriteria
        }
        if (next.reading.vocabulary && draftVocabEntries.length > 0) {
          next.reading.vocabulary.entries = draftVocabEntries
        }
        break
      }
      case 'snack-lunch': {
        if (displayTitle) next['snack-lunch'].title = displayTitle
        if (draftChecklist.length > 0) next['snack-lunch'].routine = draftChecklist
        if (draftMaterialsAway.length > 0) next['snack-lunch'].cleanupReminders = draftMaterialsAway
        if (smartTvReminder) next['snack-lunch'].phaseNote = smartTvReminder
        break
      }
      case 'ready-position': {
        if (displayTitle) next['ready-position'].title = displayTitle
        if (draftChecklist.length > 0) next['ready-position'].steps = draftChecklist
        if (mainInstruction) next['ready-position'].compactLine = mainInstruction
        break
      }
      default: {
        const subject = next[activeScreen]
        if (subject) {
          if (displayTitle) subject.title = displayTitle
          if (mainInstruction) subject.focusTask = mainInstruction
          if (draftChecklist.length > 0) subject.agenda = draftChecklist
          subject.materials.haveOut = draftMaterialsOut
          subject.materials.putAway = draftMaterialsAway
          if (smartTvReminder) subject.teacherHint = smartTvReminder

          const draftSuccessCriteria = successCriteria.split('\n').map((line: string) => line.trim()).filter(Boolean)
          const draftVocabEntries = vocabularyTerms.split('\n').map((line: string) => {
            const parts = line.split(':')
            return parts.length > 1
              ? { term: parts[0].trim(), definition: parts.slice(1).join(':').trim() }
              : { term: line.trim() }
          }).filter((e: { term: string; definition?: string }) => e.term)

          if (subject.lesson && lessonObjective) {
            subject.lesson.objective = lessonObjective
          }
          if (subject.lesson && draftSuccessCriteria.length > 0) {
            subject.lesson.successCriteria = draftSuccessCriteria
          }
          if (subject.vocabulary && draftVocabEntries.length > 0) {
            subject.vocabulary.entries = draftVocabEntries
          }
        }
        break
      }
    }

    onContentsChange(next)

    // Update the voice tracker state
    const trackerId = getNoiseTrackerIdForScreen(activeScreen)
    if (trackerId) {
      onNoiseVoiceLevelChange(trackerId, voiceLevel)
    }

    setApplyFeedback(`Applied successfully to ${activeScreenLabel}!`)
    setTimeout(() => setApplyFeedback(null), 3000)
  }

  const handleClear = () => {
    setSelectedTemplateId('')
    setDisplayTitle('')
    setVoiceLevel('off')
    setMainInstruction('')
    setChecklist('')
    setMaterialsOut('')
    setMaterialsAway('')
    setSmartTvReminder('')
    setOptionalTeacherNote('')
    setApplyFeedback('Cleared draft form.')
    setTimeout(() => setApplyFeedback(null), 3000)
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Daily Brief & Routines
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Quickly fill screen widgets using template presets or edit below. Changes save locally in real-time.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
          Saved Locally
        </span>
      </div>

      {/* Routine Template Selection */}
      <div className="space-y-1.5">
        <label htmlFor="brief-template-select" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
          Select Routine Template
        </label>
        <select
          id="brief-template-select"
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
        >
          <option value="">-- Manual Setup / Customize --</option>
          {DAILY_BRIEF_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.optionalTargetScreenSuggestion ? `(Target: ${t.optionalTargetScreenSuggestion})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Draft Workspace Form */}
      <div className="space-y-3 pt-1 border-t border-slate-800/60">
        <div className="space-y-1">
          <label htmlFor="brief-display-title" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
            Display Title
          </label>
          <input
            id="brief-display-title"
            type="text"
            value={displayTitle}
            onChange={(e) => setDisplayTitle(e.target.value)}
            placeholder="e.g. Morning Routine, Math Setup..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
          />
        </div>

        {/* Voice Level expectations Group */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
            Voice Expectation
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(['off', 'silent', 'whisper', 'normal'] as const).map((level) => {
              const active = voiceLevel === level
              const colorClasses = {
                off: active ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900',
                silent: active ? 'bg-rose-950 text-rose-100 border-rose-500/70' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-rose-300',
                whisper: active ? 'bg-amber-950 text-amber-100 border-amber-500/70' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-amber-300',
                normal: active ? 'bg-emerald-950 text-emerald-100 border-emerald-500/70' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-emerald-300',
              }
              const labels = { off: 'Off', silent: 'Silent', whisper: 'Whisper', normal: 'Normal' }

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setVoiceLevel(level)}
                  className={`rounded-lg border py-1.5 text-xs font-semibold text-center transition focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${colorClasses[level]}`}
                >
                  {labels[level]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="brief-main-instruction" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
            Main Instruction / Do Now
          </label>
          <textarea
            id="brief-main-instruction"
            rows={2}
            value={mainInstruction}
            onChange={(e) => setMainInstruction(e.target.value)}
            placeholder="What should students do first?"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="brief-checklist" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
            Checklist / Agenda Items (one per line)
          </label>
          <textarea
            id="brief-checklist"
            rows={3}
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
            placeholder="Item 1&#10;Item 2"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-y"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="brief-materials-out" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
            Materials Out (one per line)
          </label>
          <textarea
            id="brief-materials-out"
            rows={2}
            value={materialsOut}
            onChange={(e) => setMaterialsOut(e.target.value)}
            placeholder="Reading book&#10;Pencil"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-y"
          />
        </div>

        {/* Advanced Toggable Fields */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 focus:outline-none flex items-center gap-1 py-1"
          >
            {showAdvanced ? 'Hide Additional Fields ▲' : 'Show Additional Fields (Smart TV, Lesson Goal, Vocab...) ▼'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-slate-800/40">
            <div className="space-y-1">
              <label htmlFor="brief-lesson-obj" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Lesson Objective / I Can...
              </label>
              <input
                id="brief-lesson-obj"
                type="text"
                value={lessonObjective}
                onChange={(e) => setLessonObjective(e.target.value)}
                placeholder="Learning target..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brief-success-criteria" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Success Criteria (one per line)
              </label>
              <textarea
                id="brief-success-criteria"
                rows={2}
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder="I can explain my work...&#10;I can show proof..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-y"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brief-vocab-terms" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Vocabulary (term: definition per line)
              </label>
              <textarea
                id="brief-vocab-terms"
                rows={2}
                value={vocabularyTerms}
                onChange={(e) => setVocabularyTerms(e.target.value)}
                placeholder="hypothesis: an educated guess&#10;variable"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-y"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brief-materials-away" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Materials Away (one per line)
              </label>
              <textarea
                id="brief-materials-away"
                rows={2}
                value={materialsAway}
                onChange={(e) => setMaterialsAway(e.target.value)}
                placeholder="Math books&#10;Backpacks"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-y"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brief-smart-tv" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Smart TV Reminder / Banner Note
              </label>
              <input
                id="brief-smart-tv"
                type="text"
                value={smartTvReminder}
                onChange={(e) => setSmartTvReminder(e.target.value)}
                placeholder="Banner announcement or subtitle..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="brief-teacher-note" className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">
                Ready Note / Teacher Tips
              </label>
              <textarea
                id="brief-teacher-note"
                rows={2}
                value={optionalTeacherNote}
                onChange={(e) => setOptionalTeacherNote(e.target.value)}
                placeholder="Ready Position cues or private reminders..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60">
        <button
          type="button"
          onClick={handleApply}
          className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-center text-sm font-bold text-slate-950 hover:bg-cyan-400 transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          Apply Brief to {activeScreenLabel} Board
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition focus:outline-none"
          >
            Clear Draft
          </button>
        </div>

        {applyFeedback && (
          <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-center text-xs text-cyan-400 animate-pulse font-medium">
            {applyFeedback}
          </div>
        )}
      </div>
    </section>
  )
}
