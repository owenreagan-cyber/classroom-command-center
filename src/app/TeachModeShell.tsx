import { useCallback, useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { CleanClassroomScreenPreview } from './CleanClassroomScreenPreview'
import { QuickToolsPopover } from './QuickToolsPopover'
import { ResourcesPopover } from './ResourcesPopover'
import { openStudentDisplay } from './displayLaunch'
import type { AppMode } from '../data/types'

const SCREEN_LABELS: Record<string, string> = {
  homeroom: 'Morning Arrival',
  'ready-position': 'Ready Position',
  snack: 'Snack',
  lunch: 'Lunch',
  recess: 'Recess',
  'pack-up': 'Pack Up',
  'social-studies': 'Social Studies',
}

const ROUTINE_BANNERS: Record<string, string> = {
  homeroom: 'Homeroom · Silent Work until Math',
  math: 'Math · Focused Problem Solving',
  reading: 'Reading · Independent Reading',
  writing: 'Writing · Quiet Workshop',
  science: 'Science · Hands-On Investigation',
  'social-studies': 'Social Studies · Collaborative Discussion',
  spelling: 'Spelling · Word Study',
  assessment: 'Assessment · Silent Testing',
  centers: 'Group Work · Rotating Stations',
  snack: 'Snack · Quiet Eating',
  lunch: 'Lunch · Cafeteria Routine',
  recess: 'Recess · Outdoor Play',
  'ready-position': 'Ready Position · Show What You Need',
  homework: 'Homework · Wrap Up Assignments',
  'pack-up': 'Pack Up · End of Day Routine',
}

/** Full Teach Mode shell — calm, presentation-first, classroom-ready.
 *  Does NOT render BoardWorkspace, BoardFrame, TeacherCommandDock,
 *  or any edit/studio chrome. The classroom preview owns the single
 *  on-screen clock — this shell has no clock of its own to avoid
 *  showing the time twice.
 *
 *  Popover state is owned here (not inside each popover) so opening
 *  one always closes the other, including via keyboard activation. */
export function TeachModeShell() {
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const setMode = useBoardStore((state) => state.setMode)
  const navigateToPreviousPage = useBoardStore((state) => state.navigateToPreviousPage)
  const navigateToNextPage = useBoardStore((state) => state.navigateToNextPage)

  const [openPopover, setOpenPopover] = useState<'resources' | 'tools' | null>(null)

  const screenLabel = useMemo(() => {
    if (SCREEN_LABELS[activeScreen]) return SCREEN_LABELS[activeScreen]
    const word = activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1).replace(/-/g, ' ')
    if (word === 'Social studies') return 'Social Studies'
    return word
  }, [activeScreen])

  const routineBanner = useMemo(
    () => ROUTINE_BANNERS[activeScreen] ?? screenLabel,
    [activeScreen, screenLabel],
  )

  const handlePresent = useCallback(() => {
    openStudentDisplay(window, window.location)
  }, [])

  // Single destination for leaving Teach Mode — Dashboard and Edit are the
  // same AppMode (see src/data/types.ts), so this shell exposes exactly one
  // control for it rather than two labels for one action.
  const handleOpenDashboard = useCallback(() => {
    setMode('edit' as AppMode)
  }, [setMode])

  return (
    <div
      className="flex h-dvh w-dvw flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(30,41,59,0.28) 0%, transparent 60%), ' +
          'linear-gradient(180deg, #0b101e 0%, #050914 100%)',
      }}
    >
      {/* ── Teaching Block Header — informational only, no controls, no clock
          (the classroom preview below owns the single on-screen clock) ── */}
      <header className="shrink-0 border-b border-white/[0.05] bg-white/[0.015] px-8 py-5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl min-w-0 flex-col gap-1 text-center">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
            {screenLabel}
          </h1>
          <p className="truncate text-sm text-slate-500">{routineBanner}</p>
        </div>
      </header>

      {/* ── Clean Classroom Screen Preview — the visual focus ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CleanClassroomScreenPreview />
      </div>

      {/* ── Bottom Bar: Navigation + Compact Controls ── */}
      <footer className="shrink-0 border-t border-white/[0.05] bg-white/[0.015] px-8 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          {/* Navigation — Previous/Next stay quiet; Present is the one
              accented, filled control in this entire shell. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={navigateToPreviousPage}
              className="rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:border-slate-700/60 hover:text-slate-200 active:scale-[0.97]"
              aria-label="Previous slide"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handlePresent}
              className="rounded-2xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-emerald-950 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)] transition-all duration-150 hover:bg-emerald-400 active:scale-[0.97]"
              aria-label="Send to student display"
            >
              Present
            </button>
            <button
              type="button"
              onClick={navigateToNextPage}
              className="rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:border-slate-700/60 hover:text-slate-200 active:scale-[0.97]"
              aria-label="Next slide"
            >
              Next
            </button>
          </div>

          {/* Secondary controls — Resources, Tools, Dashboard: one shared,
              quiet visual treatment, no accent color competing with Present. */}
          <div className="flex items-center gap-2">
            <ResourcesPopover
              onOpenStudio={handleOpenDashboard}
              screenLabel={screenLabel}
              isOpen={openPopover === 'resources'}
              onOpenChange={(next) => setOpenPopover(next ? 'resources' : null)}
            />
            <QuickToolsPopover
              onActivateDashboard={handleOpenDashboard}
              isOpen={openPopover === 'tools'}
              onOpenChange={(next) => setOpenPopover(next ? 'tools' : null)}
            />
            <button
              type="button"
              onClick={handleOpenDashboard}
              className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200 active:scale-[0.97]"
            >
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
