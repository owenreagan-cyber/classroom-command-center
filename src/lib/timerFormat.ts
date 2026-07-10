/** Format milliseconds as M:SS or MM:SS for classroom display. */
export function formatTimerMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function minutesToMs(minutes: number): number {
  return Math.max(0, minutes) * 60 * 1000
}

export function msToWholeMinutes(ms: number): number {
  return Math.max(0, Math.round(ms / 60_000))
}

/** Remaining time from a wall-clock end; never negative. */
export function remainingFromEndsAt(endsAt: number, now = Date.now()): number {
  return Math.max(0, endsAt - now)
}
