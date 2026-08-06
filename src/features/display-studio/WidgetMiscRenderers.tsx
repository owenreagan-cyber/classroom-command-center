import type { CanvasWidget } from '../display-composer/types'
import { useAtmosphereStore, getDisplayMusicLabel } from '../classroom-atmosphere/atmosphereStore'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'

const NOISE_LABELS: Record<string, string> = {
  off: 'Silent', whisper: 'Whisper', normal: 'Normal', loud: 'Too Loud',
}

export function NoiseLevelContent({ widget }: { widget: CanvasWidget }) {
  const mode = (widget.settings.mode as string) ?? 'manual'
  if (mode === 'manual') {
    const level = (widget.settings.level as string) ?? 'whisper'
    const colorMap: Record<string, string> = {
      silent: 'text-emerald-300', whisper: 'text-sky-300', normal: 'text-amber-300', loud: 'text-rose-300',
    }
    return (
      <div className="flex h-full flex-col items-center justify-center p-3 text-center">
        <span className="text-xl">🔊</span>
        <span className={`text-[14px] font-bold ${colorMap[level] ?? 'text-slate-200'}`}>{NOISE_LABELS[level] ?? level}</span>
        <span className="text-[10px] text-slate-500 mt-1">Voice Level</span>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🔊</span>
      <span className="text-[11px] text-slate-300">Noise Meter</span>
      <span className="text-[10px] text-slate-500 mt-1">Live monitoring</span>
    </div>
  )
}

export function AtmosphereContent({ widget }: { widget: CanvasWidget }) {
  void widget // consumed by stores
  const activeMode = useAtmosphereStore((s) => s.activeMode)
  const isPlaying = useAtmosphereStore((s) => s.isPlaying)
  const label = getDisplayMusicLabel(activeMode)

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🎵</span>
      {label && isPlaying ? (
        <span className="text-[12px] font-semibold text-emerald-200 mt-1.5">{label}</span>
      ) : label ? (
        <span className="text-[11px] text-slate-400 mt-1.5">{label}</span>
      ) : (
        <span className="text-[10px] text-slate-500 mt-1.5">No music</span>
      )}
    </div>
  )
}

export function DirectionsTextContent({ widget }: { widget: CanvasWidget }) {
  const text = (widget.settings.text as string) ?? ''
  return (
    <div className="flex h-full flex-col p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 mb-1.5 text-center">
        {widget.label}
      </span>
      {text ? (
        <span className="text-[12px] leading-snug text-slate-200 whitespace-pre-line">{text}</span>
      ) : (
        <span className="text-[11px] text-slate-500 text-center">Add text in inspector</span>
      )}
    </div>
  )
}

export function WorkSymbolsContent({ widget }: { widget: CanvasWidget }) {
  const symbol = (widget.settings.symbol as string) ?? 'silent'
  const symbolLabels: Record<string, string> = {
    silent: '🤫 Silent Work', whisper: '🗣 Whisper', partner: '👥 Partner Work',
    group: '👨‍👩‍👧‍👦 Group Work', independent: '✍️ Independent',
  }
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-[13px] font-semibold text-sky-200">{symbolLabels[symbol] ?? symbol}</span>
      <span className="text-[10px] text-slate-500 mt-1">Work Mode</span>
    </div>
  )
}

export function MaterialsContent({ widget }: { widget: CanvasWidget }) {
  const screen = useDisplayComposerStore((s) => {
    for (const id of s.order) {
      const scr = s.screens[id]
      if (scr?.widgets?.some((w) => w.id === widget.id)) return scr
    }
    return undefined
  })
  const card = screen?.materialsCard
  const itemCount = card?.sections.reduce((sum, s) => sum + s.items.length, 0) ?? 0

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">📋</span>
      <span className="text-[12px] font-semibold text-slate-200 mt-1.5">{card?.heading ?? 'Materials'}</span>
      {itemCount > 0 ? (
        <span className="text-[10px] text-slate-400 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      ) : (
        <span className="text-[10px] text-slate-500 mt-1">Add items in inspector</span>
      )}
    </div>
  )
}

export function ChecklistContent({ widget }: { widget: CanvasWidget }) {
  const screen = useDisplayComposerStore((s) => {
    for (const id of s.order) {
      const scr = s.screens[id]
      if (scr?.widgets?.some((w) => w.id === widget.id)) return scr
    }
    return undefined
  })
  const card = screen?.checklistCard
  const totalItems = card?.items.length ?? 0
  const checked = card?.items.filter((i) => i.checked).length ?? 0

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">✅</span>
      <span className="text-[12px] font-semibold text-slate-200 mt-1.5">{card?.heading ?? 'Checklist'}</span>
      {totalItems > 0 ? (
        <span className="text-[10px] text-slate-400 mt-1">{checked}/{totalItems} done</span>
      ) : (
        <span className="text-[10px] text-slate-500 mt-1">Add items in inspector</span>
      )}
    </div>
  )
}

export function PlaceholderContent({ widget }: { widget: CanvasWidget }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">📦</span>
      <span className="text-[11px] font-semibold text-slate-300">{widget.label}</span>
      <span className="text-[10px] text-slate-600 mt-1">Coming soon</span>
    </div>
  )
}
