import { useEffect, useRef } from 'react'
import { getSharedAudioContext } from '../../lib/audio/synthesizer'
import { ANALYSER_FFT_SIZE, SAMPLE_INTERVAL_MS } from './constants'

export type MicFailureReason = 'denied' | 'not-found' | 'device-lost' | 'unsupported' | 'unknown'

export interface MicSessionDeps {
  onSample: (rms: number, atMs: number) => void
  onDenied: (reason: MicFailureReason) => void
}

export interface MicSessionHandle {
  /** Stops sampling and releases every audio track this session obtained via
   * `getUserMedia`. Idempotent -- safe to call more than once (pause, then
   * end, then unmount will all reach this). */
  stop: () => void
}

/**
 * Raw-mic RMS sampling session (design-doc §2.1/§2.2), factored out of the
 * `useNoiseMicEngine` hook so its start/stop lifecycle is unit-testable
 * without a browser (this repo's tsc+node test convention has no DOM/jsdom).
 * Explicitly disables the browser's echo-cancellation/noise-suppression/AGC
 * -- those are *designed* to flatten exactly the "room is generally loud"
 * signal this feature exists to measure. Samples at ~4 Hz via
 * `getFloatTimeDomainData` RMS. Never fabricates a sample: on any
 * permission/device failure it calls `onDenied` and resolves `null` (nothing
 * to stop), and never calls `onSample` again after that.
 *
 * Reuses the same shared `AudioContext` singleton the SFX synthesizer uses
 * (`getSharedAudioContext`) rather than opening a second one -- the mic graph
 * is never connected to `ctx.destination`, so there's no feedback loop and no
 * interaction with SFX playback beyond sharing one context.
 *
 * Every path that ends this session -- an explicit `stop()` call, or the
 * stream's own device-lost `ended` event -- stops every track obtained via
 * `getUserMedia`. There is no path where a stream is opened and left running
 * without a live caller able to stop it.
 *
 * `getAudioContext` defaults to the real shared context and is overridable
 * only so this function's start/stop lifecycle is unit-testable with a fake
 * context object, without a browser (this repo's tsc+node test convention
 * has no DOM/jsdom) -- production callers never pass it.
 */
export async function startMicSession(
  deps: MicSessionDeps,
  getAudioContext: () => AudioContext | null = getSharedAudioContext,
): Promise<MicSessionHandle | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    deps.onDenied('unsupported')
    return null
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  } catch (err) {
    const name = err instanceof DOMException ? err.name : 'unknown'
    if (name === 'NotAllowedError' || name === 'SecurityError') deps.onDenied('denied')
    else if (name === 'NotFoundError' || name === 'OverconstrainedError') deps.onDenied('not-found')
    else deps.onDenied('unknown')
    return null
  }

  const ctx = getAudioContext()
  if (!ctx) {
    deps.onDenied('unsupported')
    stream.getTracks().forEach((track) => track.stop())
    return null
  }

  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopped = false

  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = ANALYSER_FFT_SIZE
  // Deliberately NOT connected to ctx.destination -- this graph is
  // capture-only, never audible, and never feeds back into the SFX path.
  source.connect(analyser)

  const stop = () => {
    if (stopped) return
    stopped = true
    if (intervalId !== null) clearInterval(intervalId)
    intervalId = null
    source.disconnect()
    analyser.disconnect()
    stream.getTracks().forEach((track) => track.stop())
  }

  // Device disconnected mid-session (§3.4/§3.8) -- stop this session's own
  // tracks (idempotent with an explicit stop()) and report the fault.
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      if (stopped) return
      stop()
      deps.onDenied('device-lost')
    })
  })

  const buffer = new Float32Array(analyser.fftSize)
  intervalId = setInterval(() => {
    if (stopped) return
    analyser.getFloatTimeDomainData(buffer)
    let sumSquares = 0
    for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i]
    const rms = Math.sqrt(sumSquares / buffer.length)
    deps.onSample(rms, Date.now())
  }, SAMPLE_INTERVAL_MS)

  return { stop }
}

interface UseNoiseMicEngineOptions {
  /** Only actually opens the mic stream while true; tears it down when it
   * goes false (§3.5/§3.7 — neither a jammed nor a paused game should keep a
   * live mic stream open). */
  enabled: boolean
  onSample: (rms: number, atMs: number) => void
  onDenied: (reason: MicFailureReason) => void
}

/** Thin React wrapper around `startMicSession` -- all the actual
 * open/sample/teardown logic lives there so it can be unit-tested directly. */
export function useNoiseMicEngine({ enabled, onSample, onDenied }: UseNoiseMicEngineOptions): void {
  const onSampleRef = useRef(onSample)
  const onDeniedRef = useRef(onDenied)
  useEffect(() => {
    onSampleRef.current = onSample
    onDeniedRef.current = onDenied
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let handle: MicSessionHandle | null = null

    void startMicSession({
      onSample: (rms, atMs) => onSampleRef.current(rms, atMs),
      onDenied: (reason) => onDeniedRef.current(reason),
    }).then((h) => {
      if (cancelled) {
        // Effect was cleaned up (pause/end/unmount) before the async
        // getUserMedia() gesture resolved -- stop immediately rather than
        // leaving a just-opened mic stream running unattended.
        h?.stop()
        return
      }
      handle = h
    })

    return () => {
      cancelled = true
      handle?.stop()
    }
  }, [enabled])
}
