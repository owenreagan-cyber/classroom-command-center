import { memo, useMemo } from 'react'
import type { ScreenId, VibePageId } from '../../../data/types'
import { useBoardStore } from '../../../store/boardStore'
import { buildLessonPackage } from '../../omninote-bridge/types'
import { copyResourceForOmniNote, executeHandoff } from '../../omninote-bridge/handoff'
import { getResourcePresetMeta } from '../../../lib/resourcePresets'
import { useTeacherDockContext } from '../useTeacherDockContext'

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

export const OmniNoteToolPanel = memo(function OmniNoteToolPanel() {
  const { activeScreen, activePageId } = useTeacherDockContext()
  const resourceLinks = useBoardStore((s) => s.todayPrep.resourceLinks)

  const links = useMemo(
    () =>
      resourceLinks.filter(
        (link) =>
          matchesActiveContext(link.screenId, link.pageId, activeScreen, activePageId) &&
          Boolean(link.url?.trim()),
      ),
    [resourceLinks, activeScreen, activePageId],
  )

  const handleHandoff = async (link: (typeof links)[number]) => {
    const kind =
      link.preset === 'google-slides'
        ? ('slide-deck' as const)
        : link.preset === 'google-docs'
          ? ('worksheet' as const)
          : ('pdf' as const)
    const pkg = buildLessonPackage({
      title: link.label,
      subject: activeScreen,
      kind,
      webUrl: link.url,
    })
    const copied = await copyResourceForOmniNote(pkg)
    const result = executeHandoff({
      package: pkg,
      method: copied ? 'copy-link' : 'manual',
    })
    window.alert(result.message)
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-white">OmniNote Bridge</h2>
        <p className="mt-1 text-sm text-slate-400">
          Copy resource links for handoff to OmniNote on iPad. Level 1 uses manual open + copy.
        </p>
      </header>
      {links.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3 text-sm text-slate-400">
          No resource links on the active screen yet. Add materials in Today Prep or Board
          workspace.
        </p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const presetMeta = getResourcePresetMeta(link.preset ?? 'other')
            return (
              <li
                key={link.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-100">{link.label}</span>
                  <span className="rounded-md border border-slate-600 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    {presetMeta.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleHandoff(link)}
                  className="self-start rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-900/40"
                >
                  Open in OmniNote
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
})
