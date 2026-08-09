/**
 * Phase 15M — Spike data types for the tldraw canvas prototype.
 * Independent of production types. Sample-only, not persisted.
 */

/** A single widget on the canvas. */
export interface SpikeWidget {
  id: string
  type: 'clock' | 'directions-text' | 'countdown-timer'
  label: string
  x: number
  y: number
  w: number
  h: number
  pinned: boolean
  settings: Record<string, unknown>
}

/** A scene within the spike board. */
export interface SpikeScene {
  id: string
  title: string
  backgroundColor: string
  widgets: SpikeWidget[]
}

/** The top-level board for the spike. */
export interface SpikeBoard {
  scenes: SpikeScene[]
}
