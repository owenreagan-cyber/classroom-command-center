import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPoolKey } from '../roster/poolKey'
import { pickTitleForPool } from '../titles/titleBank'
import type { TitleUsageEntry } from '../titles/types'
import type { FairnessEntry, MysteryRevealStatus, MysterySlotId, PickerPoolKey, PickerStoreState, Student } from './types'
import { DEFAULT_COACHING_STATE } from './defaults'

const STORAGE_KEY = 'classroom-picker-storage-v3'

const generateSimpleId = () => Math.random().toString(36).slice(2, 9)

const defaultSessions: Record<string, null> = {
  homeroom: null,
  math: null,
  reading: null,
  'reading:RM4': null,
  'reading:SM5': null,
}

const initialState = {
  students: [] as Student[],
  fairnessHistory: [] as FairnessEntry[],
  titleUsageHistory: [] as TitleUsageEntry[],
  activeMysterySessions: { ...defaultSessions },
  coachingConfig: DEFAULT_COACHING_STATE,
  settings: {
    reducedMotion: false,
    skipAnimation: false,
  },
  importedRosterMeta: undefined,
}

function touchSession<T extends { updatedAt: number }>(session: T): T {
  return { ...session, updatedAt: Date.now() }
}

function migrateLegacySession(session: Record<string, unknown>): Record<string, unknown> {
  const classId = session.classId as string
  const readingSection = session.readingSection as string | undefined
  const poolKey = (session.poolKey as PickerPoolKey | undefined)
    ?? getPoolKey(classId as 'homeroom' | 'math' | 'reading', readingSection as 'RM4' | 'SM5' | undefined)

  return {
    ...session,
    poolKey,
    createdAt: (session.createdAt as number | undefined) ?? Date.now(),
    updatedAt: (session.updatedAt as number | undefined) ?? Date.now(),
  }
}

function migrateStudent(student: Record<string, unknown>): Student {
  const displayName = String(student.displayName ?? '').trim()
  const firstName = String(student.firstName ?? displayName).trim()
  const lastName = String(student.lastName ?? '').trim()
  const preferredName = student.preferredName
    ? String(student.preferredName).trim() || undefined
    : undefined

  return {
    id: String(student.id),
    firstName,
    lastName,
    preferredName,
    displayName: preferredName || firstName || displayName,
    isActive: student.isActive !== false,
    classes: (student.classes as Student['classes']) ?? ['homeroom'],
    section: student.section as Student['section'],
    isAbsent: Boolean(student.isAbsent),
    note: student.note ? String(student.note) : undefined,
  }
}

function migrateHistoryEntry(entry: Record<string, unknown>): FairnessEntry {
  const classId = String(entry.classId ?? 'homeroom')
  const poolKey = (entry.poolKey as PickerPoolKey | undefined) ?? (classId as PickerPoolKey)
  return {
    id: String(entry.id),
    studentId: String(entry.studentId),
    studentDisplayName: entry.studentDisplayName ? String(entry.studentDisplayName) : undefined,
    poolKey,
    classId,
    timestamp: Number(entry.timestamp ?? Date.now()),
    role: entry.role as FairnessEntry['role'],
    outcome: entry.outcome as FairnessEntry['outcome'],
    date: entry.date ? String(entry.date) : undefined,
    reason: entry.reason ? String(entry.reason) : undefined,
    originalOutcome: entry.originalOutcome as FairnessEntry['originalOutcome'],
    correctedAt: entry.correctedAt ? Number(entry.correctedAt) : undefined,
  }
}

