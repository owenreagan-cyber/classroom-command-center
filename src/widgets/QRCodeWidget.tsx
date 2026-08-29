import QRCode from 'react-qr-code'
import { useQrCastStore } from '../store/qrCastStore'

/**
 * DB-QR — `/display`-only. Renders whatever URL a teacher has cast from the
 * `/board-lab` Teacher Dock's QR-cast panel as a QR code. Never collects
 * input itself — see the Phase 4 "Projector Safety" invariant: the text
 * input must exist only in `/board-lab`.
 */
export function QRCodeWidget() {
  const castUrl = useQrCastStore((s) => s.castUrl)

  if (!castUrl) return null

  return (
    <div
      className="absolute bottom-6 left-6 z-40 flex flex-col items-center gap-2 rounded-2xl border border-slate-700 bg-white p-4 shadow-2xl"
      data-qr-code-widget
    >
      <QRCode value={castUrl} size={148} />
      <p className="max-w-[148px] truncate text-center text-[10px] font-medium text-slate-600" title={castUrl}>
        {castUrl}
      </p>
    </div>
  )
}

export default QRCodeWidget
