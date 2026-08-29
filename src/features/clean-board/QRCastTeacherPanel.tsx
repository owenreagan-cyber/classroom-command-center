import { useState } from 'react'
import { useQrCastStore } from '../../store/qrCastStore'

const inputCls =
  'min-h-[44px] min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'
const primaryBtn =
  'min-h-[44px] rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40'
const ghostBtn =
  'min-h-[44px] rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'

interface QRCastTeacherPanelProps {
  fullWidth?: boolean
}

/**
 * DB-QR — the ONLY place the QR-code URL text input exists. Lives only
 * inside the Teacher Dock on `/board-lab`; `/display`
 * (`src/widgets/QRCodeWidget.tsx`) only ever renders whatever URL is cast
 * here, never collects input of its own — see the Phase 4 "Projector
 * Safety" invariant.
 */
export function QRCastTeacherPanel({ fullWidth = false }: QRCastTeacherPanelProps) {
  const castUrl = useQrCastStore((s) => s.castUrl)
  const setCastUrl = useQrCastStore((s) => s.setCastUrl)
  const clearCastUrl = useQrCastStore((s) => s.clearCastUrl)
  const [urlInput, setUrlInput] = useState('')

  const handleCast = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    setCastUrl(trimmed)
  }

  return (
    <div
      className={`flex flex-col gap-4 p-3 ${fullWidth ? 'w-full' : 'w-80 shrink-0'}`}
      data-qr-cast-teacher-panel
    >
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Cast a QR Code
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Students scan this from the projector — useful for a class link, a
          form, or a resource page.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCast()
            }}
            placeholder="https://example.com"
            className={inputCls}
            data-qr-url-input
          />
          <button
            type="button"
            onClick={handleCast}
            disabled={!urlInput.trim()}
            className={primaryBtn}
            data-qr-cast-button
          >
            Cast
          </button>
        </div>
      </div>

      {castUrl && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
            Now on Display
          </p>
          <p className="mt-1 truncate text-xs text-slate-300" title={castUrl}>
            {castUrl}
          </p>
          <button
            type="button"
            onClick={clearCastUrl}
            className={`${ghostBtn} mt-2`}
            data-qr-clear-button
          >
            Stop Casting
          </button>
        </div>
      )}
    </div>
  )
}

export default QRCastTeacherPanel
