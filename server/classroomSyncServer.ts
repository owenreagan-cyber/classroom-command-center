import { createServer } from 'node:http'
import { readFile, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, mkdirSync } from 'node:fs'
import { randomInt, randomBytes } from 'node:crypto'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import {
  SYNC_WS_PATH,
  defaultCanonicalState,
  type SyncCanonicalState,
  type SyncChannel,
  type SyncRole,
} from '../src/lib/sync/protocol.ts'
import { sanitizeComposerAction, sanitizeRandomNumberAction } from '../src/lib/sync/sanitize.ts'

/**
 * Classroom cross-device sync server.
 *
 * One process, one port: serves the production build (`dist/`) AND hosts the
 * WebSocket sync endpoint, so there is exactly one thing to start on the M1
 * before class and one thing that can fail (per the Stage 1 design doc's
 * "production/classroom use" recommendation).
 *
 * Canonical STATE (composer/randomNumber) lives in memory and is mirrored to
 * a JSON file so it survives a server restart — see saveState()/loadState().
 * This is NOT reading the browser's localStorage (a Node process cannot);
 * it's the server's own persistence, serving the same purpose the design
 * doc described.
 *
 * Scope (Stage 2 core, per go-ahead): `composer` (Blank + active Display
 * Composer screen, which also covers "start a timer" — timers on /display
 * only ever appear as a screen's `timerWidget`, confirmed by reading
 * DisplayOverlayHost.tsx; there is no standalone timerStore overlay) and
 * `randomNumber`. Deferred, not built here (per go-ahead):
 *   - Prize Board (Press Your Luck): multi-store (phase/board/pool +
 *     `useSpinAnimation`'s client-side animation loop), real scope for a
 *     follow-up, not a quick add.
 *   - Noise Defense (Hero Academy Defense System, `src/features/
 *     noise-defense/`): STALE NOTE, corrected 2026-09-25 — this used to say
 *     "not rendered on /display at all today, nothing to sync," which was
 *     true when this file was written but no longer is: `/display`
 *     (`BoardHostDisplay.tsx`) now mounts `NoiseDefenseHUD` directly. It's
 *     still not wired into this sync protocol, though, and that remains a
 *     deliberate deferral, not an oversight — see the "Known limitation"
 *     note in `docs/architecture/noise-game-design.md`. Cross-device (a
 *     paired `/control` on one device driving `/display`'s mic on another)
 *     is real scope for redesign stage 1, not a quick add here; today the
 *     whole feature (engine state, `jamReason`, opt-in, Jammer/Disengage)
 *     only cross-tab-syncs same-device via `noiseGameStore.ts`'s own
 *     `localStorage` + `storage`-event bridge, same pattern as
 *     `qrCastStore.ts`/`stampStore.ts` — not this WebSocket server at all.
 *   - Morning Message / Now Showing, Stamps, QR Cast, Clean Board canvas
 *     itself: out of the explicitly-scoped "core" list for this stage.
 *
 * Stage 3 — PAIRING is intentionally kept separate from canonical STATE:
 * pairing lives only in memory (`pairing`, below), never written to
 * STATE_FILE. Restarting the server is the documented M1/M5 fallback to
 * revoke a lost/stolen iPad's pairing (requirement 4) — that only works if
 * a restart actually clears it. See docs/architecture/cross-device-
 * control.md §4 for the design this implements.
 */

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const DIST_DIR = join(ROOT, 'dist')
// Overridable so scripts/test-classroom-sync.sh's live integration test can
// point at a throwaway file instead of the real classroom's persisted state.
const STATE_FILE = process.env.CLASSROOM_SYNC_STATE_FILE ?? join(ROOT, '.local', 'classroom-sync-state.json')

const PORT = Number(process.env.CLASSROOM_SYNC_PORT ?? 4180)
const HOST = process.env.CLASSROOM_SYNC_HOST ?? '0.0.0.0'

function loadState(): SyncCanonicalState {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, 'utf8')
      const parsed = JSON.parse(raw) as SyncCanonicalState
      if (parsed && typeof parsed === 'object' && parsed.composer) return parsed
    }
  } catch (err) {
    console.warn('[classroom-sync] could not read persisted state, starting fresh:', err)
  }
  return defaultCanonicalState()
}