export const usePickerStore = create<PickerStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addStudent: (displayName, classIds, note) => {
        set((state) => {
          const trimmed = displayName.trim()
          const newStudent: Student = {
            id: generateSimpleId(),
            firstName: trimmed,
            lastName: '',
            displayName: trimmed,
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
            firstName: name,
            lastName: '',
            displayName: name,
            isActive: true,
            classes: [classId],
            isAbsent: false,
          }))
          return { students: [...state.students, ...newStudents] }
        })
      },

      importRosterStudents: (students, meta) => {
        set(() => ({
          students,
          importedRosterMeta: meta
            ? {
                schoolYear: meta.schoolYear,
                importedAt: Date.now(),
                sectionsFound: meta.sectionsFound ?? [],
              }
            : undefined,
        }))
      },

      updateStudent: (id, updates) => {
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id !== id) return s
            const next = { ...s, ...updates }
            if (updates.preferredName !== undefined || updates.firstName !== undefined) {
              next.displayName = (next.preferredName?.trim() || next.firstName.trim())
            }
            return next
          }),
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

      startMysterySession: (poolKey, classId, date, studentIds, readingSection) => {
        if (studentIds.length !== 3) return
        const existing = get().activeMysterySessions[poolKey]
        if (existing && existing.status !== 'completed') return

        const now = Date.now()
        set((state) => ({
          activeMysterySessions: {
            ...state.activeMysterySessions,
            [poolKey]: {
              id: generateSimpleId(),
              poolKey,
              classId,
              readingSection,
              date,
              status: 'active',
              createdAt: now,
              updatedAt: now,
              slots: {
                'high-flier-1': { studentId: studentIds[0], status: 'hidden', observations: [] },
                'high-flier-2': { studentId: studentIds[1], status: 'hidden', observations: [] },
                star: { studentId: studentIds[2], status: 'hidden', observations: [] },
              },
            },
          },
        }))
      },

      updateMysterySlot: (poolKey, slotId, status, reason) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state
          const existing = session.slots[slotId]!
          let assignedTitle = existing.assignedTitle
          let assignedTitleId = existing.assignedTitleId
          let titleUsageHistory = state.titleUsageHistory

          if (status === 'earned' && !assignedTitleId) {
            const slotRole = slotId === 'star' ? 'star' : 'high-flier'
            const picked = pickTitleForPool(poolKey, state.titleUsageHistory, { slotRole })
            if (picked) {
              assignedTitle = picked.label
              assignedTitleId = picked.id
              const entry: TitleUsageEntry = {
                titleId: picked.id,
                titleLabel: picked.label,
                poolKey,
                timestamp: Date.now(),
                slotRole,
              }
              titleUsageHistory = [...state.titleUsageHistory, entry]
            }
          }

          if (status !== 'earned') {
            assignedTitle = undefined
            assignedTitleId = undefined
          }

          return {
            titleUsageHistory,
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: {
                    ...existing,
                    status,
                    reason,
                    assignedTitle,
                    assignedTitleId,
                  },
                },
              }),
            },
          }
        })
      },

      clearMysterySlotOutcome: (poolKey, slotId) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state
          const slot = session.slots[slotId]
          if (!slot) return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { ...slot, status: 'hidden', reason: undefined },
                },
              }),
            },
          }
        })
      },

      updateSlotObservation: (poolKey, slotId, behaviorId, value, context) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state
          const slot = session.slots[slotId]
          if (!slot) return state

          const existingIdx = slot.observations.findIndex((o) => o.behaviorId === behaviorId)
          const newObservations = [...slot.observations]

          if (existingIdx >= 0) {
            newObservations[existingIdx] = { ...newObservations[existingIdx], value, context }
          } else {
            newObservations.push({ behaviorId, value, context })
          }

          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { ...slot, observations: newObservations },
                },
              }),
            },
          }
        })
      },

      replaceAbsentMysteryStudent: (poolKey, classId, slotId, newStudentId) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state
          const oldSlot = session.slots[slotId]
          if (!oldSlot) return state

          const newStudents = state.students.map((s) =>
            s.id === oldSlot.studentId ? { ...s, isAbsent: true } : s,
          )

          const newEntry: FairnessEntry = {
            id: generateSimpleId(),
            studentId: oldSlot.studentId,
            studentDisplayName: state.students.find((s) => s.id === oldSlot.studentId)?.displayName,
            poolKey,
            classId,
            timestamp: Date.now(),
            role: slotId === 'star' ? 'mystery-star' : 'mystery-high-flier',
            outcome: 'absent-replaced',
          }

          return {
            students: newStudents,
            fairnessHistory: [...state.fairnessHistory, newEntry],
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({
                ...session,
                slots: {
                  ...session.slots,
                  [slotId]: { studentId: newStudentId, status: 'hidden', observations: [] },
                },
              }),
            },
          }
        })
      },

      updateSessionContext: (poolKey, context) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({ ...session, currentContext: context }),
            },
          }
        })
      },

      canStartReveal: (poolKey) => {
        const session = get().activeMysterySessions[poolKey]
        if (!session || session.status !== 'active') return false

        const s1 = session.slots['high-flier-1']
        const s2 = session.slots['high-flier-2']
        const s3 = session.slots.star

        if (!s1 || !s2 || !s3) return false
        if (s1.status === 'hidden' || s2.status === 'hidden' || s3.status === 'hidden') return false

        return true
      },

      advanceMysteryReveal: (poolKey) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state

          let newStatus: MysteryRevealStatus = session.status
          if (session.status === 'active') {
            if (!get().canStartReveal(poolKey)) return state
            newStatus = 'revealed-1'
          } else if (session.status === 'revealed-1') newStatus = 'revealed-2'
          else if (session.status === 'revealed-2') newStatus = 'revealed-3'
          else if (session.status === 'revealed-3') newStatus = 'completed'

          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({ ...session, status: newStatus }),
            },
          }
        })
      },

      revealMysteryStep: (poolKey, step) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session) return state

          const order: Array<'active' | 'revealed-1' | 'revealed-2' | 'revealed-3'> = [
            'active',
            'revealed-1',
            'revealed-2',
            'revealed-3',
          ]
          const currentIdx = order.indexOf(session.status as typeof order[number])
          const targetIdx = order.indexOf(step)
          if (targetIdx < 0 || targetIdx <= currentIdx) return state

          if (session.status === 'active' && !get().canStartReveal(poolKey)) return state

          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({ ...session, status: step as MysteryRevealStatus }),
            },
          }
        })
      },

      replayReveal: (poolKey) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session || session.status !== 'completed') return state
          return {
            activeMysterySessions: {
              ...state.activeMysterySessions,
              [poolKey]: touchSession({ ...session, status: 'revealed-1' as MysteryRevealStatus }),
            },
          }
        })
      },

      cancelMysterySession: (poolKey) => {
        set((state) => ({
          activeMysterySessions: { ...state.activeMysterySessions, [poolKey]: null },
        }))
      },

      commitMysterySession: (poolKey) => {
        set((state) => {
          const session = state.activeMysterySessions[poolKey]
          if (!session || session.status !== 'completed') return state

          const newEntries: FairnessEntry[] = []
          const now = Date.now()
          const roles: MysterySlotId[] = ['high-flier-1', 'high-flier-2', 'star']

          for (const slotId of roles) {
            const slot = session.slots[slotId]
            if (slot && (slot.status === 'earned' || slot.status === 'did-not-earn')) {
              newEntries.push({
                id: generateSimpleId(),
                studentId: slot.studentId,
                studentDisplayName: state.students.find((s) => s.id === slot.studentId)?.displayName,
                poolKey,
                classId: session.classId,
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
            activeMysterySessions: { ...state.activeMysterySessions, [poolKey]: null },
          }
        })
      },

      resetPool: (poolKey) => {
        set((state) => ({
          fairnessHistory: state.fairnessHistory.filter((h) => (h.poolKey ?? h.classId) !== poolKey),
        }))
      },

      recordQuickPick: (poolKey, classId, studentId) => {
        set((state) => ({
          fairnessHistory: [
            ...state.fairnessHistory,
            {
              id: generateSimpleId(),
              studentId,
              studentDisplayName: state.students.find((s) => s.id === studentId)?.displayName,
              poolKey,
              classId,
              timestamp: Date.now(),
              role: 'quick-pick',
              outcome: 'quick-picked',
            },
          ],
        }))
      },

      clearQuickPickHistory: (poolKey) => {
        set((state) => ({
          fairnessHistory: state.fairnessHistory.filter(
            (h) => !((h.poolKey ?? h.classId) === poolKey && h.role === 'quick-pick'),
          ),
        }))
      },

      correctOutcome: (poolKey, eventId, nextOutcome) => {
        set((state) => ({
          fairnessHistory: state.fairnessHistory.map((h) => {
            if (h.id === eventId && (h.poolKey ?? h.classId) === poolKey) {
              return {
                ...h,
                originalOutcome: h.originalOutcome || h.outcome,
                outcome: nextOutcome,
                correctedAt: Date.now(),
              }
            }
            return h
          }),
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
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<PickerStoreState> & {
          students?: Array<Record<string, unknown>>
          fairnessHistory?: Array<Record<string, unknown>>
          activeMysterySessions?: Record<string, Record<string, unknown> | null>
        }

        const migratedStudents = (state.students ?? []).map(migrateStudent)
        const migratedHistory = (state.fairnessHistory ?? []).map(migrateHistoryEntry)

        const migratedSessions: Record<string, ReturnType<typeof migrateLegacySession> | null> = {
          ...defaultSessions,
        }
        for (const [key, session] of Object.entries(state.activeMysterySessions ?? {})) {
          migratedSessions[key] = session ? migrateLegacySession(session) : null
        }

        return {
          ...initialState,
          ...state,
          students: migratedStudents,
          fairnessHistory: migratedHistory,
          titleUsageHistory: state.titleUsageHistory ?? [],
          activeMysterySessions: migratedSessions,
          coachingConfig: { ...initialState.coachingConfig, ...(state.coachingConfig || {}) },
          settings: { ...initialState.settings, ...(state.settings || {}) },
        }
      },
    },
  ),
)

export { STORAGE_KEY as PICKER_STORAGE_KEY }
