import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Live integration test for the classroom sync server: spawns the REAL
 * server process and connects real WebSocket clients (one playing
 * /display, two playing /control — the second one simulating "a second
 * browser without the token"). Covers:
 *
 *   - Privacy (Stage 2): a poisoned action never leaks teacher-only keys to
 *     /display's actual wire messages; Blank wins even when a screen is
 *     smuggled into the same action; random number passes through cleanly.
 *   - Pairing/security (Stage 3): unpaired/invalid-token actions are
 *     rejected; the correct code pairs and issues a token; a paired
 *     action works end-to-end; a second, never-paired device cannot act;
 *     the pairing code never reaches any control-role socket and the
 *     token never reaches any display-role socket; unpair revokes the old
 *     token and issues a fresh code.
 *   - Atomic state write: a corrupted state file (simulating a crash
 *     mid-write under the old non-atomic code) doesn't crash the server on
 *     boot, and a real save leaves no stray temp file behind.
 *
 * This is the requested "test that inspects actual outgoing /display
 * messages" — not a unit test of the sanitizer in isolation (see
 * src/lib/sync/sanitize-tests.ts for that).
 */

const ROOT = join(import.meta.dirname, '..')
const HOST = '127.0.0.1'

const FORBIDDEN_SUBSTRINGS = [
  'teacherNotes',
  'updatedAt',
  '"version"',
  'accessToken',
  'refreshToken',
  'clientSecret',
  'deviceId',
  'accountId',
  'apiKey',
  'sk-secret-value',
  'Confidential IEP note',
]

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
    throw new Error(message)
  }
  console.log(`PASS: ${message}`)
}

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve(), { once: true })
    socket.addEventListener('error', (e) => reject(e), { once: true })
  })
}

/**
 * Records every message from the moment the socket is created, so a message
 * that arrives before `waitFor` is called (e.g. the 'hello' the server sends
 * immediately on connect, which can race the 'open' event resolving) is
 * still seen — a plain future-only `addEventListener('message', ...)` would
 * silently miss it and hang until timeout.
 */
function recordMessages(socket: WebSocket) {
  const seen: string[] = []
  const waiters: Array<{ predicate: (raw: string) => boolean; resolve: (raw: string) => void }> = []

  socket.addEventListener('message', (event) => {
    const raw = String(event.data)
    seen.push(raw)
    const waiterIndex = waiters.findIndex((w) => w.predicate(raw))
    if (waiterIndex !== -1) {
      const [waiter] = waiters.splice(waiterIndex, 1)
      waiter.resolve(raw)
    }
  })

  function waitFor(predicate: (raw: string) => boolean, timeoutMs = 5000): Promise<string> {
    const already = seen.find(predicate)
    if (already) return Promise.resolve(already)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for expected message')), timeoutMs)
      waiters.push({
        predicate,
        resolve: (raw) => {
          clearTimeout(timer)
          resolve(raw)
        },
      })
    })
  }

  return { seen, waitFor }
}

