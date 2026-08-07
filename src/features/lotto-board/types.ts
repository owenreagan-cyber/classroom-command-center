/**
 * Lotto Board — classroom bingo/lotto number selector.
 *
 * Teacher sets weekly draw count, draws unique random numbers 1–100.
 * Drawn numbers are pending until confirmed ("Done"), then removed from pool.
 * State persists via Zustand + localStorage.
 */

export interface LottoDrawRecord {
  id: string
  numbers: number[]
  confirmedAt: number
  drawCount: number
  remainingAfter: number
}

export interface LottoBoardState {
  boardId: string
  rangeStart: number
  rangeEnd: number
  availableNumbers: number[]
  pendingNumbers: number[]
  usedNumbers: number[]
  drawHistory: LottoDrawRecord[]
  weeklyDrawCount: number
  lastDrawAt: number | null
  updatedAt: number
  createdAt: number
}

export interface DisplaySafeLottoState {
  pendingNumbers: number[]
  remainingCount: number
  usedCount: number
  weeklyDrawCount: number
  status: 'ready' | 'drawing' | 'complete'
}

export interface DrawResult {
  ok: boolean
  numbers: number[]
  remainingAfter: number
  message?: string
}
