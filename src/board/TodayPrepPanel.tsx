import { useMemo, useState } from 'react'
import { SCREEN_META } from '../data/defaults'
import type { ClassWorkspace, ResourceOpenPreset, ScreenId, VibePageId } from '../data/types'
import {
  DEFAULT_RESOURCE_OPEN_PRESET,
  getResourcePresetMeta,
  inferResourceOpenPresetFromUrl,
  RESOURCE_OPEN_PRESETS,
} from '../lib/resourcePresets'
import { copyResourceUrl, getResourceUrlWarning, isValidResourceUrl } from '../lib/resourceUrl'
import { buildLessonPackage } from '../features/omninote-bridge/types'
import { copyResourceForOmniNote, executeHandoff } from '../features/omninote-bridge/handoff'
import { useBoardStore } from '../store/boardStore'
import {
  CANONICAL_DAILY_BLOCKS,
  resolveBlockDisplayLabel,
  resolveCurriculumTrack,
} from '../data/routineSchedule'
import { getDailyBlockTimeline } from '../lib/routineEngine'

interface TodayPrepPanelProps {
  activeScreen: ScreenId
  activePageId: VibePageId | null
  classWorkspaces: Record<ScreenId, ClassWorkspace | undefined>
}

function matchesActiveContext(
  screenId: ScreenId | undefined,
  pageId: VibePageId | undefined,
  activeScreen: ScreenId,
  activePageId: VibePageId | null,
): boolean {
  if (!screenId && !pageId) return true
  if (screenId && screenId !== activeScreen) return false
  if (pageId && pageId !== activePageId) return false
  return true
}

function ResourcePresetSelect({
  value,
  onChange,
  id,
}: {
  value: ResourceOpenPreset
  onChange: (preset: ResourceOpenPreset) => void
  id?: string
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as ResourceOpenPreset)}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      aria-label="Resource type preset"
    >
      {RESOURCE_OPEN_PRESETS.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.label}
        </option>
      ))}
    </select>
  )
}

