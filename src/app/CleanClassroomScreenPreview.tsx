import { useEffect, useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { useTimerStore } from '../store/timerStore'
import { useAtmosphereStore } from '../features/classroom-atmosphere/atmosphereStore'
import { MUSIC_MODE_LABELS } from '../features/classroom-atmosphere/playlists'
import { formatTimerMs } from '../lib/timerFormat'
import type {
  HomeroomContent,
  MathContent,
  ReadingContent,
  SubjectContent,
  SnackContent,
  LunchContent,
  ReadyPositionContent,
} from '../data/types'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function ContentCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
      {title && (
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400/80">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-200">
          <span className="mt-[3px] shrink-0 text-xs font-medium text-slate-500">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function MaterialPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm text-slate-200">
      <span className="text-xs text-slate-500">•</span>
      {label}
    </span>
  )
}

function VoiceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Silent: 'border-slate-500/40 text-slate-400',
    Whisper: 'border-cyan-600/40 text-cyan-300/70',
    Normal: 'border-emerald-600/40 text-emerald-300/70',
  }
  return (
    <span className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium ${colors[level] ?? 'border-slate-500/40 text-slate-400'}`}>
      {level}
    </span>
  )
}

function HomeroomPreview({ content }: { content: HomeroomContent }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <ContentCard title={content.doNowTitle || 'Morning Work'}>
        <p className="text-[15px] leading-relaxed text-slate-200">{content.doNow}</p>
        {content.reminders && content.reminders.length > 0 && (
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {content.remindersTitle || 'Reminders'}
            </h4>
            <BulletList items={content.reminders} />
          </div>
        )}
      </ContentCard>
      <ContentCard title={content.materialsTitle || 'Materials'}>
        <div className="flex flex-col gap-3">
          {content.materials?.haveOut && content.materials.haveOut.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Have Out</p>
              <div className="flex flex-wrap gap-2">
                {content.materials.haveOut.map((m, i) => (
                  <MaterialPill key={i} label={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  )
}

function SubjectPreview({ content }: { content: SubjectContent }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <ContentCard title={content.focusTitle || 'Focus'}>
        <p className="text-[15px] leading-relaxed text-slate-200">{content.focusTask}</p>
        {content.agenda && content.agenda.length > 0 && (
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {content.agendaTitle || 'Agenda'}
            </h4>
            <BulletList items={content.agenda} />
          </div>
        )}
      </ContentCard>
      <ContentCard title={content.materialsTitle || 'Materials'}>
        <div className="flex flex-col gap-3">
          {content.materials?.haveOut && content.materials.haveOut.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Have Out</p>
              <div className="flex flex-wrap gap-2">
                {content.materials.haveOut.map((m, i) => (
                  <MaterialPill key={i} label={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  )
}

function MathReadingPreview({ content }: { content: MathContent | ReadingContent }) {
  const lesson = content.lesson
  const vocabulary = content.vocabulary
  const ready = 'readyPosition' in content ? content.readyPosition : undefined

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <div className="flex flex-col gap-5">
        <ContentCard title="Lesson">
          <p className="text-[15px] leading-relaxed text-slate-200">{content.lessonTitle}</p>
          {lesson && (
            <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
              {lesson.objective && (
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-slate-300">Objective: </span>
                  {lesson.objective}
                </p>
              )}
              {lesson.successCriteria && lesson.successCriteria.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Success Criteria</p>
                  <BulletList items={lesson.successCriteria} />
                </div>
              )}
            </div>
          )}
        </ContentCard>
        {vocabulary && vocabulary.entries.length > 0 && (
          <ContentCard title={vocabulary.title || 'Vocabulary'}>
            <div className="flex flex-wrap gap-1.5">
              {vocabulary.entries.map((entry, i) => (
                <span
                  key={i}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-sm text-slate-200"
                >
                  {entry.term}
                </span>
              ))}
            </div>
          </ContentCard>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <ContentCard title={content.materialsTitle || 'Materials'}>
          <div className="flex flex-col gap-3">
            {content.materials?.haveOut && content.materials.haveOut.length > 0 && (
              <div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Have Out</p>
                <div className="flex flex-wrap gap-2">
                  {content.materials.haveOut.map((m, i) => (
                    <MaterialPill key={i} label={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ContentCard>
        {ready && (
          <ContentCard title={ready.title || 'Ready Position'}>
            {ready.useCompact && ready.compactLine ? (
              <p className="text-[15px] text-slate-200">{ready.compactLine}</p>
            ) : (
              <BulletList items={ready.steps} />
            )}
          </ContentCard>
        )}
      </div>
    </div>
  )
}

function SnackLunchPreview({ content }: { content: SnackContent | LunchContent }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
      <ContentCard title={content.routineTitle || 'Routine'}>
        {content.routine && <BulletList items={content.routine} />}
      </ContentCard>
      <ContentCard title={content.cleanupTitle || 'Cleanup'}>
        {content.cleanupReminders && <BulletList items={content.cleanupReminders} />}
      </ContentCard>
    </div>
  )
}

function ReadyPositionPreview({ content }: { content: ReadyPositionContent }) {
  return (
    <ContentCard title={content.title || 'Expectations'}>
      {content.useCompact && content.compactLine ? (
        <p className="text-xl font-medium text-slate-200">{content.compactLine}</p>
      ) : content.steps && content.steps.length > 0 ? (
        <BulletList items={content.steps} />
      ) : null}
    </ContentCard>
  )
}

function EmptyScreenPreview({ screenLabel }: { screenLabel: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-slate-500">{screenLabel} — no content configured yet.</p>
    </div>
  )
}

/** Clean, non-editable classroom screen preview — no BoardFrame chrome, no teacher overlays. */
export function CleanClassroomScreenPreview() {
  const activeScreen = useBoardStore((s) => s.activeScreen)
  const contents = useBoardStore((s) => s.contents)
  const simpleTimers = useTimerStore((s) => s.simpleTimers)
  const activeMode = useAtmosphereStore((s) => s.activeMode)
  const isPlaying = useAtmosphereStore((s) => s.isPlaying)
  const now = useLiveClock()

  const screenLabel = useMemo(() => {
    switch (activeScreen) {
      case 'homeroom': return 'Morning Arrival'
      case 'ready-position': return 'Ready Position'
      default: return activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1).replace(/-/g, ' ')
    }
  }, [activeScreen])

  const greeting = useMemo(() => {
    const hour = now.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [now])

  const timerRemaining = useMemo(() => {
    const timer = simpleTimers[activeScreen as keyof typeof simpleTimers]
    if (!timer || timer.status !== 'running') return null
    return formatTimerMs(timer.remainingMs)
  }, [simpleTimers, activeScreen])

  const musicLabel = useMemo(() => {
    if (!activeMode) return null
    return MUSIC_MODE_LABELS[activeMode] ?? activeMode
  }, [activeMode])

  const voiceLevel = useMemo(() => {
    const screenToLevel: Record<string, string> = {
      homeroom: 'Whisper',
      math: 'Silent',
      reading: 'Whisper',
      writing: 'Normal',
      science: 'Normal',
      'social-studies': 'Normal',
      spelling: 'Normal',
      assessment: 'Silent',
      centers: 'Whisper',
      snack: 'Normal',
      lunch: 'Normal',
      recess: 'Normal',
      movement: 'Normal',
      'ready-position': 'Silent',
      homework: 'Normal',
      'pack-up': 'Normal',
    }
    return screenToLevel[activeScreen] ?? null
  }, [activeScreen])

  const renderContent = () => {
    switch (activeScreen) {
      case 'homeroom':
        return <HomeroomPreview content={contents.homeroom} />
      case 'math':
        return <MathReadingPreview content={contents.math} />
      case 'reading':
        return <MathReadingPreview content={contents.reading} />
      case 'writing':
      case 'science':
      case 'social-studies':
      case 'assessment':
      case 'centers':
      case 'spelling':
        return <SubjectPreview content={contents[activeScreen] as SubjectContent} />
      case 'homework':
      case 'pack-up':
        return <SubjectPreview content={contents[activeScreen] as unknown as SubjectContent} />
      case 'snack':
        return <SnackLunchPreview content={contents.snack} />
      case 'lunch':
        return <SnackLunchPreview content={contents.lunch} />
      case 'recess':
        return <ReadyPositionPreview content={contents.recess} />
      case 'movement':
        return <ReadyPositionPreview content={contents.movement} />
      case 'ready-position':
        return <ReadyPositionPreview content={contents['ready-position']} />
      default:
        return <EmptyScreenPreview screenLabel={screenLabel} />
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="flex w-full max-w-4xl flex-col">
        {/* Slide card — presentation-first, 16:9 feel */}
        <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-slate-900/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_-8px_rgba(0,0,0,0.4),0_2px_8px_-2px_rgba(0,0,0,0.3)]">
          {/* Header bar with greeting + date + voice + clock */}
          <div className="border-b border-white/[0.06] bg-white/[0.02] px-7 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {greeting}, 4th Grade!
                </h2>
                <p className="mt-1 text-sm text-slate-400">{formatDate(now)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {voiceLevel && <VoiceBadge level={voiceLevel} />}
                <span className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm font-medium tabular-nums text-slate-300">
                  {formatTime(now)}
                </span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-7">
            {renderContent()}
          </div>

          {/* Status footer — music, timer */}
          {(musicLabel || timerRemaining) && (
            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] px-7 py-3.5">
              {musicLabel && (
                <span className="text-xs font-medium text-slate-500">
                  Music: {musicLabel}{isPlaying ? ' ▶' : ''}
                </span>
              )}
              {timerRemaining && (
                <span className="ml-auto text-xs font-medium tabular-nums text-slate-500">
                  Time left: {timerRemaining}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
