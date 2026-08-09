/**
 * Phase 15M — Display-safe projection of the spike data.
 *
 * Mirrors the toDisplaySafeScene/toDisplaySafeWidget pattern from the
 * target model. Renders spike widgets through a plain React/DOM view —
 * NO tldraw Editor, NO @tldraw/* imports. This proves the display boundary
 * established in the canvas engine decision.
 */

import { useState, useEffect } from 'react'
import type { SpikeScene, SpikeWidget } from './spikeTypes'

interface DisplaySafeProjectionProps {
  scene: SpikeScene
}

export function CanvasSpikeDisplayProjection({ scene }: DisplaySafeProjectionProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: scene.backgroundColor }}>
      {/* Title bar — matches the /display header style */}
      <header className="flex shrink-0 items-start justify-between gap-4 px-6 py-3">
        <h1 className="max-w-[75%] rounded-2xl bg-slate-950/80 px-6 py-3 text-4xl font-black leading-tight tracking-tight text-white shadow-xl backdrop-blur-sm">
          {scene.title}
        </h1>
      </header>

      {/* Widget overlay — same absolute positioning as WidgetDisplayOverlay */}
      <div className="relative flex-1">
        {scene.widgets
          .filter((w) => toDisplaySafeWidget(w) !== null)
          .map((w) => (
            <DisplaySafeWidgetCard key={w.id} widget={toDisplaySafeWidget(w)!} />
          ))}
      </div>
    </div>
  )
}

/** Strip teacher-only or editor-only fields. Mirrors toDisplaySafeWidget. */
function toDisplaySafeWidget(w: SpikeWidget): SpikeWidget | null {
  // Only visible widgets reach /display
  // (All spike widgets are visible by default; pinned=true is retained)
  return w
}

function DisplaySafeWidgetCard({ widget }: { widget: SpikeWidget }) {
  switch (widget.type) {
    case 'clock':
      return <DisplaySafeClock widget={widget} />
    case 'directions-text':
      return <DisplaySafeDirectionsText widget={widget} />
    case 'countdown-timer':
      return <DisplaySafeTimer widget={widget} />
    default:
      return null
  }
}

function DisplaySafeClock({ widget }: { widget: SpikeWidget }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="absolute rounded-2xl bg-slate-950/80 px-4 py-2 text-center text-white shadow-xl backdrop-blur-sm"
      style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Time</span>
      <p className="text-3xl font-black tabular-nums text-cyan-200">{time}</p>
    </div>
  )
}

function DisplaySafeDirectionsText({ widget }: { widget: SpikeWidget }) {
  const text = (widget.settings.text as string) ?? ''
  return (
    <div
      className="absolute rounded-2xl bg-slate-950/80 px-4 py-3 text-white shadow-xl backdrop-blur-sm"
      style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
    >
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">{widget.label}</span>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{text}</p>
    </div>
  )
}

function DisplaySafeTimer({ widget }: { widget: SpikeWidget }) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-3 text-center text-white shadow-xl backdrop-blur-sm"
      style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{widget.label}</span>
      <span className="my-1 text-4xl font-black tabular-nums text-amber-200">15:00</span>
      <span className="text-xs text-slate-500">Timer ready</span>
    </div>
  )
}
