/**
 * Small corner badge on /display showing the pairing code (Stage 3 —
 * requirement 1). Renders nothing once paired (`code` is null) or if no
 * sync server is connected at all.
 */
export function PairingCodeBadge({ code }: { code: string | null }) {
  if (!code) return null

  return (
    <div
      className="absolute right-4 top-4 z-[70] rounded-xl border border-slate-700/60 bg-slate-950/80 px-4 py-2 text-center backdrop-blur"
      data-pairing-code-badge
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Pair /control</p>
      <p className="text-2xl font-bold tracking-[0.3em] text-slate-100">{code}</p>
    </div>
  )
}
