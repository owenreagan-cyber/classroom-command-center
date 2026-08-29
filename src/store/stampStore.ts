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
 * A teacher-set pointer to the one student whose live stamp progress may be
 * shown on `/display`. Per-student balances and histories live only in
 * `students` below and must never be read directly by `/display` — display
 * code may only go through `stampProjectionChannel.ts`'s narrow, read-only
 * hooks, which resolve just this one student's public view. Nothing in this
 * store sets `activeProjection` as a side effect of `addStamps`/
 * `redeemMilestone`; only an explicit teacher "Cast to Display" action does.
 */
export interface StampProjection {
  studentId: string
  displayName: string
}

export const STAMP_STORAGE_KEY = 'classroom-command-center-stamps'

/** Same-origin, cross-tab, fire-and-forget "a redemption just happened"
 * signal — deliberately NOT part of persisted state (see
 * `stampProjectionChannel.ts` for why: a late-joining or reloaded /display
 * tab should never replay a stale celebration). */
export const STAMP_REDEMPTION_CHANNEL_NAME = 'classroom-command-center-stamp-redemptions'

export interface StampRedemptionEvent {
  studentId: string
  tier: StampMilestoneTier
  at: number
}

function broadcastRedemption(event: StampRedemptionEvent): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(STAMP_REDEMPTION_CHANNEL_NAME)
  channel.postMessage(event)
  channel.close()
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
        broadcastRedemption({ studentId, tier, at: Date.now() })
        return result
      },

      setActiveProjection: (projection) => set({ activeProjection: projection }),

      getStudentStamps: (studentId) =>
        get().students[studentId] ?? createEmptyStampRecord(studentId),
    }),
    {
      name: STAMP_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        students: state.students,
        activeProjection: state.activeProjection,
      }),
    },
  ),
)

// Cross-tab live sync: `persist` writes this tab's changes to localStorage,
// but only OTHER same-origin tabs receive a native `storage` event for that
// write (never the tab that made it) — exactly what lets a `/board-lab` tab
// push stamp changes to an already-open `/display` tab in real time. Mirrors
// the identical pattern already used by `pressYourLuckStore.ts` for the
// same cross-tab-display reason.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STAMP_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<StampStoreState> }
      const restored = parsed.state ?? parsed
      useStampStore.setState(restored as Partial<StampStoreState>)
    } catch {
      // ignore malformed storage
    }
  })
}
