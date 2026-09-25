import type { ControlSyncConnectionStatus } from './controlSyncClient'

const STATUS: Record<ControlSyncConnectionStatus, { color: string; label: string }> = {
  connected: { color: 'bg-emerald-400', label: 'Connected' },
  reconnecting: { color: 'bg-amber-400', label: 'Reconnecting…' },
  disconnected: { color: 'bg-rose-500', label: 'Disconnected' },
}

/**
 * Always-visible connection indicator on /control (Stage 3 follow-up).
 * Unlike /display's SyncStatusDot (deliberately just a dot, for a screen
 * students are looking at), this one is meant to be clearly readable by the
 * teacher, since /control's whole job is "is my classroom sync actually
 * working right now" — a bare dot with only a hover tooltip would be easy to
 * miss on the device the teacher is actively operating.
 *
 * Bottom-right, mirroring where SyncStatusDot sits on /display; doesn't
 * collide with UnpairControl (bottom-left) or PairingGate (centered,
 * full-screen, only shown pre-pairing).
 */
export function ConnectionStatusIndicator({ status }: { status: ControlSyncConnectionStatus }) {
  const { color, label } = STATUS[status]

  return (
    <div
      className="fixed bottom-3 right-3 z-[70] flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-950/70 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur"
      data-sync-connection-status={status}
    >
      <span className={`h-2 w-2 rounded-full ${color} ${status !== 'connected' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </div>
  )
}
