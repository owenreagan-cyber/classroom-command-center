import { useMemo, useState } from 'react'
import { SCREEN_META } from '../data/defaults'
import type { ClassWorkspace, ScreenId, VibePageId } from '../data/types'
import { getResourceUrlWarning, isValidResourceUrl } from '../lib/resourceUrl'
import { useBoardStore } from '../store/boardStore'

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

  const [newChecklistText, setNewChecklistText] = useState('')
  const [scopeToActive, setScopeToActive] = useState(true)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNote, setLinkNote] = useState('')

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
      note: linkNote.trim() || undefined,
      visibility: 'teacherOnly',
      screenId: scopeToActive ? activeScreen : undefined,
      pageId: scopeToActive && activePageId ? activePageId : undefined,
    })
    setLinkLabel('')
    setLinkUrl('')
    setLinkNote('')
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

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Material Launcher
        </h3>
        {scopedLinks.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            No resource links for this screen/page yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {scopedLinks.map((link) => {
              const warning = getResourceUrlWarning(link.url)
              const canOpen = isValidResourceUrl(link.url)
              return (
                <li
                  key={link.id}
                  className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
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
                        onChange={(event) =>
                          updateMaterialLink(link.id, { url: event.target.value })
                        }
                        placeholder="https://..."
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
                    <a
                      href={link.url.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-900/40"
                    >
                      Open
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
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
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            value={linkNote}
            onChange={(event) => setLinkNote(event.target.value)}
            placeholder="Optional note"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
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
