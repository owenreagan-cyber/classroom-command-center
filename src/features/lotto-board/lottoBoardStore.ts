import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LottoBoardState, DisplaySafeLottoState, LottoDrawRecord } from './types'
import { drawUniqueNumbers, createInitialNumbers } from './drawLogic'

const STORAGE_KEY = 'classroom-lotto-board-v1'

function generateId(): string { return `lb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

interface LottoBoardStore extends LottoBoardState {
  setWeeklyDrawCount: (count: number) => { ok: boolean; message?: string }
  drawNumbers: () => { ok: boolean; numbers?: number[]; message?: string }
  confirmPendingDraw: () => void
  clearPendingDraw: () => void
  undoLastConfirm: () => void
  resetBoard: () => void
  initializeBoard: () => void
  getDisplaySafeBoard: () => DisplaySafeLottoState
}

function freshState(boardId?: string): LottoBoardState {
  return {
    boardId: boardId ?? generateId(),
    rangeStart: 1,
    rangeEnd: 100,
    availableNumbers: createInitialNumbers(1, 100),
    pendingNumbers: [],
    usedNumbers: [],
    drawHistory: [],
    weeklyDrawCount: 5,
    lastDrawAt: null,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  }
}

export const useLottoBoardStore = create<LottoBoardStore>()(
  persist(
    (set, get) => ({
      ...freshState(),

      setWeeklyDrawCount: (count) => {
        if (count < 1) return { ok: false, message: 'Draw count must be at least 1.' }
        if (count > 100) return { ok: false, message: 'Draw count cannot exceed 100.' }
        set({ weeklyDrawCount: count, updatedAt: Date.now() })
        return { ok: true }
      },

      drawNumbers: () => {
        const { availableNumbers, weeklyDrawCount } = get()
        if (availableNumbers.length === 0) {
          return { ok: false, message: 'No numbers remaining. Reset the board to draw again.' }
        }
        const result = drawUniqueNumbers(availableNumbers, weeklyDrawCount)
        if (!result.ok) return result
        set({
          pendingNumbers: result.numbers,
          lastDrawAt: Date.now(),
          updatedAt: Date.now(),
        })
        return result
      },

      confirmPendingDraw: () => {
        const { pendingNumbers, availableNumbers, usedNumbers, drawHistory } = get()
        if (pendingNumbers.length === 0) return

        const newUsed = [...usedNumbers, ...pendingNumbers]
        const newAvailable = availableNumbers.filter((n) => !pendingNumbers.includes(n))
        const record: LottoDrawRecord = {
          id: generateId(),
          numbers: [...pendingNumbers],
          confirmedAt: Date.now(),
          drawCount: pendingNumbers.length,
          remainingAfter: newAvailable.length,
        }

        set({
          availableNumbers: newAvailable,
          usedNumbers: newUsed,
          pendingNumbers: [],
          drawHistory: [...drawHistory, record],
          updatedAt: Date.now(),
        })
      },

      clearPendingDraw: () => {
        const { pendingNumbers } = get()
        if (pendingNumbers.length === 0) return
        set({ pendingNumbers: [], updatedAt: Date.now() })
      },

      undoLastConfirm: () => {
        const { drawHistory, usedNumbers, availableNumbers } = get()
        if (drawHistory.length === 0) return

        const last = drawHistory[drawHistory.length - 1]!
        const restoredAvailable = [...availableNumbers, ...last.numbers].sort((a, b) => a - b)
        const restoredUsed = usedNumbers.filter((n) => !last.numbers.includes(n))

        set({
          availableNumbers: restoredAvailable,
          usedNumbers: restoredUsed,
          drawHistory: drawHistory.slice(0, -1),
          updatedAt: Date.now(),
        })
      },

      resetBoard: () => {
        set({ ...freshState() })
      },

      initializeBoard: () => {
        const { availableNumbers } = get()
        if (availableNumbers.length !== 100) {
          set({ ...freshState() })
        }
      },

      getDisplaySafeBoard: (): DisplaySafeLottoState => {
        const { pendingNumbers, availableNumbers, usedNumbers, weeklyDrawCount } = get()
        const completed = availableNumbers.length === 0
        const drawing = pendingNumbers.length > 0
        return {
          pendingNumbers: [...pendingNumbers],
          remainingCount: availableNumbers.length,
          usedCount: usedNumbers.length,
          weeklyDrawCount,
          status: completed ? 'complete' : drawing ? 'drawing' : 'ready',
        }
      },
    }),
    { name: STORAGE_KEY },
  ),
)
