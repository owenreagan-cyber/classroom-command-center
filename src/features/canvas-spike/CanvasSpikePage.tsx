/**
 * Phase 15M — tldraw Canvas Spike Page.
 *
 * Dev-only route at /canvas-spike:
 * - Not linked from production navigation.
 * - Not reachable from /control or /display's normal flow.
 * - Uses sample-only local spike data, not production stores.
 */

import { SPIKE_BOARD } from './spikeData'
import { CanvasSpikeEditor } from './CanvasSpikeEditor'

export function CanvasSpikePage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      <CanvasSpikeEditor scenes={SPIKE_BOARD.scenes} />
    </div>
  )
}

export default CanvasSpikePage
