import { memo } from 'react'
import { SCREEN_META } from '../../../data/defaults'
import { TimerWidget } from '../../../widgets/TimerWidget'
import { PhaseTimerCard } from '../../../widgets/PhaseTimerCard'
import { TransitionTimerWidget } from '../../../widgets/TransitionTimerWidget'
import { TaskTimerWidget } from '../../../widgets/TaskTimerWidget'
import { RoutineTimerWidget } from '../../../widgets/RoutineTimerWidget'
import type { SimpleTimerScreenId } from '../../../data/timerTypes'
import { useTeacherDockContext } from '../useTeacherDockContext'

const TIMER_SCREENS: SimpleTimerScreenId[] = ['math', 'reading', 'homeroom', 'spelling']

export const TimersToolPanel = memo(function TimersToolPanel() {
  const { mode } = useTeacherDockContext()

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-bold text-white">Timers</h2>
        <p className="mt-1 text-sm text-slate-400">
          Control classroom timers from one place. Changes sync to the active board screens.
        </p>
      </header>
      <div className="space-y-4">
        {TIMER_SCREENS.map((screenId) => {
          const meta = SCREEN_META.find((screen) => screen.id === screenId)
          return (
            <section key={screenId} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {meta?.label ?? screenId}
              </h3>
              <TimerWidget screenId={screenId} mode={mode} large={false} />
            </section>
          )
        })}
      </div>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Transition Timer
        </h3>
        <TransitionTimerWidget pageId="math-wrap-up" mode={mode} />
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Task Timer
        </h3>
        <TaskTimerWidget mode={mode} />
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lunch Routine
        </h3>
        <RoutineTimerWidget mode={mode} />
      </section>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Phase Timer
        </h3>
        <PhaseTimerCard mode={mode} />
      </section>
    </div>
  )
})