function spawnServer(port: number, stateFile: string) {
  const server = spawn('node', [join(ROOT, 'server', 'classroomSyncServer.ts')], {
    cwd: ROOT,
    env: {
      ...process.env,
      CLASSROOM_SYNC_PORT: String(port),
      CLASSROOM_SYNC_HOST: HOST,
      CLASSROOM_SYNC_STATE_FILE: stateFile,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  server.stdout.on('data', (d) => (output += d.toString()))
  server.stderr.on('data', (d) => (output += d.toString()))
  const exitedEarly = new Promise<never>((_, reject) => {
    server.once('exit', (code) => reject(new Error(`server exited early (code ${code}):\n${output}`)))
  })
  return { server, exitedEarly, getOutput: () => output }
}

async function testPrivacyAuthAndPairing() {
  const port = 4199
  const stateDir = mkdtempSync(join(tmpdir(), 'classroom-sync-livetest-'))
  const stateFile = join(stateDir, 'state.json')
  const { server, exitedEarly } = spawnServer(port, stateFile)

  try {
    await Promise.race([new Promise((r) => setTimeout(r, 700)), exitedEarly])

    const wsUrl = (role: 'control' | 'display') => `ws://${HOST}:${port}/__classroom-sync?role=${role}`
    const display = new WebSocket(wsUrl('display'))
    const controlA = new WebSocket(wsUrl('control')) // the iPad, eventually paired
    const controlB = new WebSocket(wsUrl('control')) // "a second browser without the token"
    const displayMessages = recordMessages(display)
    const controlAMessages = recordMessages(controlA)
    const controlBMessages = recordMessages(controlB)
    await Promise.race([Promise.all([waitForOpen(display), waitForOpen(controlA), waitForOpen(controlB)]), exitedEarly])

    await Promise.race([
      Promise.all([
        displayMessages.waitFor((raw) => JSON.parse(raw).type === 'hello'),
        controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'hello'),
        controlBMessages.waitFor((raw) => JSON.parse(raw).type === 'hello'),
      ]),
      exitedEarly,
    ])

    // --- Pairing code: display gets it unprompted; a fresh control socket does not ---
    const initialPairingRaw = await Promise.race([
      displayMessages.waitFor((raw) => JSON.parse(raw).type === 'pairingStatus'),
      exitedEarly,
    ])
    const code = JSON.parse(initialPairingRaw).code as string
    assert(typeof code === 'string' && /^\d{6}$/.test(code), 'the server issues a 6-digit pairing code to /display')

    // --- Requirement 2: an action with no token at all is rejected ---
    const legitScreen = {
      id: 'arrival-1',
      title: 'Morning Arrival',
      mode: 'arrival',
      background: { type: 'gradient', token: 'calm-focus' },
      showClock: true,
      timerWidget: { kind: 'none' },
      studentSafe: true,
      widgets: [],
    }
    await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'action', channel: 'composer', payload: { blanked: false, screenId: 'arrival-1', screen: legitScreen } }))
        const rejected = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'actionRejected')
        assert(JSON.parse(rejected).reason === 'unauthorized', 'an action with no token at all is rejected as unauthorized')
      })(),
      exitedEarly,
    ])

    // --- An action with a garbage/invalid token is rejected ---
    await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'action', channel: 'composer', token: 'not-a-real-token', payload: { blanked: false, screenId: 'arrival-1', screen: legitScreen } }))
        const rejected = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'actionRejected')
        assert(!!rejected, 'an action with an invalid token is rejected')
      })(),
      exitedEarly,
    ])

    // --- Pairing with the wrong code fails ---
    const wrongCode = code === '000000' ? '111111' : '000000'
    await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'pair', code: wrongCode }))
        const err = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'pairError')
        assert(!!err, 'pairing with the wrong code is rejected with pairError, no token issued')
      })(),
      exitedEarly,
    ])

    // --- Pairing with the correct code succeeds and issues a token ---
    const tokenA: string = await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'pair', code }))
        const paired = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'paired')
        const token = JSON.parse(paired).token as string
        assert(typeof token === 'string' && token.length >= 32, 'pairing with the correct code issues a long random token')
        return token
      })(),
      exitedEarly,
    ])

    // --- Once paired, /display is told the code is gone (null) ---
    await Promise.race([
      (async () => {
        const raw = await displayMessages.waitFor((raw) => JSON.parse(raw).type === 'pairingStatus' && JSON.parse(raw).code === null)
        assert(!!raw, "/display's pairing badge clears (code: null) once a controller pairs")
      })(),
      exitedEarly,
    ])

    // --- A second, never-paired browser still cannot act ---
    await Promise.race([
      (async () => {
        controlB.send(JSON.stringify({ type: 'action', channel: 'composer', payload: { blanked: false, screenId: 'arrival-1', screen: legitScreen } }))
        const rejected = await controlBMessages.waitFor((raw) => JSON.parse(raw).type === 'actionRejected')
        assert(!!rejected, 'a second browser that never paired cannot control the display, even after another device successfully paired')
      })(),
      exitedEarly,
    ])

    // --- Privacy (Stage 2, now under auth): a poisoned but properly-tokened action never leaks teacher-only keys ---
    const poisonedComposerAction = {
      type: 'action',
      channel: 'composer',
      token: tokenA,
      payload: {
        blanked: false,
        screenId: 'arrival-1',
        screen: {
          ...legitScreen,
          teacherNotes: 'Confidential IEP note',
          updatedAt: 1730000000000,
          version: 7,
          widgets: [
            {
              id: 'w1',
              type: 'text',
              label: 'note',
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              visible: true,
              settings: { text: 'visible safe text', apiKey: 'sk-secret-value', accessToken: 'oauth-abc' },
            },
          ],
        },
      },
    }
    const displayComposerMessage = await Promise.race([
      (async () => {
        controlA.send(JSON.stringify(poisonedComposerAction))
        return displayMessages.waitFor((raw) => {
          const msg = JSON.parse(raw)
          return msg.type === 'state' && msg.channel === 'composer' && msg.payload.screen !== null
        })
      })(),
      exitedEarly,
    ])
    for (const forbidden of FORBIDDEN_SUBSTRINGS) {
      assert(!displayComposerMessage.includes(forbidden), `/display's actual composer broadcast never contains "${forbidden}"`)
    }
    assert(displayComposerMessage.includes('visible safe text'), "a legitimate, allowed widget setting ('text') does reach /display, from a paired+valid action")

    // --- Blank must win: even with a screen in the same action, blanked:true clears it ---
    const blankAction = { type: 'action', channel: 'composer', token: tokenA, payload: { blanked: true, screenId: 'arrival-1', screen: poisonedComposerAction.payload.screen } }
    const blankBroadcast = await Promise.race([
      (async () => {
        controlA.send(JSON.stringify(blankAction))
        return displayMessages.waitFor((raw) => {
          const msg = JSON.parse(raw)
          return msg.type === 'state' && msg.channel === 'composer' && msg.payload.blanked === true
        })
      })(),
      exitedEarly,
    ])
    const blankPayload = JSON.parse(blankBroadcast).payload
    assert(blankPayload.screenId === null, 'Blank wins: screenId is null in the actual wire broadcast')
    assert(blankPayload.screen === null, 'Blank wins: screen is null in the actual wire broadcast, not just hidden client-side')

    // --- Random number: legitimate value passes through end-to-end, with a valid token ---
    const randomAction = { type: 'action', channel: 'randomNumber', token: tokenA, payload: { value: 42 } }
    const randomBroadcast = await Promise.race([
      (async () => {
        controlA.send(JSON.stringify(randomAction))
        return displayMessages.waitFor((raw) => {
          const msg = JSON.parse(raw)
          return msg.type === 'state' && msg.channel === 'randomNumber'
        })
      })(),
      exitedEarly,
    ])
    assert(JSON.parse(randomBroadcast).payload.value === 42, 'random number value 42 reaches /display end-to-end over the real socket, with a valid token')

    // --- Unpair: revokes the old token and issues a fresh code ---
    await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'unpair', token: tokenA }))
        const unpaired = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'unpaired')
        assert(!!unpaired, 'unpair, sent with the valid token, is acknowledged')
        // Must exclude the original code specifically, not just "any string
        // code" — the very first pairingStatus (sent on connect, before
        // anything else happened) already satisfies a looser predicate and
        // sits earlier in `seen`, which would make `waitFor` resolve with
        // stale data instead of actually waiting for the regenerated one.
        const status = await displayMessages.waitFor((raw) => {
          const msg = JSON.parse(raw)
          return msg.type === 'pairingStatus' && typeof msg.code === 'string' && msg.code !== code
        }, 5000)
        const nextCode = JSON.parse(status).code as string
        assert(nextCode !== code, 'unpair regenerates a fresh pairing code, different from the original')
      })(),
      exitedEarly,
    ])

    // --- The just-revoked token no longer works ---
    await Promise.race([
      (async () => {
        controlA.send(JSON.stringify({ type: 'action', channel: 'composer', token: tokenA, payload: { blanked: false, screenId: 'arrival-1', screen: legitScreen } }))
        const rejected = await controlAMessages.waitFor((raw) => JSON.parse(raw).type === 'actionRejected')
        assert(!!rejected, "the token from before unpair is rejected afterward — it's actually revoked, not just hidden client-side")
      })(),
      exitedEarly,
    ])

    // --- Requirement 3, checked directly against everything each side actually received ---
    assert(
      !controlAMessages.seen.some((raw) => JSON.parse(raw).type === 'pairingStatus'),
      'the pairing code never reaches a control-role socket, across this entire session (checked against every message it received)',
    )
    assert(
      !controlBMessages.seen.some((raw) => JSON.parse(raw).type === 'pairingStatus'),
      'the pairing code never reaches a second control-role socket either',
    )
    assert(
      !displayMessages.seen.some((raw) => raw.includes(tokenA)),
      "the issued token value never appears anywhere in what /display received, across this entire session",
    )
    assert(
      !displayMessages.seen.some((raw) => ['paired', 'pairError', 'actionRejected', 'unpaired'].includes(JSON.parse(raw).type)),
      'display-role sockets never receive any pairing/token-related message type at all',
    )

    display.close()
    controlA.close()
    controlB.close()
    console.log('PASS: privacy + auth/pairing live integration test')
  } finally {
    server.kill('SIGTERM')
    rmSync(stateDir, { recursive: true, force: true })
  }
}

