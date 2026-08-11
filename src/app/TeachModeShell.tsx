import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { CleanClassroomScreenPreview } from './CleanClassroomScreenPreview'
import { QuickToolsPopover } from './QuickToolsPopover'
import { ResourcesPopover } from './ResourcesPopover'
import { openStudentDisplay } from './displayLaunch'
import type { AppMode } from '../data/types'

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return now
}

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

/** Small, calm "Next up" hint — static copy only, no schedule logic. */
function NextUpIndicator({ activeScreen }: { activeScreen: string }) {
  const nextLabel = useMemo(() => {
    const nextMap: Record<string, string> = {
      homeroom: 'Math',
      manth: 'Reading',
      reading: 'Writing',
      writing: 'Science',
      science: 'Social Studies',
      'social-studies': 'Lunch',
      snack: 'Lunch',
      lunch: 'Recess',
      recess: 'Social Studies',
    }
    if (nextMap[activeScreen]) return nextMap[activeScreen]
    return null
  }, [activeScreen])

  if (!nextLabel) return null

  return (
    <div className="flex flex-col items-end gap-0.5 opacity-50 transition-opacity duration-300 hover:opacity-80">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Next up
      </span>
      <span className="text-xs font-medium text-slate-400">{nextLabel}</span>
      <span className="text-[10px] text-slate-600">
        After {SCREEN_LABELS[activeScreen] ?? activeScreen}
      </span>
    </div>
  )
}

/** Premium Teach Mode shell — calm, presentation-first, classroom-ready.
 *  Does NOT render BoardWorkspace, BoardFrame, TeacherCommandDock,
 *  or any edit/studio chrome. */
export function TeachModeShell() {
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const setMode = useBoardStore((state) => state.setMode)
  const navigateToPreviousPage = useBoardStore((state) => state.navigateToPreviousPage)
  const navigateToNextPage = useBoardStore((state) => state.navigateToNextPage)
  const now = useLiveClock()

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

  const timeStr = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now],
  )

  const handlePresent = useCallback(() => {
    openStudentDisplay(window, window.location)
  }, [])

  const handleOpenDashboard = useCallback(() => {
    setMode('edit' as AppMode)
  }, [setMode])

  const handleOpenEdit = useCallback(() => {
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
      {/* ── Teaching Block Identity Strip ── */}
      <header className="relative z-30 shrink-0 border-b border-white/[0.05] bg-white/[0.015] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-8 py-5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-baseline gap-4">
              <h1 className="truncate text-[1.65rem] font-semibold tracking-tight text-white/95">
                {screenLabel}
              </h1>
              <span className="shrink-0 rounded-full bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-emerald-300/70 ring-1 ring-inset ring-emerald-700/25">
                Ready
              </span>
            </div>
            <p className="truncate text-[13px] text-slate-500/80">{routineBanner}</p>
          </div>

          <div className="flex shrink-0 items-center gap-6">
            <NextUpIndicator activeScreen={activeScreen} />
            <div className="rounded-2xl bg-white/[0.03] px-4 py-2 ring-1 ring-white/[0.04]">
              <p className="text-[1.45rem] font-mono font-medium tabular-nums tracking-tight text-white/80">
                {timeStr}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Classroom Preview Stage ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CleanClassroomScreenPreview />
      </div>

      {/* ── Presenter Controls Footer ── */}
      <footer className="relative z-30 shrink-0 border-t border-white/[0.05] bg-white/[0.015] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-8 py-3">
          {/* Navigation row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={navigateToPreviousPage}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200 active:scale-[0.97]"
              aria-label="Previous slide"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handlePresent}
              className="rounded-xl border border-emerald-600/30 bg-emerald-950/30 px-5 py-2.5 text-[13px] font-semibold text-emerald-300/80 transition-all duration-150 hover:border-emerald-400/50 hover:bg-emerald-900/35 hover:text-emerald-100 active:scale-[0.97]"
              aria-label="Send to student display"
            >
              Present
            </button>
            <button
              type="button"
              onClick={navigateToNextPage}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200 active:scale-[0.97]"
              aria-label="Next slide"
            >
              Next
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center gap-1.5">
            <ResourcesPopover onOpenDashboard={handleOpenDashboard} />
            <QuickToolsPopover onActivateDashboard={handleOpenDashboard} />
            <button
              type="button"
              onClick={handleOpenDashboard}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-slate-300 active:scale-[0.97]"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={handleOpenEdit}
              className="rounded-xl border border-cyan-700/30 bg-cyan-950/20 px-3.5 py-2.5 text-[13px] font-medium text-cyan-300/60 transition-all duration-150 hover:border-cyan-500/45 hover:bg-cyan-900/25 hover:text-cyan-200 active:scale-[0.97]"
            >
              Edit
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
