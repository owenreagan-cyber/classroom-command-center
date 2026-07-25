import { useState } from 'react'
import {
  CLIPBOARD_UNAVAILABLE_MESSAGE,
  DISPLAY_LINK_COPIED_MESSAGE,
  POPUP_BLOCKED_MESSAGE,
  copyDisplayLink,
  openStudentDisplay,
} from '../app/displayLaunch'

export function DisplayLaunchPanel() {
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success')

  const handleOpenDisplay = () => {
    const result = openStudentDisplay(window, window.location)
    if (!result.ok) {
      setNotice(POPUP_BLOCKED_MESSAGE)
      setNoticeTone('error')
      return
    }
    setNotice('Student display opened. Use Fullscreen on Display in that window when ready.')
    setNoticeTone('success')
  }

  const handleCopyLink = async () => {
    const result = await copyDisplayLink(navigator.clipboard, window.location)
    if (!result.ok) {
      setNotice(CLIPBOARD_UNAVAILABLE_MESSAGE)
      setNoticeTone('error')
      return
    }
    setNotice(DISPLAY_LINK_COPIED_MESSAGE)
    setNoticeTone('success')
  }

  const handleFocusDisplay = () => {
    const result = openStudentDisplay(window, window.location)
    if (!result.ok) {
      setNotice(POPUP_BLOCKED_MESSAGE)
      setNoticeTone('error')
      return
    }
    setNotice('Display window opened. Click Enter Fullscreen on the projector screen.')
    setNoticeTone('success')
  }

  return (
    <section className="space-y-2" aria-label="Student display launch">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Display
        </h2>
        <span className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Teacher Control
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={handleOpenDisplay}
          className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 px-3 py-3 text-left text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/40"
        >
          Open Student Display
        </button>
        <button
          type="button"
          onClick={handleFocusDisplay}
          className="rounded-xl border border-cyan-400/35 bg-cyan-950/25 px-3 py-3 text-left text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/35"
        >
          Open Display for Fullscreen
        </button>
        <button
          type="button"
          onClick={() => {
            void handleCopyLink()
          }}
          className="rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Copy Display Link
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Fullscreen runs on the display window via a projector-safe button there.
        This panel never forces fullscreen automatically.
      </p>
      {notice && (
        <p
          role="status"
          className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${
            noticeTone === 'success'
              ? 'border-emerald-400/30 bg-emerald-950/20 text-emerald-100/90'
              : 'border-amber-400/30 bg-amber-950/20 text-amber-100/90'
          }`}
        >
          {notice}
        </p>
      )}
    </section>
  )
}
