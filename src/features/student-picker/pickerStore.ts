import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PickerStoreState,
  Student,
  FairnessEntry,
  MysterySlotId,
} from './types'
import { DEFAULT_COACHING_STATE } from './defaults'

const generateSimpleId = () => Math.random().toString(36).slice(2, 9)

const initialState = {
  students: [],
  fairnessHistory: [],
  activeMysterySessions: {
    homeroom: null,
    math: null,
    reading: null,
  },
  coachingConfig: DEFAULT_COACHING_STATE,
  settings: {
    reducedMotion: false,
    skipAnimation: false,
  },
}

export const usePickerStore = create<PickerStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addStudent: (displayName, classIds, note) => {
        set((state) => {
          const newStudent: Student = {
            id: generateSimpleId(),
            displayName: displayName.trim(),
            isActive: true,
            classes: classIds,
            isAbsent: false,
            note,
          }
          return { students: [...state.students, newStudent] }
        })
      },

      addStudentsBulk: (names, classId) => {
        set((state) => {
          const lines = names.split('\n').map((l) => l.trim()).filter(Boolean)
          const newStudents: Student[] = lines.map((name) => ({
            id: generateSimpleId(),
            displayName: name,
            isActive: true,
            classes: [classId],
            isAbsent: false,
          }))
          return { students: [...state.students, ...newStudents] }
        })
      },

      updateStudent: (id, updates) => {
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }))
      },

      markAbsent: (id, absent) => {
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, isAbsent: absent } : s)),
        }))
      },

      markAllPresent: () => {
        set((state) => ({
          students: state.students.map((s) => ({ ...s, isAbsent: false })),
        }))
      },

      startMysterySession: (classId, date, studentIds) => {
        if (studentIds.length !== 3) return
        set((state) => ({
          activeMysterySessions: {
            ...state.activeMysterySessions,
            [classId]: {
              id: generateSimpleId(),
              classId,
              date,
              status: 'active',
              slots: {
                'high-flier-1': { studentId: studentIds[0], status: 'hidden', observations: [] },
                'high-flier-2': { studentId: studentIds[1], status: 'hidden', observations: [] },
                'star': { studentId: studentIds[2], status: 'hidden', observations: [] },
              },
            },
          },
        }))
      },

      updateMysterySlot: (classId, slotId, status, reason) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session) return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: {
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { ...session.slots[slotId]!, status, reason },
                },
              },
            },
          }
        })
      },

      updateSlotObservation: (classId, slotId, behaviorId, value, context) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session) return state
          const slot = session.slots[slotId]
          if (!slot) return state

          const existingIdx = slot.observations.findIndex(o => o.behaviorId === behaviorId)
          const newObservations = [...slot.observations]

          if (existingIdx >= 0) {
            newObservations[existingIdx] = { ...newObservations[existingIdx], value, context }
          } else {
            newObservations.push({ behaviorId, value, context })
          }

          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: {
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { ...slot, observations: newObservations },
                },
              },
            },
          }
        })
      },

      replaceAbsentMysteryStudent: (classId, slotId, newStudentId) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session) return state
          const oldSlot = session.slots[slotId]
          if (!oldSlot) return state

          // 1. Mark original student absent
          const newStudents = state.students.map((s) =>
            s.id === oldSlot.studentId ? { ...s, isAbsent: true } : s
          )

          // 2. We don't add to fairness history here, it's just a replacement event.
          // Or we can add an absent-replacement entry to track it, but it won't count as an opportunity.
          const newEntry: FairnessEntry = {
            id: generateSimpleId(),
            studentId: oldSlot.studentId,
            studentDisplayName: state.students.find(s => s.id === oldSlot.studentId)?.displayName,
            classId,
            timestamp: Date.now(),
            role: slotId === 'star' ? 'mystery-star' : 'mystery-high-flier',
            outcome: 'absent-replaced',
          }

          // 3. Update the slot: reset to hidden, clear observations & reason, set new studentId
          return {
            students: newStudents,
            fairnessHistory: [...state.fairnessHistory, newEntry],
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: {
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { studentId: newStudentId, status: 'hidden', observations: [] },
                },
              },
            },
          }
        })
      },

      updateSessionContext: (classId, context) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session) return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: { ...session, currentContext: context },
            }
          }
        })
      },

      canStartReveal: (classId) => {
        const state = get()
        const session = state.activeMysterySessions[classId]
        if (!session || session.status !== 'active') return false

        // check that all slots are finalized
        const s1 = session.slots['high-flier-1']
        const s2 = session.slots['high-flier-2']
        const s3 = session.slots['star']

        if (!s1 || !s2 || !s3) return false
        if (s1.status === 'hidden' || s2.status === 'hidden' || s3.status === 'hidden') return false

        return true
      },

      advanceMysteryReveal: (classId) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session) return state

          let newStatus = session.status
          if (session.status === 'active') {
            if (!get().canStartReveal(classId)) return state // protection
            newStatus = 'revealed-1'
          } else if (session.status === 'revealed-1') newStatus = 'revealed-2'
          else if (session.status === 'revealed-2') newStatus = 'revealed-3'
          else if (session.status === 'revealed-3') newStatus = 'completed'

          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: { ...session, status: newStatus },
            },
          }
        })
      },

      replayReveal: (classId) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session || session.status !== 'completed') return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [classId]: { ...session, status: 'revealed-1' },
            }
          }
        })
      },

      cancelMysterySession: (classId) => {
        set((state) => ({
          activeMysterySessions: { ...state.activeMysterySessions, [classId]: null },
        }))
      },

      commitMysterySession: (classId) => {
        set((state) => {
          const session = state.activeMysterySessions[classId]
          if (!session || session.status !== 'completed') return state

          const newEntries: FairnessEntry[] = []
          const now = Date.now()
          const roles = ['high-flier-1', 'high-flier-2', 'star'] as MysterySlotId[]

          for (const slotId of roles) {
            const slot = session.slots[slotId]
            if (slot && (slot.status === 'earned' || slot.status === 'did-not-earn')) {
              newEntries.push({
                id: generateSimpleId(),
                studentId: slot.studentId,
                studentDisplayName: state.students.find(s => s.id === slot.studentId)?.displayName,
                classId,
                timestamp: now,
                role: slotId === 'star' ? 'mystery-star' : 'mystery-high-flier',
                outcome: slot.status,
                reason: slot.reason,
                date: session.date,
              })
            }
          }

          return {
            fairnessHistory: [...state.fairnessHistory, ...newEntries],
            activeMysterySessions: { ...state.activeMysterySessions, [classId]: null },
          }
        })
      },

      recordQuickPick: (classId, studentId) => {
        set((state) => ({
          fairnessHistory: [
            ...state.fairnessHistory,
            {
              id: generateSimpleId(),
              studentId,
              studentDisplayName: state.students.find(s => s.id === studentId)?.displayName,
              classId,
              timestamp: Date.now(),
              role: 'quick-pick',
              outcome: 'quick-picked',
            },
          ],
        }))
      },

      clearQuickPickHistory: (classId) => {
        set((state) => ({
          fairnessHistory: state.fairnessHistory.filter(
            (h) => !(h.classId === classId && h.role === 'quick-pick')
          ),
        }))
      },

      updateCoachingConfig: (updates) => {
        set((state) => ({
          coachingConfig: { ...state.coachingConfig, ...updates },
        }))
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }))
      }
    }),
    {
      name: 'classroom-picker-storage',
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<PickerStoreState>
        return {
          ...initialState,
          ...state,
          coachingConfig: { ...initialState.coachingConfig, ...(state.coachingConfig || {}) },
          settings: { ...initialState.settings, ...(state.settings || {}) },
        }
      },
    }
  )
)
