import { useState } from 'react'
import { useWakeLock } from './useWakeLock'

/**
 * DB-2D — teacher-only Keep Awake toggle.
 *
 * Mounted only in /board-lab edit mode; never rendered in present/student
 * mode. Enabling requests a screen wake lock where supported.
 */

export function KeepAwakeToggle() {
  const [enabled, setEnabled] = useState(false)
  const { status, statusText } = useWakeLock(enabled)

  const on = status === 'active' || status === 'reacquiring'
  const warn = status === 'unsupported' || status === 'released'

  return (
    <div className="flex items-center gap-2" data-keep-awake-toggle>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled((v) => !v)}
        data-keep-awake-enabled={enabled}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
          enabled
            ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
            : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-slate-100'
        }`}
      >
        Keep Awake {enabled ? 'On' : 'Off'}
      </button>
      <span
        className={`text-xs font-medium ${
          on ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-slate-500'
        }`}
        data-keep-awake-status={status}
      >
        {statusText}
      </span>
    </div>
  )
}