export function TodayPrepPanel({
  activeScreen,
  activePageId,
  classWorkspaces,
}: TodayPrepPanelProps) {
  const todayPrep = useBoardStore((state) => state.todayPrep)
  const addPrepChecklistItem = useBoardStore((state) => state.addPrepChecklistItem)
  const updatePrepChecklistItem = useBoardStore((state) => state.updatePrepChecklistItem)
  const removePrepChecklistItem = useBoardStore((state) => state.removePrepChecklistItem)
  const addMaterialLink = useBoardStore((state) => state.addMaterialLink)
  const updateMaterialLink = useBoardStore((state) => state.updateMaterialLink)
  const removeMaterialLink = useBoardStore((state) => state.removeMaterialLink)
  const setNowShowingResourceId = useBoardStore((state) => state.setNowShowingResourceId)
  const clearNowShowing = useBoardStore((state) => state.clearNowShowing)
  const nowShowingResourceId = todayPrep.nowShowingResourceId ?? null

  const [newChecklistText, setNewChecklistText] = useState('')
  const [scopeToActive, setScopeToActive] = useState(true)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNote, setLinkNote] = useState('')
  const [linkPreset, setLinkPreset] = useState<ResourceOpenPreset>(DEFAULT_RESOURCE_OPEN_PRESET)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const addFormPresetMeta = getResourcePresetMeta(linkPreset)

  const now = useMemo(() => new Date(), [])
  const curriculumTrack = useMemo(() => resolveCurriculumTrack(now), [now])
  const blockTimeline = useMemo(() => getDailyBlockTimeline(now), [now])
  const historyScienceBlock = CANONICAL_DAILY_BLOCKS.find((block) => block.id === 'history-science')
  const todayHistoryScienceLabel = historyScienceBlock
    ? resolveBlockDisplayLabel(historyScienceBlock, curriculumTrack)
    : null

  const screenLabel =
    SCREEN_META.find((screen) => screen.id === activeScreen)?.label ?? activeScreen
  const workspace = classWorkspaces[activeScreen]
  const activePage =
    workspace?.pages.find((page) => page.id === activePageId) ?? workspace?.pages[0] ?? null

  const scopedChecklist = useMemo(
    () =>
      todayPrep.checklistItems.filter((item) =>
        matchesActiveContext(item.screenId, item.pageId, activeScreen, activePageId),
      ),
    [todayPrep.checklistItems, activeScreen, activePageId],
  )

  const scopedLinks = useMemo(
    () =>
      todayPrep.resourceLinks.filter((link) =>
        matchesActiveContext(link.screenId, link.pageId, activeScreen, activePageId),
      ),
    [todayPrep.resourceLinks, activeScreen, activePageId],
  )

  const incompleteCount = scopedChecklist.filter((item) => !item.completed).length
  const invalidLinkCount = scopedLinks.filter((link) => !isValidResourceUrl(link.url)).length
  const nowShowingLink = todayPrep.resourceLinks.find((link) => link.id === nowShowingResourceId)

  const handleAddChecklistItem = () => {
    const text = newChecklistText.trim()
    if (!text) return
    addPrepChecklistItem(
      text,
      scopeToActive ? { screenId: activeScreen, pageId: activePageId ?? undefined } : undefined,
    )
    setNewChecklistText('')
  }

  const handleAddLink = () => {
    const label = linkLabel.trim()
    if (!label) return
    addMaterialLink({
      label,
      url: linkUrl.trim(),
      preset: linkPreset,
      note: linkNote.trim() || undefined,
      visibility: 'teacherOnly',
      screenId: scopeToActive ? activeScreen : undefined,
      pageId: scopeToActive && activePageId ? activePageId : undefined,
    })
    setLinkLabel('')
    setLinkUrl('')
    setLinkNote('')
    setLinkPreset(DEFAULT_RESOURCE_OPEN_PRESET)
  }

  const handleLinkUrlChange = (nextUrl: string, currentPreset: ResourceOpenPreset) => {
    const inferred = inferResourceOpenPresetFromUrl(nextUrl)
    if (
      inferred &&
      (currentPreset === DEFAULT_RESOURCE_OPEN_PRESET || currentPreset === 'other')
    ) {
      setLinkPreset(inferred)
    }
  }

  const handleCopyLink = async (url: string) => {
    const result = await copyResourceUrl(navigator.clipboard, url)
    if (result.ok) {
      setCopyFeedback('Link copied')
      window.setTimeout(() => setCopyFeedback(null), 1800)
      return
    }
    setCopyFeedback('Copy unavailable — use Open With instead')
    window.setTimeout(() => setCopyFeedback(null), 2200)
  }

  const handleOpenInOmniNote = async (link: { label: string; url: string; preset?: ResourceOpenPreset }) => {
    const kind = link.preset === 'google-slides' ? 'slide-deck' as const
      : link.preset === 'google-docs' ? 'worksheet' as const
      : 'pdf' as const
    const pkg = buildLessonPackage({
      title: link.label,
      subject: activeScreen,
      kind,
      webUrl: link.url,
    })
    const copied = await copyResourceForOmniNote(pkg)
    const result = executeHandoff({ package: pkg, method: copied ? 'copy-link' : 'manual' })
    setCopyFeedback(result.message)
    window.setTimeout(() => setCopyFeedback(null), 3000)
  }

  return (
    <section className="space-y-4" aria-label="Today Prep and Material Launcher">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Today Prep
          </h2>
          <span className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Teacher Control
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Daily prep checklist and material links for the active class/page.
        </p>
      </div>

      <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
          Active context
        </p>
        <p className="mt-1 text-sm font-semibold text-white">{screenLabel}</p>
        <p className="text-xs text-slate-300">
          {activePage ? activePage.title : 'No vibe page selected'}
        </p>
        <p className="mt-1.5 text-[10px] uppercase tracking-wide text-slate-500">
          Track {curriculumTrack}
          {todayHistoryScienceLabel ? ` · Today: ${todayHistoryScienceLabel}` : ''}
          {blockTimeline.currentBlock
            ? ` · Now: ${resolveBlockDisplayLabel(blockTimeline.currentBlock, curriculumTrack)}`
            : ''}
        </p>
        {(incompleteCount > 0 || invalidLinkCount > 0) && (
          <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
            {incompleteCount > 0 && (
              <li>{incompleteCount} prep item(s) still open for this context.</li>
            )}
            {invalidLinkCount > 0 && (
              <li>{invalidLinkCount} resource link(s) need a valid URL.</li>
            )}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Prep checklist
        </h3>
        {scopedChecklist.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            No checklist items for this screen/page yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {scopedChecklist.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    updatePrepChecklistItem(item.id, { completed: !item.completed })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  aria-label={`Mark "${item.text}" complete`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-relaxed ${
                      item.completed ? 'text-slate-500 line-through' : 'text-slate-100'
                    }`}
                  >
                    {item.text}
                  </p>
                  {(item.screenId || item.pageId) && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                      Scoped to {item.screenId ?? 'any screen'}
                      {item.pageId ? ` / ${item.pageId}` : ''}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePrepChecklistItem(item.id)}
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-rose-300/80 hover:text-rose-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <input
            type="text"
            value={newChecklistText}
            onChange={(event) => setNewChecklistText(event.target.value)}
            placeholder="Add prep reminder..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={scopeToActive}
              onChange={(event) => setScopeToActive(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500"
            />
            Scope new items to active screen/page
          </label>
          <button
            type="button"
            onClick={handleAddChecklistItem}
            disabled={!newChecklistText.trim()}
            className="w-full rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add checklist item
          </button>
        </div>
      </div>

      <div className="space-y-2" aria-label="Open With">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Material Launcher
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Open With presets for lesson materials — opens safely in a new tab from teacher
              control only.
            </p>
          </div>
          {nowShowingLink && (
            <button
              type="button"
              onClick={() => clearNowShowing()}
              className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 transition hover:bg-amber-900/40"
            >
              Clear Now Showing
            </button>
          )}
        </div>
        {nowShowingLink && (
          <p
            role="status"
            className="rounded-xl border border-cyan-400/30 bg-cyan-950/25 px-3 py-2 text-xs text-cyan-100/90"
          >
            On student display: <span className="font-semibold">{nowShowingLink.label}</span>
          </p>
        )}
        {scopedLinks.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            No resource links for this screen/page yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {scopedLinks.map((link) => {
              const preset = link.preset ?? DEFAULT_RESOURCE_OPEN_PRESET
              const presetMeta = getResourcePresetMeta(preset)
              const warning = getResourceUrlWarning(link.url)
              const canOpen = isValidResourceUrl(link.url)
              const isNowShowing = link.id === nowShowingResourceId
              return (
                <li
                  key={link.id}
                  className={`space-y-2 rounded-xl border px-3 py-2.5 ${
                    isNowShowing
                      ? 'border-cyan-400/50 bg-cyan-950/25'
                      : 'border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-slate-600 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                          {presetMeta.label}
                        </span>
                        {isNowShowing && (
                          <span className="rounded-md border border-cyan-400/40 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">
                            Now Showing
                          </span>
                        )}
                        {(link.screenId || link.pageId) && (
                          <span className="text-[10px] uppercase tracking-wide text-slate-500">
                            Scoped
                          </span>
                        )}
                      </div>
                      <ResourcePresetSelect
                        value={preset}
                        onChange={(nextPreset) =>
                          updateMaterialLink(link.id, { preset: nextPreset })
                        }
                      />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(event) =>
                          updateMaterialLink(link.id, { label: event.target.value })
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm font-semibold text-slate-100"
                        aria-label="Resource label"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) => {
                          const nextUrl = event.target.value
                          const inferred = inferResourceOpenPresetFromUrl(nextUrl)
                          const updates: { url: string; preset?: ResourceOpenPreset } = {
                            url: nextUrl,
                          }
                          if (
                            inferred &&
                            (preset === DEFAULT_RESOURCE_OPEN_PRESET || preset === 'other')
                          ) {
                            updates.preset = inferred
                          }
                          updateMaterialLink(link.id, updates)
                        }}
                        placeholder={presetMeta.placeholder}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                        aria-label="Resource URL"
                      />
                      {link.note !== undefined && (
                        <input
                          type="text"
                          value={link.note}
                          onChange={(event) =>
                            updateMaterialLink(link.id, { note: event.target.value })
                          }
                          placeholder="Optional note"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-500"
                          aria-label="Resource note"
                        />
                      )}
                      {!link.note && (
                        <button
                          type="button"
                          onClick={() => updateMaterialLink(link.id, { note: '' })}
                          className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
                        >
                          Add note
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterialLink(link.id)}
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-rose-300/80 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                  {warning && (
                    <p
                      role="status"
                      className="rounded-lg border border-amber-400/30 bg-amber-950/20 px-2 py-1.5 text-xs text-amber-100/90"
                    >
                      {warning}
                    </p>
                  )}
                  {canOpen && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={link.url.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-900/40"
                        aria-label={`Open With ${presetMeta.label}: ${link.label}`}
                      >
                        Open With
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleCopyLink(link.url)}
                        className="inline-flex rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleOpenInOmniNote(link)}
                        className="inline-flex rounded-lg border border-violet-400/40 bg-violet-950/30 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-900/40"
                        aria-label={`Open in OmniNote: ${link.label}`}
                      >
                        Open in OmniNote
                      </button>
                      {isNowShowing ? (
                        <span className="inline-flex rounded-lg border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                          On Display
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNowShowingResourceId(link.id)}
                          className="inline-flex rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/40"
                        >
                          Show on Display
                        </button>
                      )}
                    </div>
                  )}
                  {!canOpen && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isNowShowing ? (
                        <span className="inline-flex rounded-lg border border-cyan-400/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                          On Display
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNowShowingResourceId(link.id)}
                          disabled={!link.label.trim()}
                          className="inline-flex rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Show on Display
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {copyFeedback && (
          <p role="status" className="text-xs text-slate-400">
            {copyFeedback}
          </p>
        )}
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <ResourcePresetSelect
            value={linkPreset}
            onChange={setLinkPreset}
            id="open-with-add-preset"
          />
          <input
            type="text"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="Resource label"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value)
              handleLinkUrlChange(event.target.value, linkPreset)
            }}
            placeholder={addFormPresetMeta.placeholder}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            value={linkNote}
            onChange={(event) => setLinkNote(event.target.value)}
            placeholder="Optional note"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          {getResourceUrlWarning(linkUrl) && linkUrl.trim() && (
            <p
              role="status"
              className="rounded-lg border border-amber-400/30 bg-amber-950/20 px-2 py-1.5 text-xs text-amber-100/90"
            >
              {getResourceUrlWarning(linkUrl)}
            </p>
          )}
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!linkLabel.trim()}
            className="w-full rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add resource link
          </button>
        </div>
      </div>
    </section>
  )
}
