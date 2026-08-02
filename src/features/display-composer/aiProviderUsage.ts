/**
 * Phase 14E — Lightweight, local-only draft usage counter.
 *
 * Cost-safety control: an optional daily draft limit, tracked as a plain
 * {date, count} pair. No private content is ever stored here — just a date
 * string and a number. Resettable, pure, fully unit-tested.
 */
export interface DraftUsageCounter {
  /** YYYY-MM-DD, local calendar date. */
  date: string
  count: number
}

export function emptyDraftUsageCounter(): DraftUsageCounter {
  return { date: '', count: 0 }
}

export function todayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

/** Rolls over to a fresh count of 1 when the calendar date has changed. */
export function recordDraft(counter: DraftUsageCounter, now: number = Date.now()): DraftUsageCounter {
  const today = todayKey(now)
  if (counter.date !== today) {
    return { date: today, count: 1 }
  }
  return { date: today, count: counter.count + 1 }
}

/** Count for "today" specifically — a stale counter from a previous day reads as 0. */
export function draftsUsedToday(counter: DraftUsageCounter, now: number = Date.now()): number {
  return counter.date === todayKey(now) ? counter.count : 0
}

export function isOverDailyLimit(
  counter: DraftUsageCounter,
  dailyLimit: number | undefined,
  now: number = Date.now(),
): boolean {
  if (!dailyLimit || dailyLimit <= 0) return false
  return draftsUsedToday(counter, now) >= dailyLimit
}
