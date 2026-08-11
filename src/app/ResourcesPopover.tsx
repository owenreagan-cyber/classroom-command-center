import { useMemo } from 'react'
import { useBoardStore } from '../store/boardStore'

interface ResourcesPopoverProps {
  onOpenDashboard: () => void
  /** Open state is owned by the parent shell so it can close the sibling
   * Tools popover before opening this one — keeping the "single open
   * flyout at a time" guarantee even via keyboard activation. */
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourcesPopover({ onOpenDashboard, isOpen, onOpenChange }: ResourcesPopoverProps) {
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
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200 active:scale-[0.97]"
      >
        Resources
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2.5 w-72 rounded-2xl border border-white/[0.08] bg-slate-900/98 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Resources
            </h4>

            {screenResources.length === 0 ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[13px] font-medium text-slate-400/70">
                    No resources yet
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Add links, files, or materials in the Dashboard using the Material Launcher.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenDashboard()
                  }}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-200 active:scale-[0.98]"
                >
                  Open Dashboard
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <ul className="divide-y divide-white/[0.04]">
                  {screenResources.map((resource) => (
                    <li key={resource.id} className="py-2.5 first:pt-0 last:pb-0">
                      <p className="text-[13px] font-medium text-slate-300/80">
                        {resource.label}
                      </p>
                      {resource.note && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 line-clamp-1">
                          {resource.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false)
                    onOpenDashboard()
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-200 active:scale-[0.98]"
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
