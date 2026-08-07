import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HundredBoardState, DisplaySafeBoard, DisplaySafeTile } from './types'
import type { Prize, PrizeSettingsOverride } from '../prize-board/types'
import { generateBoardOutcomes, generateBoardTiles } from './outcomeGenerator'

const STORAGE_KEY = 'classroom-hundred-board-v1'

interface HundredBoardStore extends HundredBoardState {
  newBoard: (prizeBank: Prize[], prizeOverrides: Record<string, PrizeSettingsOverride>) => void
  selectTile: (tileNumber: number) => void
  revealSelectedTile: () => void
  markTileClaimed: (tileNumber: number) => void
  resetBoard: (prizeBank: Prize[], prizeOverrides: Record<string, PrizeSettingsOverride>) => void
  undoLastReveal: () => void
  getDisplaySafeBoard: () => DisplaySafeBoard
}

function createBoardId(): string {
  return `hb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export const useHundredBoardStore = create<HundredBoardStore>()(
  persist(
    (set, get) => ({
      // ── State ──
      boardId: createBoardId(),
      tiles: Array.from({ length: 100 }, (_, i) => ({
        tileNumber: i + 1,
        state: 'unopened' as const,
        outcomeIndex: null,
        revealedAt: null,
      })),
      outcomes: [],
      activeTileNumber: null,
      revealState: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedCount: 0,

      // ── Actions ──
      newBoard: (prizeBank, prizeOverrides) => {
        const allOutcomes = generateBoardOutcomes({ prizeBank, prizeOverrides })
        const { tiles, sortedOutcomes } = generateBoardTiles(allOutcomes)
        set({
          boardId: createBoardId(),
          tiles,
          outcomes: sortedOutcomes,
          activeTileNumber: null,
          revealState: 'idle',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completedCount: 0,
        })
      },

      selectTile: (tileNumber) => {
        const { tiles } = get()
        if (tileNumber < 1 || tileNumber > 100) return
        const tile = tiles[tileNumber - 1]
        if (!tile || tile.state === 'revealed' || tile.state === 'claimed') return

        const next = tiles.map((t) => {
          if (t.tileNumber === tileNumber) {
            return t.state === 'selected'
              ? { ...t, state: 'unopened' as const }
              : { ...t, state: 'selected' as const }
          }
          return t.state === 'selected'
            ? { ...t, state: 'unopened' as const }
            : t
        })

        const stillSelected = next.find((t) => t.state === 'selected')
        set({
          tiles: next,
          activeTileNumber: stillSelected?.tileNumber ?? null,
          revealState: 'idle',
          updatedAt: Date.now(),
        })
      },

      revealSelectedTile: () => {
        const { tiles, outcomes, activeTileNumber } = get()
        if (!activeTileNumber) return
        const tile = tiles[activeTileNumber - 1]
        if (!tile || tile.state !== 'selected' || tile.outcomeIndex === null) return

        const outcome = outcomes[tile.outcomeIndex]
        if (!outcome) return

        const next = tiles.map((t) =>
          t.tileNumber === activeTileNumber
            ? { ...t, state: 'revealed' as const, revealedAt: Date.now() }
            : t,
        )

        const completed = next.filter((t) => t.state === 'revealed' || t.state === 'claimed').length

        set({
          tiles: next,
          activeTileNumber,
          revealState: 'showing',
          completedCount: completed,
          updatedAt: Date.now(),
        })
      },

      markTileClaimed: (tileNumber) => {
        const { tiles } = get()
        const tile = tiles[tileNumber - 1]
        if (!tile || tile.state !== 'revealed') return

        const next = tiles.map((t) =>
          t.tileNumber === tileNumber
            ? { ...t, state: 'claimed' as const }
            : t,
        )

        set({ tiles: next, updatedAt: Date.now() })
      },

      resetBoard: (prizeBank, prizeOverrides) => {
        const allOutcomes = generateBoardOutcomes({ prizeBank, prizeOverrides })
        const { tiles, sortedOutcomes } = generateBoardTiles(allOutcomes)
        set({
          boardId: createBoardId(),
          tiles,
          outcomes: sortedOutcomes,
          activeTileNumber: null,
          revealState: 'idle',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          completedCount: 0,
        })
      },

      undoLastReveal: () => {
        const { tiles } = get()
        // Find the most recent revealed tile
        let lastRevealedIdx = -1
        let lastRevealedTime = 0
        for (let i = 0; i < tiles.length; i++) {
          const t = tiles[i]!
          if (t.state === 'revealed' && t.revealedAt && t.revealedAt > lastRevealedTime) {
            lastRevealedTime = t.revealedAt
            lastRevealedIdx = i
          }
        }
        if (lastRevealedIdx < 0) return

        const next = tiles.map((t, i) =>
          i === lastRevealedIdx
            ? { ...t, state: 'unopened' as const, revealedAt: null }
            : t,
        )

        const completed = next.filter((t) => t.state === 'revealed' || t.state === 'claimed').length

        set({
          tiles: next,
          activeTileNumber: null,
          revealState: 'idle',
          completedCount: completed,
          updatedAt: Date.now(),
        })
      },

      getDisplaySafeBoard: () => {
        const { tiles, outcomes, activeTileNumber, revealState, boardId } = get()
        const safeTiles: DisplaySafeTile[] = tiles.map((t) => {
          const base: DisplaySafeTile = {
            tileNumber: t.tileNumber,
            state: t.state,
          }
          if ((t.state === 'revealed' || t.state === 'claimed') && t.outcomeIndex !== null) {
            const outcome = outcomes[t.outcomeIndex]
            if (outcome) {
              base.label = outcome.displayLabel
              base.displayEmoji = outcome.displayEmoji
              base.rarity = outcome.rarity
            }
          }
          return base
        })

        return {
          boardId,
          tiles: safeTiles,
          activeTileNumber: revealState === 'idle' ? activeTileNumber : null,
          revealState,
          totalTiles: 100,
          revealedCount: tiles.filter((t) => t.state === 'revealed' || t.state === 'claimed').length,
        }
      },
    }),
    { name: STORAGE_KEY },
  ),
)
