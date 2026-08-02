import { useClockTick } from '../../../hooks/useClockTick'
import { CompactRealClock } from '../../../components/routines/CompactRealClock'

interface ClockBlockProps {
  large?: boolean
}

/** Plain wall clock for a composed display screen — distinct from countdown timers. */
export function ClockBlock({ large = false }: ClockBlockProps) {
  const now = useClockTick()
  return (
    <CompactRealClock
      now={now}
      label="Current Time"
      className={large ? 'text-2xl [&_p:last-child]:text-4xl md:[&_p:last-child]:text-5xl' : ''}
    />
  )
}
