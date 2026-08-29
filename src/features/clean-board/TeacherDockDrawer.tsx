import type { ReactNode } from 'react'
import { EDIT_DRAWER_TAB_LABELS } from './editLayout'
import type { CleanBoardEditLayoutMode, EditDrawerTab } from './editLayout'

interface TeacherDockDrawerProps {
  open: boolean
  onClose: () => void
  layoutMode: CleanBoardEditLayoutMode
  tabs: EditDrawerTab[]
  activeTab: EditDrawerTab
  onSelectTab: (tab: EditDrawerTab) => void
  children: ReactNode
}

/**
 * DB-Dock — the hidden-by-default Teacher Dock for /board-lab. Renders as a
 * right-side Drawer on wide viewports and a bottom Sheet on narrow ones
 * (mirroring the breakpoint `useCleanBoardEditLayoutMode` already applies to
 * the board itself), as an absolutely-positioned overlay so it never
 * permanently occupies canvas space — it only covers the board while open.
 */
export function TeacherDockDrawer({
  open,
  onClose,
  layoutMode,
  tabs,
  activeTab,
  onSelectTab,
  children,
}: TeacherDockDrawerProps) {
  const isSheet = layoutMode === 'responsivePanels'

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-slate-950/60 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        data-teacher-dock-backdrop
      />
      <div
        role="dialog"
        aria-label="Teacher Dock"
        aria-hidden={!open}
        className={`absolute z-40 flex flex-col overflow-hidden border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 ease-out ${
          open ? '' : 'pointer-events-none'
        } ${
          isSheet
            ? `inset-x-0 bottom-0 h-[70vh] max-h-[80vh] rounded-t-2xl border-t ${
                open ? 'translate-y-0' : 'translate-y-full'
              }`
            : `right-0 top-0 h-full w-full max-w-sm border-l ${
                open ? 'translate-x-0' : 'translate-x-full'
              }`
        }`}
        data-teacher-dock
        data-teacher-dock-layout={layoutMode}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Teacher Dock
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Teacher Dock"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            data-teacher-dock-close
          >
            ✕
          </button>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-800 px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              data-teacher-dock-tab={tab}
              data-active={tab === activeTab || undefined}
              className={`min-h-[44px] rounded-md px-2.5 py-2 text-xs font-semibold transition ${
                tab === activeTab
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {EDIT_DRAWER_TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}

export default TeacherDockDrawer
