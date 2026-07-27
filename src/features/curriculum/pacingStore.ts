import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurriculumSubjectId, PacingPersistedState } from './types'
import { PACING_STORAGE_KEY, PACING_STORAGE_VERSION } from './types'
import {
  DEFAULT_PACING_STATE,
  resolveCurrentLesson,
  resolveTodaysPacing,
  toIsoDateKey,
} from './pacingResolver'
import type { LessonPlan, PacingSnapshot } from './types'

interface PacingStore extends PacingPersistedState {
  getTodaysPacing: (date?: Date) => PacingSnapshot
  getLessonForSubject: (subjectId: CurriculumSubjectId, date?: Date) => LessonPlan | null
  setLessonOverride: (
    date: Date,
    subjectId: CurriculumSubjectId,
    lessonNumber: number | null,
  ) => void
  clearLessonOverrides: (date?: Date) => void
}

function sanitizeOverrides(
  raw: unknown,
): PacingPersistedState['lessonOverrides'] {
  if (!raw || typeof raw !== 'object') return {}
  const result: PacingPersistedState['lessonOverrides'] = {}
  for (const [dateKey, subjects] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof subjects !== 'object' || !subjects) continue
    const parsed: Partial<Record<CurriculumSubjectId, number>> = {}
    for (const [subjectId, lessonNumber] of Object.entries(
      subjects as Record<string, unknown>,
    )) {
      if (typeof lessonNumber !== 'number' || lessonNumber < 1) continue
      parsed[subjectId as CurriculumSubjectId] = lessonNumber
    }
    if (Object.keys(parsed).length > 0) result[dateKey] = parsed
  }
  return result
}

export function hydratePacingState(persisted: unknown): PacingPersistedState {
  if (!persisted || typeof persisted !== 'object') return { ...DEFAULT_PACING_STATE }
  const value = persisted as Partial<PacingPersistedState>
  return {
    version: PACING_STORAGE_VERSION,
    lessonOverrides: sanitizeOverrides(value.lessonOverrides),
  }
}

export const usePacingStore = create<PacingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PACING_STATE,

      getTodaysPacing: (date = new Date()) =>
        resolveTodaysPacing(date, get().lessonOverrides),

      getLessonForSubject: (subjectId, date = new Date()) =>
        resolveCurrentLesson(subjectId, date, get().lessonOverrides),

      setLessonOverride: (date, subjectId, lessonNumber) => {
        const dateKey = toIsoDateKey(date)
        set((state) => {
          const next = { ...state.lessonOverrides }
          const day = { ...(next[dateKey] ?? {}) }
          if (lessonNumber === null) {
            delete day[subjectId]
          } else {
            day[subjectId] = lessonNumber
          }
          if (Object.keys(day).length === 0) {
            delete next[dateKey]
          } else {
            next[dateKey] = day
          }
          return { lessonOverrides: next }
        })
      },

      clearLessonOverrides: (date) => {
        if (!date) {
          set({ lessonOverrides: {} })
          return
        }
        const dateKey = toIsoDateKey(date)
        set((state) => {
          const next = { ...state.lessonOverrides }
          delete next[dateKey]
          return { lessonOverrides: next }
        })
      },
    }),
    {
      name: PACING_STORAGE_KEY,
      version: PACING_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        lessonOverrides: state.lessonOverrides,
      }),
      migrate: (persisted) => hydratePacingState(persisted),
    },
  ),
)

export const selectLessonOverrides = (state: PacingStore) => state.lessonOverrides
