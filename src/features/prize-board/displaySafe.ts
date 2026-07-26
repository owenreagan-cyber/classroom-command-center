import type { PrizeBoardSession, PrizeBoardTile } from './types'

/** Student-safe board snapshot for /display — no hidden prizes, settings, or raw ids. */
export interface DisplaySafeBoardTile {
  index: number
  label: string
  isRevealed: boolean
  rarityLabel?: string
}

export interface DisplaySafeBoardSnapshot {
  poolKey: string
  tileCount: number
  revealedTiles: DisplaySafeBoardTile[]
}

export function toDisplaySafeBoardSnapshot(
  session: PrizeBoardSession | null | undefined,
  prizeLabels: Map<string, { label: string; rarity?: string }>,
): DisplaySafeBoardSnapshot | null {
  if (!session) return null

  const revealedTiles: DisplaySafeBoardTile[] = session.tiles
    .filter((t) => t.kind === 'revealed')
    .map((t) => tileToDisplaySafe(t, prizeLabels))

  return {
    poolKey: session.poolKey,
    tileCount: session.tiles.length,
    revealedTiles,
  }
}

function tileToDisplaySafe(
  tile: PrizeBoardTile,
  prizeLabels: Map<string, { label: string; rarity?: string }>,
): DisplaySafeBoardTile {
  const prizeId = tile.revealedPrizeId ?? tile.prizeId
  const prizeInfo = prizeId ? prizeLabels.get(prizeId) : undefined

  if (tile.studentDisplayName && tile.kind === 'revealed') {
    return {
      index: tile.index,
      label: tile.studentDisplayName,
      isRevealed: true,
    }
  }

  return {
    index: tile.index,
    label: prizeInfo?.label ?? 'Prize',
    isRevealed: true,
    rarityLabel: prizeInfo?.rarity,
  }
}

/** Strip teacher-only fields from a board session. */
export function stripPrivateBoardFields(session: PrizeBoardSession): Pick<PrizeBoardSession, 'poolKey' | 'tiles'> {
  return {
    poolKey: session.poolKey,
    tiles: session.tiles.map((t) => ({
      index: t.index,
      kind: t.kind === 'prize' ? 'empty' : t.kind,
      studentDisplayName: t.kind === 'revealed' ? t.studentDisplayName : undefined,
      revealedAt: t.revealedAt,
    })),
  }
}

export function boardSnapshotHasNoStudentIds(snapshot: DisplaySafeBoardSnapshot | null): boolean {
  if (!snapshot) return true
  const json = JSON.stringify(snapshot)
  return !json.includes('studentId') && !json.includes('prizeId')
}
