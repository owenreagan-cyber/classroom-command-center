import { useMemo } from 'react'
import { useHundredBoardStore } from '../hundred-board/hundredBoardStore'
import { HundredBoardDisplay } from '../hundred-board/HundredBoardDisplay'
import type { DisplaySafeTile, DisplaySafeBoard } from '../hundred-board/types'

export function HundredBoardDisplayWidget() {
  const tiles = useHundredBoardStore((s) => s.tiles)
  const outcomes = useHundredBoardStore((s) => s.outcomes)
  const activeTileNumber = useHundredBoardStore((s) => s.activeTileNumber)
  const revealState = useHundredBoardStore((s) => s.revealState)
  const boardId = useHundredBoardStore((s) => s.boardId)
  const completedCount = useHundredBoardStore((s) => s.completedCount)

  const board: DisplaySafeBoard = useMemo(() => {
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
      revealedCount: completedCount,
    }
  }, [tiles, outcomes, activeTileNumber, revealState, boardId, completedCount])

  if (!tiles.some((t) => t.state !== 'unopened') && completedCount === 0) {
    return (
      <div className="rounded-2xl bg-slate-950/50 px-6 py-4 backdrop-blur-sm shadow-lg text-center">
        <p className="text-2xl font-bold text-white">🔢 100 Board</p>
        <p className="text-sm text-slate-400 mt-1">Waiting for teacher...</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-950/50 p-4 backdrop-blur-sm shadow-lg">
      <p className="text-sm font-semibold text-slate-300 mb-2 text-center">
        🔢 100 Board — {completedCount}/100 found
      </p>
      <HundredBoardDisplay board={board} />
    </div>
  )
}
