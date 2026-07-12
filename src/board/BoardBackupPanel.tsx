import { useMemo, useRef, useState } from 'react'
import type { BoardExportPayload, BoardState } from '../data/types'
import { validatePacket } from '../features/local-packets/packetValidation'
import { restoreBackupToStores } from '../features/local-packets/packetStoreAdapter'
import type { BackupBoardContent } from '../features/local-packets/types'
import {
  createBoardExportPayload,
  downloadBoardExport,
  isBoardState,
  parseBoardExportPayload,
} from '../lib/boardExport'
import {
  getBoardStorageHealth,
  summarizeBoardExport,
  type BoardExportSummary,
} from '../lib/boardStorageHealth'

interface BoardBackupPanelProps {
  boardState: BoardState
}

export function BoardBackupPanel({
  boardState,
}: BoardBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [pendingImport, setPendingImport] = useState<BoardExportPayload | null>(
    null,
  )
  const [pendingSummary, setPendingSummary] = useState<BoardExportSummary | null>(
    null,
  )
  const health = useMemo(() => getBoardStorageHealth(boardState), [boardState])

  const handleExport = () => {
    const payload = createBoardExportPayload(boardState)
    downloadBoardExport(payload)
    setStatus(
      `Board export downloaded with ${payload.state.customPresets.length} custom preset(s).`,
    )
  }

  const clearPendingImport = () => {
    setPendingImport(null)
    setPendingSummary(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return

    try {
      const raw = await file.text()
      const payload = parseBoardExportPayload(raw)

      if (!isBoardState(payload.state)) {
        throw new Error('Export file is missing required board state fields.')
      }

      setPendingImport(payload)
      setPendingSummary(summarizeBoardExport(payload))
      setStatus('Review the import summary, then confirm restore.')
    } catch (error) {
      clearPendingImport()
      setStatus(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  const confirmImport = () => {
    if (!pendingImport) return

    // Convert legacy board state to the unified full-backup packet format
    const envelope = {
      format: 'classroom-command-center' as const,
      kind: 'full-backup' as const,
      version: 1,
      exportedAt: pendingImport.exportedAt,
      payload: {
        categories: {
          board: pendingImport.state as unknown as BackupBoardContent,
        },
        exportedCategories: ['board'],
      },
    }

    // Validate the packet through the unified validator
    const rawJson = JSON.stringify(envelope)
    const validationResult = validatePacket(rawJson)
    if (!validationResult.valid) {
      setStatus(`Import rejected by validator: ${validationResult.errors.map((e) => `${e.field}: ${e.message}`).join('; ')}`)
      clearPendingImport()
      return
    }

    // Apply the restore via the unified coordinator for safety, protection, and undo guarantees
    const result = restoreBackupToStores({
      packet: envelope.payload,
      selectedCategories: ['board'],
      replaceTimerRuntime: false,
      replaceActiveMystery: false,
    })

    if (result.success) {
      setStatus('Board import complete (Undo is available in the Local Packets restore tab).')
    } else {
      setStatus(`Import failed: ${result.errors.join('; ')}`)
    }
    clearPendingImport()
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Backup / Restore <span className="ml-1 rounded bg-slate-700 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Legacy</span>
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Export or import a local JSON backup. Import replaces the current
          board state after confirmation.
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-amber-500/70">
          Legacy — use the Local Packets panel above for backup/restore with
          validation, category selection, and safety guarantees.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <StorageStat label="Storage" value={health.hasPersistedState ? 'Saved' : 'Empty'} />
        <StorageStat label="Size" value={health.persistedKb} />
        <StorageStat label="Presets" value={String(health.customPresetCount)} />
        <StorageStat label="Notes" value={String(health.teacherNoteCount)} />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-400">
        <p>
          Key: <span className="font-mono text-slate-200">{health.storageKey}</span>
        </p>
        <p>
          Version: <span className="font-mono text-slate-200">{health.storageVersion}</span>
        </p>
        <p>
          Active screen:{' '}
          <span className="font-mono text-slate-200">{health.activeScreen}</span>
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

      {pendingSummary && (
        <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-950/20 p-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
            Confirm restore
          </h3>
          <p className="text-xs leading-relaxed text-amber-100/90">
            This will replace the current board state with the imported backup.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StorageStat
              label="Exported"
              value={new Date(pendingSummary.exportedAt).toLocaleDateString()}
            />
            <StorageStat label="Screen" value={pendingSummary.activeScreen} />
            <StorageStat
              label="Presets"
              value={String(pendingSummary.customPresetCount)}
            />
            <StorageStat
              label="Notes"
              value={String(pendingSummary.teacherNoteCount)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-lg border border-amber-300/50 bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Confirm restore
            </button>
            <button
              type="button"
              onClick={() => {
                clearPendingImport()
                setStatus('Import canceled.')
              }}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs leading-relaxed text-slate-300">
          {status}
        </p>
      )}
    </section>
  )
}

interface StorageStatProps {
  label: string
  value: string
}

function StorageStat({ label, value }: StorageStatProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5">
      <span className="block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="block truncate font-semibold text-slate-100">{value}</span>
    </div>
  )
}
