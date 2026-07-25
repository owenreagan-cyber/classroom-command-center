import { useMemo, useState } from 'react'
import type { ClassWorkspace, ScreenId, VibePageId } from '../../data/types'
import {
  MORNING_MESSAGE_SECTION_META,
  MORNING_MESSAGE_SECTION_ORDER,
  schedulePreviewFromHomeroomPages,
} from '../../data/morningMessage'
import type { MorningMessageTemplate } from '../../data/morningMessage'
import { useBoardStore } from '../../store/boardStore'
import { MorningMessageDisplay } from './MorningMessageDisplay'
import { openStudentDisplay } from '../../app/displayLaunch'

interface MorningMessageStudioPanelProps {
  activeScreen: ScreenId
  activePageId: VibePageId | null
  classWorkspaces: Record<ScreenId, ClassWorkspace | undefined>
}

export function MorningMessageStudioPanel({
  activeScreen,
  activePageId,
  classWorkspaces,
}: MorningMessageStudioPanelProps) {
  const morningMessage = useBoardStore((s) => s.morningMessage)
  const updateMorningMessageText = useBoardStore((s) => s.updateMorningMessageText)
  const updateMorningMessageBullets = useBoardStore((s) => s.updateMorningMessageBullets)
  const setMorningMessageSectionVisible = useBoardStore((s) => s.setMorningMessageSectionVisible)
  const setMorningMessageDateMode = useBoardStore((s) => s.setMorningMessageDateMode)
  const clearMorningMessage = useBoardStore((s) => s.clearMorningMessage)
  const restoreDefaultMorningMessage = useBoardStore((s) => s.restoreDefaultMorningMessage)
  const saveMorningMessageTemplate = useBoardStore((s) => s.saveMorningMessageTemplate)
  const applyMorningMessageTemplate = useBoardStore((s) => s.applyMorningMessageTemplate)
  const renameMorningMessageTemplate = useBoardStore((s) => s.renameMorningMessageTemplate)
  const deleteMorningMessageTemplate = useBoardStore((s) => s.deleteMorningMessageTemplate)
  const sendMorningMessageToDisplay = useBoardStore((s) => s.sendMorningMessageToDisplay)
  const setActiveScreen = useBoardStore((s) => s.setActiveScreen)
  const setActivePageId = useBoardStore((s) => s.setActivePageId)

  const [previewMode, setPreviewMode] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    greeting: true,
    mainMessage: true,
  })
  const [templateName, setTemplateName] = useState('')
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmOverwriteId, setConfirmOverwriteId] = useState<string | null>(null)

  const isHomeroomContext = activeScreen === 'homeroom'
  const onMorningMessagePage = activePageId === 'homeroom-morning-message'

  const lastSavedLabel = useMemo(() => {
    if (!morningMessage.lastUpdated) return 'Not saved yet'
    const d = new Date(morningMessage.lastUpdated)
    return `Last saved ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }, [morningMessage.lastUpdated])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const showStatus = (message: string) => {
    setStatus(message)
    window.setTimeout(() => setStatus(null), 4000)
  }

  const handleSaveTemplate = () => {
    if (confirmOverwriteId) {
      const result = saveMorningMessageTemplate(templateName, confirmOverwriteId)
      if (!result.ok) {
        showStatus(result.error ?? 'Could not save template.')
        return
      }
      setConfirmOverwriteId(null)
      setTemplateName('')
      showStatus('Template updated.')
      return
    }
    const result = saveMorningMessageTemplate(templateName)
    if (!result.ok) {
      showStatus(result.error ?? 'Could not save template.')
      return
    }
    setTemplateName('')
    showStatus('Template saved.')
  }

  const handleSendToDisplay = () => {
    sendMorningMessageToDisplay()
    const result = openStudentDisplay(window, window.location)
    if (result.ok) {
      showStatus('Morning Message sent to display. Open the display window for the projector.')
    } else {
      showStatus('Navigated to Morning Message page. Open Student Display from the Display panel.')
    }
  }

  const handleGoToMorningMessage = () => {
    setActiveScreen('homeroom')
    setActivePageId('homeroom-morning-message')
  }

  const handleFillSchedule = () => {
    const items = schedulePreviewFromHomeroomPages(classWorkspaces)
    updateMorningMessageBullets('schedulePreview', items)
    setMorningMessageSectionVisible('schedulePreview', true)
    showStatus('Schedule filled from homeroom pages.')
  }

  return (
    <section className="space-y-3" aria-label="Morning Message Studio">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Morning Message Studio
        </h2>
        <span className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Teacher Control
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">{lastSavedLabel}</p>

      {!isHomeroomContext && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          Morning Message displays on Homeroom.{' '}
          <button
            type="button"
            onClick={handleGoToMorningMessage}
            className="font-semibold underline underline-offset-2"
          >
            Go to Morning Message page
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPreviewMode((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            previewMode
              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100'
              : 'border-slate-600 bg-slate-900/70 text-slate-200 hover:border-slate-500'
          }`}
        >
          {previewMode ? 'Edit Mode' : 'Preview'}
        </button>
        <button
          type="button"
          onClick={handleSendToDisplay}
          className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-900/40"
        >
          Send to Display
        </button>
      </div>

      {previewMode ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Student preview
          </p>
          <div className="h-64 overflow-hidden rounded-lg bg-white/95">
            <MorningMessageDisplay content={morningMessage.current} mode="display" />
          </div>
        </div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {MORNING_MESSAGE_SECTION_ORDER.map((sectionId) => {
            const meta = MORNING_MESSAGE_SECTION_META.find((m) => m.id === sectionId)!
            const visible = morningMessage.current.visibility[sectionId]
            const isExpanded = expandedSections[sectionId] ?? false

            return (
              <div
                key={sectionId}
                className="rounded-xl border border-slate-700 bg-slate-900/60"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs font-semibold text-slate-200">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) =>
                        setMorningMessageSectionVisible(sectionId, e.target.checked)
                      }
                      className="rounded border-slate-600"
                    />
                    {meta.label}
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleSection(sectionId)}
                    className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                </div>

                {isExpanded && visible && (
                  <div className="space-y-2 border-t border-slate-700/80 px-3 py-2">
                    {meta.kind === 'date' ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="radio"
                            name="date-mode"
                            checked={morningMessage.current.useAutomaticDate}
                            onChange={() => setMorningMessageDateMode(true)}
                          />
                          Automatic (today)
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="radio"
                            name="date-mode"
                            checked={!morningMessage.current.useAutomaticDate}
                            onChange={() =>
                              setMorningMessageDateMode(
                                false,
                                new Date().toISOString().slice(0, 10),
                              )
                            }
                          />
                          Custom date
                        </label>
                        {!morningMessage.current.useAutomaticDate && (
                          <input
                            type="date"
                            value={morningMessage.current.dateOverride ?? ''}
                            onChange={(e) => setMorningMessageDateMode(false, e.target.value)}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                          />
                        )}
                      </div>
                    ) : meta.kind === 'bullets' ? (
                      <>
                        <textarea
                          value={(morningMessage.current.bullets[sectionId] ?? []).join('\n')}
                          onChange={(e) =>
                            updateMorningMessageBullets(
                              sectionId,
                              e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                            )
                          }
                          rows={3}
                          placeholder={meta.placeholder}
                          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                        />
                        {sectionId === 'schedulePreview' && (
                          <button
                            type="button"
                            onClick={handleFillSchedule}
                            className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300"
                          >
                            Fill from homeroom page titles
                          </button>
                        )}
                      </>
                    ) : (
                      <textarea
                        value={morningMessage.current.text[sectionId] ?? ''}
                        onChange={(e) => updateMorningMessageText(sectionId, e.target.value)}
                        rows={sectionId === 'mainMessage' ? 3 : 2}
                        placeholder={meta.placeholder}
                        className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2 border-t border-slate-800 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Templates
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
          />
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            className="shrink-0 rounded-lg border border-cyan-500/50 bg-cyan-950/40 px-2 py-1.5 text-xs font-semibold text-cyan-100 disabled:opacity-40"
          >
            Save
          </button>
        </div>
        <ul className="max-h-32 space-y-1 overflow-y-auto">
          {morningMessage.templates.map((template: MorningMessageTemplate) => (
            <li
              key={template.id}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/50 px-2 py-1.5"
            >
              {renameTarget === template.id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const result = renameMorningMessageTemplate(template.id, renameValue)
                      if (!result.ok) {
                        showStatus(result.error ?? 'Rename failed.')
                        return
                      }
                      setRenameTarget(null)
                      showStatus('Template renamed.')
                    }}
                    className="text-[10px] font-semibold text-cyan-400"
                  >
                    OK
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-200">
                    {template.name}
                    {morningMessage.selectedTemplateId === template.id && (
                      <span className="ml-1 text-slate-500">(active)</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      applyMorningMessageTemplate(template.id)
                      showStatus(`Applied "${template.name}".`)
                    }}
                    className="text-[10px] font-semibold text-emerald-400"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameTarget(template.id)
                      setRenameValue(template.name)
                    }}
                    className="text-[10px] font-semibold text-slate-400"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOverwriteId(template.id)}
                    className="text-[10px] font-semibold text-cyan-400"
                  >
                    Overwrite
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(template.id)}
                    className="text-[10px] font-semibold text-rose-400"
                  >
                    Del
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="rounded-xl border border-slate-600 bg-slate-900/70 px-2 py-2 text-xs font-semibold text-slate-200"
          >
            Clear today
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                clearMorningMessage()
                setConfirmClear(false)
                showStatus('Today\'s message cleared.')
              }}
              className="rounded-xl border border-rose-400/50 bg-rose-950/30 px-2 py-2 text-xs font-semibold text-rose-100"
            >
              Confirm clear
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-xl border border-slate-600 px-2 py-2 text-xs text-slate-400"
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            restoreDefaultMorningMessage()
            showStatus('Default message restored.')
          }}
          className="rounded-xl border border-slate-600 bg-slate-900/70 px-2 py-2 text-xs font-semibold text-slate-200"
        >
          Restore defaults
        </button>
      </div>

      {confirmOverwriteId && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100">
          Overwrite "{morningMessage.templates.find((t: MorningMessageTemplate) => t.id === confirmOverwriteId)?.name}" with
          today's message?
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTemplateName(
                  morningMessage.templates.find((t: MorningMessageTemplate) => t.id === confirmOverwriteId)?.name ?? '',
                )
                handleSaveTemplate()
              }}
              className="font-semibold underline"
            >
              Confirm overwrite
            </button>
            <button type="button" onClick={() => setConfirmOverwriteId(null)} className="text-slate-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-100">
          Delete template? Today's message will not be affected.
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                deleteMorningMessageTemplate(confirmDeleteId)
                setConfirmDeleteId(null)
                showStatus('Template deleted.')
              }}
              className="font-semibold underline"
            >
              Confirm delete
            </button>
            <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-slate-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {onMorningMessagePage && (
        <p className="text-[10px] text-slate-500">
          Canvas shows the live student-facing message for this page.
        </p>
      )}

      {status && (
        <p role="status" className="rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
          {status}
        </p>
      )}
    </section>
  )
}
