import { useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'

interface ResourcesPopoverProps {
  onOpenDashboard: () => void
}

export function ResourcesPopover({ onOpenDashboard }: ResourcesPopoverProps) {
  const [open, setOpen] = useState(false)
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const resourceLinks = useBoardStore((s) => s.todayPrep.resourceLinks)

  const screenResources = useMemo(
    () => resourceLinks.filter((link) => link.screenId === activeScreen),
    [resourceLinks, activeScreen],
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-500/80 hover:bg-slate-800/80 hover:text-slate-200 active:scale-[0.97]"
      >
        Resources
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2.5 w-72 rounded-2xl border border-white/[0.1] bg-slate-900/95 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Resources
            </h4>

            {screenResources.length === 0 ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-400/80">
                  No linked resources for this block.
                </p>
                <p className="text-[11px] text-slate-500">
                  Add resources in the Dashboard using the Material Launcher.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenDashboard()
                  }}
                  className="mt-0.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"
                >
                  Open Dashboard
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <ul className="divide-y divide-white/[0.06]">
                  {screenResources.map((resource) => (
                    <li key={resource.id} className="py-2 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-200">{resource.label}</p>
                      {resource.note && (
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                          {resource.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenDashboard()
                  }}
                  className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"
                >
                  Open Dashboard
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
