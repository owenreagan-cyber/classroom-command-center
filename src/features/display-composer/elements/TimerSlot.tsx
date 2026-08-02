import type { AppMode, VibePageId } from '../../../data/types'
import { TransitionTimerWidget } from '../../../widgets/TransitionTimerWidget'
import { TaskTimerWidget } from '../../../widgets/TaskTimerWidget'
import { RoutineTimerWidget } from '../../../widgets/RoutineTimerWidget'
import type { DisplayTimerWidgetConfig } from '../types'

interface TimerSlotProps {
  config: DisplayTimerWidgetConfig
  mode: AppMode
  className?: string
}

/**
 * Renders the linked existing timer widget for a composed display screen —
 * no new timer engine. 'general' and 'transition' both render through
 * TransitionTimerWidget/transitionTimers (an arbitrary-keyed simple
 * countdown); the component's pageId prop is typed to the closed VibePageId
 * union used by the Vibe Page system, but the store itself keys this
 * collection by plain string, so a synthetic composer id is cast here — this
 * is safe at runtime and lets Display Composer screens use their own ids
 * without polluting the shared VibePageId type used by page sequences.
 */
export function TimerSlot({ config, mode, className }: TimerSlotProps) {
  if (config.kind === 'none' || !config.timerId) return null

  if (config.kind === 'general' || config.kind === 'transition') {
    return (
      <TransitionTimerWidget
        pageId={config.timerId as VibePageId}
        mode={mode}
        className={className}
      />
    )
  }

  if (config.kind === 'task') {
    return <TaskTimerWidget taskId={config.timerId} mode={mode} className={className} />
  }

  if (config.kind === 'routine') {
    return <RoutineTimerWidget routineId={config.timerId} mode={mode} className={className} />
  }

  return null
}