async function testAtomicStateWrite() {
  const port = 4198
  const stateDir = mkdtempSync(join(tmpdir(), 'classroom-sync-livetest-atomic-'))
  const stateFile = join(stateDir, 'state.json')

  // Simulate exactly the failure mode being fixed: a prior process died
  // mid-write and left a truncated/corrupt file where STATE_FILE should be.
  writeFileSync(stateFile, '{"composer": {"blanked": true, "screenId": "arriv') // deliberately truncated JSON

  const { server, exitedEarly } = spawnServer(port, stateFile)
  try {
    await Promise.race([new Promise((r) => setTimeout(r, 700)), exitedEarly])

    const display = new WebSocket(`ws://${HOST}:${port}/__classroom-sync?role=display`)
    const displayMessages = recordMessages(display)
    await Promise.race([waitForOpen(display), exitedEarly])
    const hello = await Promise.race([displayMessages.waitFor((raw) => JSON.parse(raw).type === 'hello'), exitedEarly])
    const helloState = JSON.parse(hello).state
    assert(
      helloState.composer.blanked === false && helloState.composer.screenId === null,
      'a corrupted pre-existing state file does not crash the server — it falls back to default state cleanly',
    )

    // Now perform a real save (pair + one action) and confirm no stray .tmp file is left behind.
    const control = new WebSocket(`ws://${HOST}:${port}/__classroom-sync?role=control`)
    const cMessages = recordMessages(control)
    await Promise.race([waitForOpen(control), exitedEarly])
    await Promise.race([cMessages.waitFor((raw) => JSON.parse(raw).type === 'hello'), exitedEarly])
    const status = await Promise.race([displayMessages.waitFor((raw) => JSON.parse(raw).type === 'pairingStatus'), exitedEarly])
    const code = JSON.parse(status).code as string
    control.send(JSON.stringify({ type: 'pair', code }))
    const paired = await Promise.race([cMessages.waitFor((raw) => JSON.parse(raw).type === 'paired'), exitedEarly])
    const token = JSON.parse(paired).token as string
    control.send(
      JSON.stringify({
        type: 'action',
        channel: 'randomNumber',
        token,
        payload: { value: 7 },
      }),
    )
    await Promise.race([displayMessages.waitFor((raw) => JSON.parse(raw).type === 'state' && JSON.parse(raw).channel === 'randomNumber'), exitedEarly])
    await new Promise((r) => setTimeout(r, 200)) // let the async fs write settle

    const filesAfterSave = readdirSync(stateDir)
    assert(filesAfterSave.includes('state.json'), 'a real save produces the final state file')
    assert(
      !filesAfterSave.some((f) => f.includes('.tmp')),
      'a real save leaves no stray .tmp file behind — the rename cleaned it up',
    )
    const finalState = JSON.parse(readFileSync(stateFile, 'utf8'))
    assert(finalState.randomNumber.value === 7, 'the post-recovery save round-trips real data correctly, proving the fix does not just mask corruption')

    display.close()
    control.close()
    console.log('PASS: atomic state write / crash-resilience test')
  } finally {
    server.kill('SIGTERM')
    rmSync(stateDir, { recursive: true, force: true })
  }
}

async function main() {
  await testPrivacyAuthAndPairing()
  await testAtomicStateWrite()
  console.log('ALL PASS: classroom sync live integration test')
}

main().catch((err) => {
  console.error('FAIL:', err)
  process.exitCode = 1
})
