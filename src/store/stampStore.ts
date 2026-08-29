import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyAddStamps,
  applyRedeemMilestone,
  createEmptyStampRecord,
  type RedeemMilestoneResult,
  type StampAddAmount,
  type StampMilestoneTier,
  type StudentStampRecord,
} from './stampLogic'

/**
 * A teacher-set pointer to the one student/tier whose milestone may be shown
 * on `/display`. Per-student balances and histories live only in `students`
 * below and must never be read directly by `/display` — it may only read
 * `activeProjection`, which stays `null` until a teacher action explicitly
 * sets it, and nothing in this store sets it as a side effect of
 * `addStamps`/`redeemMilestone`.
 */
export interface StampProjection {
  studentId: string
  tier: StampMilestoneTier
}

interface StampStoreState {
  students: Record<string, StudentStampRecord>
  activeProjection: StampProjection | null
}

interface StampStore extends StampStoreState {
  /** Registers a student if not already present; a no-op (never overwrites
   * balance/redemptions) if the student already exists — safe to call from
   * an "Add Student" UI action without risk of resetting real progress. */
  addStudent: (studentId: string, displayName: string) => void
  addStamps: (studentId: string, amount: StampAddAmount) => void
  redeemMilestone: (studentId: string, tier: StampMilestoneTier) => RedeemMilestoneResult
  setActiveProjection: (projection: StampProjection | null) => void
  getStudentStamps: (studentId: string) => StudentStampRecord
}

export const useStampStore = create<StampStore>()(
  persist(
    (set, get) => ({
      students: {},
      activeProjection: null,

      addStudent: (studentId, displayName) =>
        set((state) => {
          if (state.students[studentId]) return state
          return {
            students: {
              ...state.students,
              [studentId]: createEmptyStampRecord(studentId, displayName),
            },
          }
        }),

      addStamps: (studentId, amount) =>
        set((state) => {
          const current = state.students[studentId] ?? createEmptyStampRecord(studentId)
          return {
            students: {
              ...state.students,
              [studentId]: applyAddStamps(current, amount),
            },
          }
        }),

      redeemMilestone: (studentId, tier) => {
        const current = get().students[studentId] ?? createEmptyStampRecord(studentId)
        const result = applyRedeemMilestone(current, tier)
        if (!result.ok) return result
        set((state) => ({
          students: { ...state.students, [studentId]: result.record },
        }))
        return result
      },

      setActiveProjection: (projection) => set({ activeProjection: projection }),

      getStudentStamps: (studentId) =>
        get().students[studentId] ?? createEmptyStampRecord(studentId),
    }),
    {
      name: 'classroom-command-center-stamps',
      version: 1,
      partialize: (state) => ({
        students: state.students,
        activeProjection: state.activeProjection,
      }),
    },
  ),
)
