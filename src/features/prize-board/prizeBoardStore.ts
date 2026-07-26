import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PickerPoolKey } from '../roster/types'
import { generateBoardTiles } from './boardGenerator'
import { DEFAULT_PRIZE_BANK } from './defaultPrizes'
import { getPrizeById, isMysteryBoxPrize } from './prizeBank'
import type { PrizeBoardStoreState, PrizeBoardTile, PrizeRevealEntry } from './types'
import { PRIZE_BOARD_SIZE } from './types'

const STORAGE_KEY = 'classroom-prize-board-storage-v1'

const defaultBoards: Record<string, null> = {
  homeroom: null,
  math: null,
  reading: null,
  'reading:RM4': null,
  'reading:SM5': null,
}

const generateId = () => Math.random().toString(36).slice(2, 10)

function touchBoard<T extends { updatedAt: number }>(board: T): T {
  return { ...board, updatedAt: Date.now() }
}

function validateTileIndex(index: number): boolean {
  return index >= 0 && index < PRIZE_BOARD_SIZE
}

export const usePrizeBoardStore = create<PrizeBoardStoreState>()(
  persist(
    (set, get) => ({
      prizeBank: DEFAULT_PRIZE_BANK,
      prizeOverrides: {},
      boards: { ...defaultBoards },

      setPrizeActive: (prizeId, active) => {
        set((state) => ({
          prizeOverrides: {
            ...state.prizeOverrides,
            [prizeId]: { ...state.prizeOverrides[prizeId], active },
          },
        }))
      },

      updatePrizeOverride: (prizeId, override) => {
        set((state) => ({
          prizeOverrides: {
            ...state.prizeOverrides,
            [prizeId]: { ...state.prizeOverrides[prizeId], ...override },
          },
        }))
      },

      resetPrizeOverrides: () => {
        set({ prizeOverrides: {} })
      },

      generateBoard: (poolKey, studentIds) => {
        const state = get()
        const now = Date.now()
        const studentEntries = studentIds?.map((id) => {
          return { id, displayName: id }
        })

        const tiles = generateBoardTiles(state.prizeBank, state.prizeOverrides, {
          studentIds: studentEntries,
        })

        set((s) => ({
          boards: {
            ...s.boards,
            [poolKey]: {
              id: generateId(),
              poolKey,
              tiles,
              createdAt: now,
              updatedAt: now,
              revealHistory: [],
            },
          },
        }))
      },

      resetBoard: (poolKey) => {
        set((state) => ({
          boards: { ...state.boards, [poolKey]: null },
        }))
      },

      assignStudentToTile: (poolKey, tileIndex, studentId, displayName) => {
        if (!validateTileIndex(tileIndex)) return
        set((state) => {
          const board = state.boards[poolKey]
          if (!board) return state
          const tiles = [...board.tiles]
          tiles[tileIndex] = {
            index: tileIndex,
            kind: 'student',
            studentId,
            studentDisplayName: displayName,
          }
          return {
            boards: {
              ...state.boards,
              [poolKey]: touchBoard({ ...board, tiles }),
            },
          }
        })
      },

      clearTile: (poolKey, tileIndex) => {
        if (!validateTileIndex(tileIndex)) return
        set((state) => {
          const board = state.boards[poolKey]
          if (!board) return state
          const tiles = [...board.tiles]
          tiles[tileIndex] = { index: tileIndex, kind: 'empty' }
          return {
            boards: {
              ...state.boards,
              [poolKey]: touchBoard({ ...board, tiles }),
            },
          }
        })
      },

      revealTile: (poolKey, tileIndex) => {
        if (!validateTileIndex(tileIndex)) return
        set((state) => {
          const board = state.boards[poolKey]
          if (!board) return state
          const tile = board.tiles[tileIndex]
          if (!tile || tile.kind === 'empty' || tile.kind === 'revealed') return state

          const prizeId = tile.prizeId
          const prize = prizeId
            ? getPrizeById(prizeId, state.prizeBank, state.prizeOverrides)
            : undefined

          const nextTile: PrizeBoardTile = {
            ...tile,
            kind: 'revealed',
            revealedAt: Date.now(),
          }

          const entry: PrizeRevealEntry = {
            id: generateId(),
            tileIndex,
            prizeId: prizeId ?? 'student-tile',
            prizeLabel: prize?.label ?? tile.studentDisplayName ?? 'Tile',
            studentId: tile.studentId,
            studentDisplayName: tile.studentDisplayName,
            timestamp: Date.now(),
          }

          const tiles = [...board.tiles]
          tiles[tileIndex] = nextTile

          return {
            boards: {
              ...state.boards,
              [poolKey]: touchBoard({
                ...board,
                tiles,
                revealHistory: [...board.revealHistory, entry],
              }),
            },
          }
        })
      },

      openMysteryBox: (poolKey, tileIndex, innerPrizeId) => {
        if (!validateTileIndex(tileIndex)) return
        set((state) => {
          const board = state.boards[poolKey]
          if (!board) return state
          const tile = board.tiles[tileIndex]
          if (!tile?.prizeId || !isMysteryBoxPrize(tile.prizeId)) return state

          const inner = getPrizeById(innerPrizeId, state.prizeBank, state.prizeOverrides)
          if (!inner) return state

          const tiles = [...board.tiles]
          tiles[tileIndex] = {
            ...tile,
            kind: 'revealed',
            revealedPrizeId: innerPrizeId,
            revealedAt: Date.now(),
          }

          const entry: PrizeRevealEntry = {
            id: generateId(),
            tileIndex,
            prizeId: tile.prizeId,
            prizeLabel: 'Mystery Box',
            revealedPrizeId: innerPrizeId,
            revealedPrizeLabel: inner.label,
            studentId: tile.studentId,
            studentDisplayName: tile.studentDisplayName,
            timestamp: Date.now(),
          }

          return {
            boards: {
              ...state.boards,
              [poolKey]: touchBoard({
                ...board,
                tiles,
                revealHistory: [...board.revealHistory, entry],
              }),
            },
          }
        })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        prizeBank: state.prizeBank,
        prizeOverrides: state.prizeOverrides,
        boards: state.boards,
      }),
    },
  ),
)

export { STORAGE_KEY as PRIZE_BOARD_STORAGE_KEY }

/** Generate board with display names resolved from student list */
export function generateBoardForPool(
  poolKey: PickerPoolKey,
  students: Array<{ id: string; displayName: string }>,
  prizeCount?: number,
) {
  const state = usePrizeBoardStore.getState()
  const now = Date.now()
  const tiles = generateBoardTiles(state.prizeBank, state.prizeOverrides, {
    studentIds: students,
    prizeCount,
  })

  usePrizeBoardStore.setState((s) => ({
    boards: {
      ...s.boards,
      [poolKey]: {
        id: generateId(),
        poolKey,
        tiles,
        createdAt: now,
        updatedAt: now,
        revealHistory: [],
      },
    },
  }))
}
