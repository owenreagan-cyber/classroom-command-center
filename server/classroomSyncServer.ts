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
 *   - Noise meter: turns out NOT to be rendered on /display at all today —
 *     grepped DisplayOverlayHost.tsx and BoardHostDisplay.tsx, no noise
 *     import in the display path. Nothing to sync; flagging this as a real
 *     finding, not an oversight.
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

  send(socket, { type: 'hello', state })
  if (role === 'display') {
    send(socket, { type: 'pairingStatus', code: pairing.code })
  }

  socket.on('message', (raw) => {
    let message: { type?: string; channel?: SyncChannel; payload?: unknown; token?: string; code?: string }
    try {
      message = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (message.type === 'pair') {
      if (typeof message.code !== 'string' || pairing.code === null || message.code !== pairing.code) {
        send(socket, { type: 'pairError', message: 'Incorrect or expired code.' })
        return
      }
      const token = generateToken()
      pairing.token = token
      pairing.code = null
      send(socket, { type: 'paired', token })
      broadcastPairingStatus()
      return
    }

    if (message.type === 'unpair') {
      if (typeof message.token !== 'string' || pairing.token === null || message.token !== pairing.token) {
        send(socket, { type: 'actionRejected', reason: 'unauthorized' })
        return
      }
      pairing.token = null
      pairing.code = generatePairingCode()
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
