import { memo, useCallback, useState } from 'react'
import {
  formatCacheAge,
  getSyncStatusLabel,
  useLibraryIndexStore,
} from '../../curriculum-library-fetcher/libraryIndexStore'

export const CurriculumSyncToolPanel = memo(function CurriculumSyncToolPanel() {
  const syncStatus = useLibraryIndexStore((s) => s.syncStatus)
  const driveAvailable = useLibraryIndexStore((s) => s.driveAvailable)
  const lastScannedAt = useLibraryIndexStore((s) => s.lastScannedAt)
  const packages = useLibraryIndexStore((s) => s.packages)
  const source = useLibraryIndexStore((s) => s.source)
  const syncCurriculumLibrary = useLibraryIndexStore((s) => s.syncCurriculumLibrary)

  const [feedback, setFeedback] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const packageCount = Object.keys(packages).length
  const statusLabel = syncing ? 'Syncing' : getSyncStatusLabel(syncStatus)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setFeedback(null)
    try {
      const result = await syncCurriculumLibrary()
      setFeedback(result.message)
    } catch {
      setFeedback('Sync failed — using cached lesson data if available')
    } finally {
      setSyncing(false)
    }
  }, [syncCurriculumLibrary])

  return (
    <div className="space-y-4" aria-label="Curriculum Sync">
      <div>
        <p className="text-xs leading-relaxed text-slate-400">
          Manually sync lesson packages from Google Drive into the local curriculum index.
          Classroom teaching uses cached data — no live Drive queries during class.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Status
        </p>
        <p className="mt-1 text-sm font-semibold text-white">{statusLabel}</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          <li>{packageCount} lesson package(s) indexed</li>
          <li>Last sync: {formatCacheAge(lastScannedAt)}</li>
          <li>Source: {source ?? 'none'}</li>
          {!driveAvailable && packageCount > 0 && (
            <li className="text-amber-200/80">Using cached lesson data</li>
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => void handleSync()}
        disabled={syncing}
        className="w-full rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : 'Sync Curriculum Library'}
      </button>

      {feedback && (
        <p role="status" className="text-xs text-slate-400">
          {feedback}
        </p>
      )}
    </div>
  )
})
