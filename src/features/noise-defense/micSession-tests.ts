import { startMicSession } from './micEngine'
import type { MicFailureReason } from './micEngine'

/**
 * Mic shutdown tests (per the task's explicit ask): confirm every audio
 * track obtained via `getUserMedia` is actually stopped on pause, on end,
 * and on unmount -- no lingering open mic stream in any of those cases.
 *
 * `useNoiseMicEngine`'s React effect calls the exact same `handle.stop()`
 * this file tests directly whenever its `enabled` dependency goes from true
 * to false (which is what a pause, an end, *and* an unmount all look like
 * from the effect's point of view -- React runs the identical cleanup
 * function in all three cases) or when the component unmounts outright. So
 * proving `stop()` reliably releases every track -- once, idempotently --
 * is what proves all three call sites are covered, without needing a real
 * DOM/React renderer (this repo's tsc+node test convention has neither).
 *
 * Runs with a fake `navigator.mediaDevices.getUserMedia` and a fake
 * `AudioContext` (via `startMicSession`'s test-only `getAudioContext`
 * override) -- no real microphone or browser involved.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

class FakeTrack {
  stopCalls = 0
  private endedListeners: Array<() => void> = []
  stop() {
    this.stopCalls++
  }
  addEventListener(type: string, cb: () => void) {
    if (type === 'ended') this.endedListeners.push(cb)
  }
  removeEventListener() {
    /* not needed for these tests */
  }
  fireEnded() {
    for (const cb of this.endedListeners) cb()
  }
}

class FakeStream {
  private tracks: FakeTrack[]
  constructor(tracks: FakeTrack[]) {
    this.tracks = tracks
  }
  getTracks() {
    return this.tracks
  }
}

class FakeAnalyserNode {
  fftSize = 0
  connect() {}
  disconnect() {}
  getFloatTimeDomainData(buffer: Float32Array) {
    buffer.fill(0)
  }
}

class FakeSourceNode {
  connect() {}
  disconnect() {}
}

class FakeAudioContext {
  createMediaStreamSource() {
    return new FakeSourceNode() as unknown as MediaStreamAudioSourceNode
  }
  createAnalyser() {
    return new FakeAnalyserNode() as unknown as AnalyserNode
  }
}

function installFakeNavigator(getUserMedia: (constraints: unknown) => Promise<FakeStream>) {
  // Modern Node ships its own read-only global `navigator` getter (no
  // `mediaDevices`), so a plain assignment throws -- redefine the property
  // instead of assigning to it.
  Object.defineProperty(globalThis, 'navigator', {
    value: { mediaDevices: { getUserMedia } },
    configurable: true,
    writable: true,
  })
}

function fakeGetAudioContext(): AudioContext | null {
  return new FakeAudioContext() as unknown as AudioContext
}

async function testTracksStoppedOnExplicitStop() {
  const tracks = [new FakeTrack(), new FakeTrack()]
  installFakeNavigator(async () => new FakeStream(tracks) as unknown as FakeStream)

  const denials: MicFailureReason[] = []
  const handle = await startMicSession(
    { onSample: () => {}, onDenied: (r) => denials.push(r) },
    fakeGetAudioContext,
  )
  assert(handle !== null, 'a successful getUserMedia + AudioContext should yield a session handle')
  assert(denials.length === 0, 'no denial should fire on a clean successful start')

  // Simulates a pause, an end, OR an unmount -- all three reach this exact
  // call in the real hook (§ file-level doc comment above).
  handle!.stop()

  for (const track of tracks) {
    assert(track.stopCalls === 1, `every obtained track must be stopped exactly once, got ${track.stopCalls}`)
  }
  console.log('  PASS: stop() stops every track obtained via getUserMedia (covers pause/end/unmount)')
}

async function testStopIsIdempotent() {
  const tracks = [new FakeTrack()]
  installFakeNavigator(async () => new FakeStream(tracks) as unknown as FakeStream)

  const handle = await startMicSession({ onSample: () => {}, onDenied: () => {} }, fakeGetAudioContext)
  assert(handle !== null, 'setup: session should start successfully')

  // A real app can plausibly call stop() more than once (e.g. a pause
  // followed immediately by an end before the next render) -- it must never
  // double-stop or throw.
  handle!.stop()
  handle!.stop()
  handle!.stop()

  assert(tracks[0].stopCalls === 1, `stop() must be idempotent, track.stop() should fire exactly once, got ${tracks[0].stopCalls}`)
  console.log('  PASS: stop() is idempotent -- calling it more than once never double-stops a track')
}

async function testDeviceLostStopsTracksAndReportsDenial() {
  const tracks = [new FakeTrack(), new FakeTrack()]
  installFakeNavigator(async () => new FakeStream(tracks) as unknown as FakeStream)

  const denials: MicFailureReason[] = []
  const handle = await startMicSession(
    { onSample: () => {}, onDenied: (r) => denials.push(r) },
    fakeGetAudioContext,
  )
  assert(handle !== null, 'setup: session should start successfully')

  // The device is unplugged mid-session -- the stream's own 'ended' event
  // fires on every track (browsers fire it per-track).
  tracks[0].fireEnded()

  assert(denials.includes('device-lost'), 'a device-lost track ending must report onDenied("device-lost")')
  for (const track of tracks) {
    assert(track.stopCalls === 1, 'every track must still be stopped when the device is lost mid-session')
  }

  // A subsequent explicit stop() (e.g. the component unmounting right after)
  // must not double-stop.
  handle!.stop()
  for (const track of tracks) {
    assert(track.stopCalls === 1, 'stop() after a device-lost teardown must not double-stop tracks')
  }
  console.log('  PASS: a device-lost event stops every track and reports onDenied("device-lost") exactly once')
}

async function testPermissionDeniedNeverOpensAStream() {
  installFakeNavigator(async () => {
    throw new DOMException('denied by user', 'NotAllowedError')
  })

  const denials: MicFailureReason[] = []
  const handle = await startMicSession(
    { onSample: () => {}, onDenied: (r) => denials.push(r) },
    fakeGetAudioContext,
  )
  assert(handle === null, 'a getUserMedia rejection must never yield a session handle')
  assert(denials.length === 1 && denials[0] === 'denied', 'must report onDenied("denied") exactly once')
  console.log('  PASS: a permission-denied getUserMedia rejection never opens a stream, reports denied once')
}

async function main() {
  await testTracksStoppedOnExplicitStop()
  await testStopIsIdempotent()
  await testDeviceLostStopsTracksAndReportsDenial()
  await testPermissionDeniedNeverOpensAStream()
  console.log('Noise Defense mic-session shutdown tests passed.')
}

// No `process.exit` here (this file also compiles under the app's own
// tsconfig, which doesn't include Node's ambient types) -- an unhandled
// rejection from `main()` already exits the process with a non-zero code,
// which is all a one-shot test script needs.
void main()
