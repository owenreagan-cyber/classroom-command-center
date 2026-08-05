import { useState, useMemo } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { countScreensByPack, DISPLAY_SCREEN_PACKS, filterScreensByPack, isValidPackId } from '../display-composer/screenPacks'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import type { DisplayScreen } from '../display-composer/types'
import { resolveDisplayBackground } from '../display-composer/backgroundStyles'

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500'

export function DisplayStudioThumbnailRail() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const { selectedScreenId, selectScreen, close } = useDisplayStudioUI()
  const [packFilter, setPackFilter] = useState('all')

  const allScreens = useMemo(
    () => order.map((id) => screens[id]).filter((s): s is DisplayScreen => Boolean(s)),
    [order, screens],
  )
  const packCounts = useMemo(() => countScreensByPack(allScreens), [allScreens])
  const visibleScreenIds = useMemo(() => {
    if (packFilter === 'all' || !isValidPackId(packFilter)) return order
    return filterScreensByPack(allScreens, packFilter).map((s) => s.id)
  }, [order, allScreens, packFilter])

  const activeId = selectedScreenId ?? order[0] ?? null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100">Screens</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            aria-label="Close Display Studio"
          >
            ✕
          </button>
        </div>
        <select
          className={`${inputClass} mt-2`}
          value={packFilter}
          onChange={(e) => setPackFilter(e.target.value)}
          aria-label="Filter screens by pack"
        >
          <option value="all">All ({allScreens.length})</option>
          {DISPLAY_SCREEN_PACKS.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.label} ({packCounts[pack.id] ?? 0})
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {visibleScreenIds.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-[11px] text-slate-500">
            No screens in this pack yet.
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          {visibleScreenIds.map((id) => {
            const screen = screens[id]
            if (!screen) return null
            const isSelected = id === activeId
            const isLive = id === activeScreenId
            const bg = resolveDisplayBackground(screen.background)
            return (
              <button
                key={id}
                type="button"
                data-display-screen-thumb={id}
                onClick={() => selectScreen(id)}
                className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] leading-tight transition ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className="mb-1.5 aspect-video w-full overflow-hidden rounded-md border border-slate-700"
                  style={{
                    backgroundImage: bg.backgroundImage,
                    backgroundColor: bg.backgroundColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="flex h-full items-center justify-center bg-gradient-to-b from-slate-950/45 to-slate-950/45 px-1 py-0.5">
                    <span className="text-[8px] font-semibold leading-tight text-slate-200">
                      {screen.title}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate">{screen.title}</span>
                  {isLive && <span className="ml-1 shrink-0 text-emerald-400">●</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-800 p-2">
        <button
          type="button"
          className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800"
          onClick={() => {
            const { createCustomScreen } = useDisplayComposerStore.getState()
            const newId = createCustomScreen('New Screen')
            selectScreen(newId)
          }}
        >
          + New Screen
        </button>
      </div>
    </div>
  )
}
