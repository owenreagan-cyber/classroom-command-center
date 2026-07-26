import { useEffect, useMemo, useState } from 'react'
import { SCREEN_META } from '../data/defaults'
import type { ScreenId } from '../data/types'
import type { SimpleTimerScreenId } from '../data/timerTypes'
import { CANONICAL_DAILY_BLOCKS, resolveBlockDisplayLabel, resolveCurriculumTrack } from '../data/routineSchedule'
import { getDailyBlockTimeline } from '../lib/routineEngine'
import { formatTimerMs } from '../lib/timerFormat'
import { resolveNowShowingDisplay } from '../lib/nowShowing'
import { useBoardStore } from '../store/boardStore'
import { useTimerStore } from '../store/timerStore'
import { useAtmosphereStore } from '../features/classroom-atmosphere/atmosphereStore'
import { MUSIC_MODE_LABELS } from '../features/classroom-atmosphere/playlists'
import { buildLessonPackage } from '../features/omninote-bridge/types'
import { copyResourceForOmniNote, executeHandoff } from '../features/omninote-bridge/handoff'
import { enabledMorningMessageSections } from '../data/morningMessage'

interface TeacherDashboardPanelProps {
  activeScreen: ScreenId
  onScreenChange: (screen: ScreenId) => void
  onScrollToSection?: (sectionId: string) => void
}

function useLiveClock(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TeacherDashboardPanel({
  activeScreen,
  onScreenChange,
  onScrollToSection,
}: TeacherDashboardPanelProps) {
  const now = useLiveClock()
  const todayPrep = useBoardStore((s) => s.todayPrep)
  const morningMessage = useBoardStore((s) => s.morningMessage)
  const simpleTimers = useTimerStore((s) => s.simpleTimers)
  const phaseTimer = useTimerStore((s) => s.phaseTimer)
  const startSimple = useTimerStore((s) => s.startSimple)
  const activeMode = useAtmosphereStore((s) => s.activeMode)
  const isPlaying = useAtmosphereStore((s) => s.isPlaying)

  const blockTimeline = useMemo(() => getDailyBlockTimeline(now), [now])
  const curriculumTrack = useMemo(() => resolveCurriculumTrack(now), [now])

  const currentBlockLabel = blockTimeline.currentBlock
    ? resolveBlockDisplayLabel(blockTimeline.currentBlock, curriculumTrack)
    : null
  const nextBlockLabel = blockTimeline.nextBlock
    ? resolveBlockDisplayLabel(blockTimeline.nextBlock, curriculumTrack)
    : null

  let runningTimer: {
    screenId: SimpleTimerScreenId | null
    timer: { remainingMs: number }
    isPhase?: boolean
  } | null = null
  for (const [screenId, timer] of Object.entries(simpleTimers)) {
    if (timer.status === 'running') {
      runningTimer = { screenId: screenId as SimpleTimerScreenId, timer }
      break
    }
  }
  if (!runningTimer && phaseTimer.status === 'running') {
    runningTimer = { screenId: null, timer: phaseTimer, isPhase: true }
  }

  const nowShowing = resolveNowShowingDisplay(
    todayPrep.nowShowingResourceId,
    todayPrep.resourceLinks,
  )

  const currentLesson = useMemo(() => {
    const screen = SCREEN_META.find((s) => s.id === activeScreen)
    return screen?.label ?? activeScreen
  }, [activeScreen])

  const musicLabel = activeMode
    ? isPlaying
      ? MUSIC_MODE_LABELS[activeMode]
      : `${MUSIC_MODE_LABELS[activeMode]} (paused)`
    : null

  const schedulePreview = CANONICAL_DAILY_BLOCKS.filter((b) => b.enabled).slice(0, 6)

  const handleStartTimer = () => {
    startSimple('homeroom')
    onScreenChange('homeroom')
  }

  const handleOpenOmniNote = async () => {
    const link = todayPrep.resourceLinks[0]
    if (!link) {
      onScrollToSection?.('today-prep')
      return
    }
    const pkg = buildLessonPackage({
      title: link.label,
      subject: activeScreen,
      kind: link.preset === 'google-slides' ? 'slide-deck' : 'pdf',
      webUrl: link.url,
    })
    const copied = await copyResourceForOmniNote(pkg)
    if (copied) {
      executeHandoff({ package: pkg, method: 'copy-link' })
    } else {
      executeHandoff({ package: pkg, method: 'manual' })
    }
  }

  const scrollTo = (id: string) => onScrollToSection?.(id)

  return (
    <section
      className="space-y-4 rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4"
      aria-label="Teacher dashboard"
      data-testid="teacher-dashboard"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Today
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-white">{formatDate(now)}</h2>
        <p className="text-sm text-slate-400">{formatTime(now)}</p>
      </div>

      {/* Schedule snapshot */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Schedule
        </h3>
        {blockTimeline.currentBlock ? (
          <p className="text-sm font-medium text-emerald-300">
            Now: {currentBlockLabel}
          </p>
        ) : (
          <p className="text-sm text-slate-400">No active block</p>
        )}
        {blockTimeline.nextBlock && (
          <p className="text-xs text-slate-400">
            Next: {nextBlockLabel} at{' '}
            {blockTimeline.nextBlock.startTime}
          </p>
        )}
        <p className="text-[10px] uppercase tracking-wide text-slate-600">
          Track {curriculumTrack}
          {blockTimeline.currentBlock?.id === 'history-science' ||
          blockTimeline.nextBlock?.id === 'history-science'
            ? ` · ${resolveBlockDisplayLabel(
                CANONICAL_DAILY_BLOCKS.find((block) => block.id === 'history-science')!,
                curriculumTrack,
              )}`
            : ''}
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
          {schedulePreview.map((block) => (
            <li key={block.id} className="flex justify-between">
              <span>{resolveBlockDisplayLabel(block, curriculumTrack)}</span>
              <span>{block.startTime}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Status row */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatusCard
          label="Timer"
          value={
            runningTimer
              ? runningTimer.isPhase
                ? formatTimerMs(runningTimer.timer.remainingMs)
                : formatTimerMs(runningTimer.timer.remainingMs)
              : 'None running'
          }
        />
        <StatusCard label="Lesson" value={currentLesson} />
        <StatusCard
          label="Now Showing"
          value={nowShowing?.label ?? 'Nothing'}
        />
        <StatusCard label="Music" value={musicLabel ?? 'Off'} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          <QuickAction label="Start Timer" onClick={handleStartTimer} />
          <QuickAction label="Open OmniNote" onClick={handleOpenOmniNote} />
          <QuickAction
            label="Mystery Star"
            onClick={() => scrollTo('student-picker')}
          />
          <QuickAction
            label="Prize Board"
            onClick={() => scrollTo('prize-board')}
          />
          <QuickAction
            label="Materials"
            onClick={() => {
              onScreenChange('homeroom')
              scrollTo('today-prep')
            }}
          />
          <QuickAction
            label="Morning Message"
            onClick={() => scrollTo('morning-message')}
          />
        </div>
      </div>

      {enabledMorningMessageSections(morningMessage.current).length > 0 && (
        <p className="text-xs text-emerald-400/80">
          Morning Message has {enabledMorningMessageSections(morningMessage.current).length} section(s) enabled.
        </p>
      )}
    </section>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}

function QuickAction({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-700"
    >
      {label}
    </button>
  )
}
