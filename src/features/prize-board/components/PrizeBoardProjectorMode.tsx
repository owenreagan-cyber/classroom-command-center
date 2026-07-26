import { memo } from 'react'
import { stripPrivateBoardFields } from '../displaySafe'
import { getDisplayGameStatus } from '../pressYourLuck/displayPrivacy'
import { shouldShowProjectorMode } from '../pressYourLuck/spinEngine'
import { useSpinAnimation } from '../pressYourLuck/useSpinAnimation'
import { usePressYourLuckStore } from '../pressYourLuck/pressYourLuckStore'
import { usePrizeBoardStore } from '../prizeBoardStore'
import { MysteryBoxRevealOverlay } from './MysteryBoxRevealOverlay'
import { PrizeBoardDisplayGrid } from './PrizeBoardDisplayGrid'
import { PrizeRevealOverlay } from './PrizeRevealOverlay'
import { WhammyRevealOverlay } from './WhammyRevealOverlay'

/** Fullscreen projector view — student-safe, no teacher controls. */
export const PrizeBoardProjectorMode = memo(function PrizeBoardProjectorMode() {
  const phase = usePressYourLuckStore((s) => s.phase)
  const poolKey = usePressYourLuckStore((s) => s.activePoolKey)
  const highlightedTileId = usePressYourLuckStore((s) => s.highlightedTileId)
  const finalTileId = usePressYourLuckStore((s) => s.finalTileId)
  const remainingSpins = usePressYourLuckStore((s) => s.remainingSpins)
  const currentSpinCount = usePressYourLuckStore((s) => s.currentSpinCount)

  const board = usePrizeBoardStore((s) => (poolKey ? s.boards[poolKey] : null))

  useSpinAnimation()

  if (!shouldShowProjectorMode(phase) || !board || !poolKey) {
    return null
  }

  const safeBoard = stripPrivateBoardFields(board)
  const status = getDisplayGameStatus({ phase, remainingSpins, currentSpinCount })

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950 p-4 md:p-8"
      data-projector-mode="prize-board"
    >
      <header className="mb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/90">
          Press Your Luck
        </p>
        <h1 className="mt-1 text-2xl font-black text-white md:text-4xl">{status}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Spin {currentSpinCount} · {remainingSpins} remaining
        </p>
      </header>

      <PrizeBoardDisplayGrid
        tiles={safeBoard.tiles}
        highlightedTileId={highlightedTileId}
        finalTileId={finalTileId}
      />

      <WhammyRevealOverlay />
      <MysteryBoxRevealOverlay />
      <PrizeRevealOverlay />
    </div>
  )
})
