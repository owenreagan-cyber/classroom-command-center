import { useRef, useState } from 'react'
import type { BoardExportPayload, BoardState } from '../data/types'
import {
  createBoardExportPayload,
  downloadBoardExport,
  isBoardState,
  parseBoardExportPayload,
} from '../lib/boardExport'

interface BoardBackupPanelProps {
  boardState: BoardState
  onImportBoardState: (payload: BoardExportPayload) => void
}

export function BoardBackupPanel({
  boardState,
  onImportBoardState,
}: BoardBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  const handleExport = () => {
    downloadBoardExport(createBoardExportPayload(boardState))
    setStatus('Board export downloaded.')
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return

    try {
      const raw = await file.text()
      const payload = parseBoardExportPayload(raw)

      if (!isBoardState(payload.state)) {
        throw new Error('Export file is missing required board state fields.')
      }

      onImportBoardState(payload)
      setStatus('Board import complete.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Backup / Restore
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Export or import a local JSON backup. Import replaces the current
          board state.
        </p>
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="w-full rounded-xl border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
      >
        Export board JSON
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleImportFile(event.target.files?.[0])}
        className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
      />

      {status && (
        <p className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs leading-relaxed text-slate-300">
          {status}
        </p>
      )}
    </section>
  )
}
