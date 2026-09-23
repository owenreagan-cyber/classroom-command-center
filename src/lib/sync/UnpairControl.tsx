import { useState } from 'react'
import type { ControlSyncState } from './controlSyncClient'

/**
 * Small, always-reachable corner control on /control, visible only once
 * paired. This is requirement 4's "a way on /control to revoke pairing" —
 * the M1/M5-side fallback (restarting the server) lives in
 * server/classroomSyncServer.ts's file header, for when the iPad itself is
 * lost and can't be used to unpair itself.
 */
export function UnpairControl({ sync }: { sync: ControlSyncState }) {
  const [confirming, setConfirming] = useState(false)

  if (sync.authStatus !== 'authenticated') return null

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="fixed bottom-3 left-3 z-[70] rounded-full border border-slate-700/50 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur transition hover:border-slate-600 hover:text-slate-300"
        data-unpair-action="open"
      >
        Unpair this device
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-[70] flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-950/90 px-3 py-1.5 text-[11px] font-medium text-amber-200 backdrop-blur"
      data-unpair-action="confirm"
    >
      <span>Unpair and stop controlling the display?</span>
      <button
        type="button"
        onClick={() => {
          sync.unpair()
          setConfirming(false)
        }}
        className="rounded-full border border-amber-400/50 bg-amber-950/40 px-2 py-0.5 font-semibold hover:bg-amber-900/50"
        data-unpair-action="confirm-yes"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400 hover:text-slate-200"
        data-unpair-action="cancel"
      >
        Cancel
      </button>
    </div>
  )
}
