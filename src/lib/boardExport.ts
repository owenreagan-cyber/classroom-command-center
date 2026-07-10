import type { BoardExportPayload, BoardState } from '../data/types'

export function createBoardExportPayload(state: BoardState): BoardExportPayload {
  return {
    app: 'classroom-command-center',
    version: 1,
    exportedAt: new Date().toISOString(),
    state: structuredClone(state),
  }
}

export function downloadBoardExport(payload: BoardExportPayload) {
  const encoded = JSON.stringify(payload, null, 2)
  const blob = new Blob([encoded], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = payload.exportedAt.slice(0, 10)

  anchor.href = url
  anchor.download = `classroom-command-center-board-${stamp}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function parseBoardExportPayload(raw: string): BoardExportPayload {
  const parsed = JSON.parse(raw) as Partial<BoardExportPayload>

  if (
    parsed.app !== 'classroom-command-center' ||
    parsed.version !== 1 ||
    !parsed.state
  ) {
    throw new Error('This is not a valid Classroom Command Center export.')
  }

  return parsed as BoardExportPayload
}

export function isBoardState(value: unknown): value is BoardState {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<BoardState>

  return Boolean(
    candidate.mode &&
      candidate.activeScreen &&
      candidate.backgroundId &&
      candidate.contents &&
      candidate.teacherNotes &&
      candidate.cardVisibility &&
      Array.isArray(candidate.customPresets),
  )
}