/**
 * Atomic write: write to a throwaway temp file in the same directory, then
 * rename it over STATE_FILE. `rename` is atomic on the same filesystem (a
 * POSIX guarantee, true on macOS/APFS) — so a crash either happens before
 * the rename (STATE_FILE is untouched, still holds the last complete write)
 * or after it (STATE_FILE now holds the new complete write). There is no
 * window where STATE_FILE itself is a partial/truncated write, unlike the
 * previous direct `writeFileSync(STATE_FILE, ...)`.
 */
function saveState(state: SyncCanonicalState) {
  const dir = dirname(STATE_FILE)
  const tmpFile = join(dir, `.classroom-sync-state.${process.pid}.${Date.now()}.tmp`)
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(tmpFile, JSON.stringify(state, null, 2))
    renameSync(tmpFile, STATE_FILE)
  } catch (err) {
    console.warn('[classroom-sync] could not persist state:', err)
    try {
      unlinkSync(tmpFile)
    } catch {
      // tmp file was never created, or already gone — nothing to clean up
    }
  }
}

let state: SyncCanonicalState = loadState()

// --- Stage 3: pairing (in-memory only, see file header) ---

function generatePairingCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

const pairing: { code: string | null; token: string | null } = {
  code: generatePairingCode(),
  token: null,
}

const socketRoles = new WeakMap<WebSocket, SyncRole>()

// --- Pairing rate limiting (brute-force protection on school Wi-Fi) ---
//
// Two layers, deliberately different shapes:
//
// 1. Per-connection cooldown: the first PAIR_FREE_ATTEMPTS wrong guesses on a
//    given socket cost nothing (a teacher mistyping the 6-digit code once or
//    twice is common and should never be penalized). Past that, each further
//    wrong guess on THAT connection earns a growing cooldown (1s, 2s, 4s...,
//    capped) before it's allowed to try again. This resets to fresh on a new
//    connection -- by design; see layer 2 for why that's not a bypass.
//
// 2. Global cap: a single counter, shared across every connection, of wrong
//    guesses since the current code was issued. Reconnecting with a fresh
//    socket resets layer 1's cooldown but NOT this counter, so "just open a
//    new socket every couple of guesses" cannot dodge it. Once the cap is
//    hit, the code itself rotates and /display shows the new one immediately
//    -- this, not the cooldown, is the real ceiling: whatever fraction of the
//    guess space was covered before the cap trips is thrown away, so no
//    accumulation of attempts across reconnects/rotations ever gets closer to
//    the (currently) live code.
const PAIR_FREE_ATTEMPTS = 3
const PAIR_COOLDOWN_CAP_SECONDS = 30
const PAIR_GLOBAL_ATTEMPT_CAP = 25

interface PairingAttemptState {
  wrongAttempts: number
  cooldownUntil: number
}

const pairingAttempts = new Map<WebSocket, PairingAttemptState>()
let globalWrongPairAttempts = 0

/** Called whenever the live code changes for any reason (successful pair,
 * explicit unpair, or a forced rotation below) -- the old code's attempt
 * history is no longer meaningful once it can't be guessed into anymore. */
function resetAllPairingAttempts() {
  globalWrongPairAttempts = 0
  for (const s of pairingAttempts.values()) {
    s.wrongAttempts = 0
    s.cooldownUntil = 0
  }
}

/** wrongAttempts is this connection's count AFTER the current guess. Returns
 * 0 while still within the free budget. */
function cooldownSecondsFor(wrongAttempts: number): number {
  const over = wrongAttempts - PAIR_FREE_ATTEMPTS
  if (over <= 0) return 0
  return Math.min(PAIR_COOLDOWN_CAP_SECONDS, 2 ** (over - 1))
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
}

function serveStatic(pathname: string, res: import('node:http').ServerResponse) {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const hasExtension = extname(safePath) !== ''
  const filePath = hasExtension ? join(DIST_DIR, safePath) : join(DIST_DIR, 'index.html')

  readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: any unresolved path (e.g. /control, /display) serves index.html.
      readFile(join(DIST_DIR, 'index.html'), (fallbackErr, fallbackData) => {
        if (fallbackErr) {
          res.writeHead(500)
          res.end('Build not found. Run `npm run build` first.')
          return
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] })
        res.end(fallbackData)
      })
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' })
    res.end(data)
  })
}

const httpServer = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  serveStatic(url.pathname, res)
})

const wss = new WebSocketServer({ server: httpServer, path: SYNC_WS_PATH })

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
}

function broadcastState(channel: SyncChannel, payload: unknown) {
  const message = JSON.stringify({ type: 'state', channel, payload })
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message)
  }
}

