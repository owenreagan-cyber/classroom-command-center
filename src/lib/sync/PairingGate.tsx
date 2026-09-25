import { useState, type FormEvent } from 'react'
import type { ControlSyncState } from './controlSyncClient'

/**
 * Full-screen gate shown on /control whenever this device isn't paired
 * (Stage 3 — docs/architecture/cross-device-control.md §4). Blocks the
 * normal teacher UI entirely rather than just rejecting actions silently in
 * the background: the goal is "only Owen's iPad can control the display,"
 * so an unpaired device shouldn't be able to see/use the controls at all,
 * not just have them quietly fail server-side.
 *
 * Never shows the pairing code itself (requirement 3) — only ever collects
 * what a human read off /display and typed in.
 */
export function PairingGate({ sync }: { sync: ControlSyncState }) {
  const [code, setCode] = useState('')
  const rateLimited = sync.rateLimitedSeconds !== null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!rateLimited && code.trim().length > 0) sync.submitCode(code.trim())
  }

  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-slate-950 px-4" data-pairing-gate>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-center shadow-xl"
      >
        <h1 className="text-lg font-semibold text-slate-100">Pair this device</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the code shown in the corner of the classroom display.
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="000000"
          className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-slate-100 outline-none focus:border-cyan-400/60"
          data-pairing-code-input
        />
        {rateLimited && (
          <p className="mt-3 text-sm font-medium text-amber-400" data-pairing-rate-limited>
            Too many tries — wait {sync.rateLimitedSeconds}s
          </p>
        )}
        {!rateLimited && sync.pairError && <p className="mt-3 text-sm font-medium text-rose-400">{sync.pairError}</p>}
        <button
          type="submit"
          disabled={rateLimited || code.trim().length === 0}
          className="mt-5 w-full rounded-xl border border-cyan-400/40 bg-cyan-950/30 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          data-pairing-submit
        >
          Pair
        </button>
      </form>
    </div>
  )
}
