/**
 * 100 Board — standalone teacher-picks-tiles game.
 *
 * Independent from Prize Board/Press Your Luck. Uses the Phase 15H
 * prize catalog for outcome generation. Student-safe by design:
 * /display only sees reveal results, never tile internals or odds.
 */

import type { PrizeRarity } from '../prize-board/types'

export type BoardTileState = 'unopened' | 'selected' | 'revealed' | 'claimed'

export interface BoardTile {
  tileNumber: number // 1-100
  state: BoardTileState
  outcomeIndex: number | null // index into outcomes[]
  revealedAt: number | null
}

export type BoardOutcomeKind = 'prize' | 'tryAgain' | 'whammy' | 'bonus'

export interface BoardOutcome {
  id: string
  kind: BoardOutcomeKind
  prizeId?: string
  label: string
  displayLabel: string // student-safe label for /display
  rarity?: PrizeRarity
  displayEmoji?: string
  teacherNote?: string // never shown on /display
}

export interface HundredBoardState {
  boardId: string
  tiles: BoardTile[]
  outcomes: BoardOutcome[]
  activeTileNumber: number | null
  revealState: 'idle' | 'showing'
  createdAt: number
  updatedAt: number
  completedCount: number
}

export interface DisplaySafeTile {
  tileNumber: number
  state: 'unopened' | 'selected' | 'revealed' | 'claimed'
  label?: string
  displayEmoji?: string
  rarity?: PrizeRarity
}

export interface DisplaySafeBoard {
  boardId: string
  tiles: DisplaySafeTile[]
  activeTileNumber: number | null
  revealState: 'idle' | 'showing'
  totalTiles: number
  revealedCount: number
}