/** Requirement 3: the pairing code is only ever sent to display-role
 * sockets — a control socket never receives this message type at all. */
function broadcastPairingStatus() {
  for (const client of wss.clients) {
    if (socketRoles.get(client) === 'display') {
      send(client, { type: 'pairingStatus', code: pairing.code })
    }
  }
}

wss.on('connection', (socket, req) => {
  const url = new URL(req.url ?? '/', 'http://internal')
  // Unknown/missing role defaults to 'control' semantics (never gets the
  // pairing code) — err toward not leaking rather than toward convenience.
  const role: SyncRole = url.searchParams.get('role') === 'display' ? 'display' : 'control'
  socketRoles.set(socket, role)
  pairingAttempts.set(socket, { wrongAttempts: 0, cooldownUntil: 0 })

  send(socket, { type: 'hello', state })
  if (role === 'display') {
    send(socket, { type: 'pairingStatus', code: pairing.code })
  }

  socket.on('close', () => {
    pairingAttempts.delete(socket)
  })

  socket.on('message', (raw) => {
    let message: { type?: string; channel?: SyncChannel; payload?: unknown; token?: string; code?: string }
    try {
      message = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (message.type === 'pair') {
      // Every socket got an entry in the connection handler above; this
      // fallback only matters if a message somehow arrives after 'close'.
      const attemptState = pairingAttempts.get(socket) ?? { wrongAttempts: 0, cooldownUntil: 0 }
      const now = Date.now()

      if (now < attemptState.cooldownUntil) {
        send(socket, { type: 'rateLimited', retryAfterSeconds: Math.ceil((attemptState.cooldownUntil - now) / 1000) })
        return
      }

      if (typeof message.code === 'string' && pairing.code !== null && message.code === pairing.code) {
        const token = generateToken()
        pairing.token = token
        pairing.code = null
        resetAllPairingAttempts()
        send(socket, { type: 'paired', token })
        broadcastPairingStatus()
        return
      }

      attemptState.wrongAttempts += 1
      globalWrongPairAttempts += 1

      if (globalWrongPairAttempts >= PAIR_GLOBAL_ATTEMPT_CAP) {
        pairing.code = generatePairingCode()
        resetAllPairingAttempts()
        send(socket, {
          type: 'pairError',
          message: 'Too many incorrect attempts across all devices. A new code is now shown on the display.',
        })
        broadcastPairingStatus()
        return
      }

      const cooldown = cooldownSecondsFor(attemptState.wrongAttempts)
      if (cooldown > 0) {
        attemptState.cooldownUntil = now + cooldown * 1000
        send(socket, { type: 'rateLimited', retryAfterSeconds: cooldown })
      } else {
        send(socket, { type: 'pairError', message: 'Incorrect or expired code.' })
      }
      return
    }

    if (message.type === 'unpair') {
      if (typeof message.token !== 'string' || pairing.token === null || message.token !== pairing.token) {
        send(socket, { type: 'actionRejected', reason: 'unauthorized' })
        return
      }
      pairing.token = null
      pairing.code = generatePairingCode()
      resetAllPairingAttempts()
      send(socket, { type: 'unpaired' })
      broadcastPairingStatus()
      return
    }

    if (message.type !== 'action') return
    // Defense in depth: only a control-role socket's actions are ever
    // considered, regardless of what token it presents.
    if (role !== 'control') return

    if (typeof message.token !== 'string' || pairing.token === null || message.token !== pairing.token) {
      send(socket, { type: 'actionRejected', reason: 'unauthorized' })
      return
    }

    if (message.channel === 'composer') {
      const safe = sanitizeComposerAction(message.payload)
      state = { ...state, composer: safe }
      saveState(state)
      broadcastState('composer', safe)
      return
    }

    if (message.channel === 'randomNumber') {
      const safe = sanitizeRandomNumberAction(message.payload)
      state = { ...state, randomNumber: safe }
      saveState(state)
      broadcastState('randomNumber', safe)
      return
    }
  })
})

httpServer.listen(PORT, HOST, () => {
  console.log(`[classroom-sync] serving ${DIST_DIR} and ws sync on http://${HOST}:${PORT} (path ${SYNC_WS_PATH})`)
  console.log(`[classroom-sync] pairing code: ${pairing.code} (also shown on /display until paired)`)
  if (!existsSync(DIST_DIR)) {
    console.warn(`[classroom-sync] WARNING: ${DIST_DIR} does not exist yet. Run \`npm run build\` first.`)
  }
})
