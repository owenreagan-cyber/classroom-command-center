/**
 * Phase 15M — tldraw spike editor wrapper.
 *
 * Wraps the Tldraw component with custom shape registration,
 * scene-switching, and display-safe projection toggle.
 */

import { useState, useMemo } from 'react'
import { Tldraw, createTLStore } from 'tldraw'
import { ClockShapeUtil } from './ClockShape'
import { DirectionsTextShapeUtil } from './DirectionsTextShape'
import { CountdownTimerShapeUtil } from './CountdownTimerShape'
import type { SpikeScene } from './spikeTypes'
import { CanvasSpikeDisplayProjection } from './CanvasSpikeDisplayProjection'

interface CanvasSpikeEditorProps {
  scenes: SpikeScene[]
}

const customUtils = [ClockShapeUtil, DirectionsTextShapeUtil, CountdownTimerShapeUtil] as const

export function CanvasSpikeEditor({ scenes }: CanvasSpikeEditorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showDisplay, setShowDisplay] = useState(false)

  const activeScene = scenes[activeIndex]

  // Seed shapes for the current scene: non-pinned from the active scene + pinned from all.
  const sceneShapes = useMemo(() => {
    if (!activeScene) return []
    const pinned = scenes
      .filter((s) => s.widgets.some((w) => w.pinned))
      .flatMap((s) => s.widgets.filter((w) => w.pinned))
    // Deduplicate pinned by id
    const seen = new Set<string>()
    const dedupedPinned = pinned.filter((w) => {
      if (seen.has(w.id)) return false
      seen.add(w.id)
      return true
    })
    const all = [...dedupedPinned, ...activeScene.widgets.filter((w) => !w.pinned)]
    return all
  }, [activeScene, scenes])

  // Build a fresh store for each scene to reset the board cleanly
  const store = useMemo(() => {
    const s = createTLStore({
      shapeUtils: customUtils as never,
      initialData: buildInitialData(sceneShapes),
    })
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScene.id])

  if (showDisplay && activeScene) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <CanvasSpikeDisplayProjection scene={activeScene} />
        <button
          onClick={() => setShowDisplay(false)}
          className="absolute bottom-4 left-4 z-50 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-700"
        >
          Back to Editor
        </button>
        <span className="absolute bottom-4 right-4 z-50 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Display-Safe Projection — engine-agnostic, no tldraw
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Scene Tabs */}
      <div className="flex shrink-0 items-center gap-2 bg-slate-950 px-4 py-2">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => setActiveIndex(i)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              i === activeIndex
                ? 'bg-cyan-700 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {scene.title}
          </button>
        ))}
        <div className="flex-1" />
        <span className="rounded-lg bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-200">
          Phase 15M Spike — Dev Only
        </span>
        <button
          onClick={() => setShowDisplay(true)}
          className="rounded-lg bg-cyan-700 px-4 py-1.5 text-sm font-semibold text-white shadow-md hover:bg-cyan-600"
        >
          Show Display Projection
        </button>
      </div>

      {/* tldraw Editor */}
      <div className="flex-1" style={{ position: 'fixed', inset: '44px 0 0 0' }}>
        <Tldraw store={store} colorScheme="dark" />
      </div>
    </div>
  )
}

function buildInitialData(widgets: Array<{ id: string; type: string; label: string; x: number; y: number; w: number; h: number; pinned?: boolean; settings: Record<string, unknown> }>) {
  const records: Record<string, unknown>[] = []
  // We need at minimum a page record for tldraw
  records.push({
    id: 'page:default',
    typeName: 'page',
    name: 'default',
    index: 'a1',
  })

  let idx = 0
  for (const w of widgets) {
    const shapeId = `shape:${w.id.replace(/[^a-zA-Z0-9]/g, '_')}`
    const shapeType = w.type === 'clock' ? 'spike-clock' : w.type === 'countdown-timer' ? 'spike-timer' : 'spike-directions'
    records.push({
      id: shapeId,
      typeName: 'shape',
      type: shapeType,
      x: w.x,
      y: w.y,
      rotation: 0,
      index: `a${(idx + 2).toString().padStart(2, '0')}`,
      parentId: 'page:default',
      isLocked: false,
      opacity: 1,
      props: {
        w: w.w,
        h: w.h,
        label: w.label,
        ...(w.type === 'directions-text' ? { text: (w.settings.text as string) ?? 'Directions...' } : {}),
        ...(w.type === 'countdown-timer' ? { timerKind: (w.settings.timerKind as string) ?? 'general' } : {}),
      },
      meta: {},
    })
    idx++
  }
  return records as never
}
