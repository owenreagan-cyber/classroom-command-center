export type DisplaySyncStatus = 'paired' | 'awaiting-pairing' | 'disconnected'

const STATUS: Record<DisplaySyncStatus, { color: string; label: string }> = {
  paired: { color: 'bg-emerald-400', label: 'Classroom sync: connected, /control paired' },
  'awaiting-pairing': { color: 'bg-amber-400', label: 'Classroom sync: connected, no /control paired yet' },
  disconnected: { color: 'bg-rose-500', label: 'Classroom sync: disconnected — showing last synced content' },
}

/**
 * Small, unobtrusive corner dot on /display (Stage 3 follow-up — connection
 * status). A system indicator, not classroom content: state only, via color
 * and a `title` tooltip for whoever is physically at the machine — no device
 * names, tokens, or other teacher-only detail (same boundary PairingCodeBadge
 * already holds to). Deliberately just a dot, not a banner: visible enough
 * for a teacher glancing over, not something a student mid-lesson would
 * notice or read anything into.
 *
 * Placed bottom-right, offset slightly inside the corner so it never
 * overlaps the "tap to enable sound" banner that also lives in that corner
 * (see BoardHostDisplay.tsx) — that banner is anchored further in
 * (bottom-6 right-6); this sits at the outer edge (bottom-3 right-3).
 *
 * /display never blanks or reacts to `status` itself — see this component's
 * one job is showing state, not changing behavior. What's on screen when the
 * connection drops is exactly what stays on screen (BoardHostDisplay/
 * DisplayOverlayHost, untouched by this).
 */
export function SyncStatusDot({ status }: { status: DisplaySyncStatus }) {
  const { color, label } = STATUS[status]

  return (
    <div className="absolute bottom-3 right-3 z-[70]" data-sync-status={status} title={label}>
      <span className={`block h-2.5 w-2.5 rounded-full shadow ${color}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
