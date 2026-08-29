import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeCastUrl } from './qrCastLogic'

/**
 * DB-QR — the URL a teacher has cast to `/display` as a QR code. The teacher
 * text input lives only in `/board-lab` (`QRCastTeacherPanel.tsx`); `/display`
 * (`src/widgets/QRCodeWidget.tsx`) only ever reads `castUrl` and renders it,
 * never collects input of its own — see the Phase 4 "Projector Safety"
 * invariant. Cross-tab sync mirrors `stampStore.ts`'s pattern exactly.
 */

export const QR_CAST_STORAGE_KEY = 'classroom-command-center-qr-cast'

interface QrCastState {
  castUrl: string | null
}

interface QrCastStore extends QrCastState {
  setCastUrl: (url: string) => void
  clearCastUrl: () => void
}

export const useQrCastStore = create<QrCastStore>()(
  persist(
    (set) => ({
      castUrl: null,
      setCastUrl: (url) => set({ castUrl: normalizeCastUrl(url) }),
      clearCastUrl: () => set({ castUrl: null }),
    }),
    {
      name: QR_CAST_STORAGE_KEY,
      version: 1,
    },
  ),
)

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== QR_CAST_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<QrCastState> }
      const restored = parsed.state ?? parsed
      useQrCastStore.setState(restored as Partial<QrCastState>)
    } catch {
      // ignore malformed storage
    }
  })
}
