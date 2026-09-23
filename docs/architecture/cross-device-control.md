# Cross-Device Control — Stage 1 (Investigation + Design)

**Date:** 2026-09-23
**Status:** Stage 1 (this document's investigation and design) is complete. Stage 2 (sync server core) and Stage 3 (pairing/security) are now implemented — see "Implementation status" below. The rest of this document is kept as originally written, as the design record; it is no longer a description of unbuilt work.
**Scope:** Command Center only.

**Target setup:** MacBook Air M1 runs Command Center + a local sync server, shows `/display` on the classroom TV (extended display). iPad runs `/control` in Safari over Wi-Fi as a walk-around remote. M5 Pro is development only.

---

## Implementation status (2026-09-23, added after Stage 1)

**Stage 2 — sync server core.** `server/classroomSyncServer.ts`: one Node process, one port, serving the production build and a WebSocket endpoint (`ws`, path `/__classroom-sync`). Canonical state (`composer`: Blank + active Display Composer screen, which is also how a screen's timer widget reaches `/display`; `randomNumber`) lives in memory and is mirrored to a JSON file for restart survival. `src/lib/sync/sanitize.ts` re-runs every incoming action through the app's real `toDisplaySafeScreen`/`toDisplaySafeRandomNumberSnapshot` filters server-side before storing or broadcasting — the safe/unsafe boundary is enforced by the wire protocol itself, per §3's requirement, not by trusting the sender. Blank precedence holds across the wire (a blanked action clears the screen even if one was smuggled into the same message). `src/lib/sync/controlSyncClient.ts` / `displaySyncClient.ts` are best-effort bridges: same-device sync is untouched, and everything no-ops cleanly if no sync server is reachable.

Deferred from Stage 2's "core," by explicit go-ahead: **Prize Board** (Press Your Luck) has no wire channel yet — it's multi-store plus a live client-side spin animation, real follow-up scope, not built. **Noise meter** turned out not to be rendered on `/display` at all, in this codebase, ever — there is nothing to sync.

**Stage 3 — pairing/security,** per §4 below, now implemented (not just designed): a 6-digit pairing code shown on `/display` when unpaired; `/control` submits it once and receives a long random token, stored in `localStorage`; every action must carry a valid token or the server silently drops it; the code is single-use (regenerates on successful pairing) and never reaches a control-role socket, and the token never reaches a display-role socket (role is set once per connection via `?role=control|display` on the WebSocket URL, and the server uses it to decide who gets which message types). `/control` has an "Unpair this device" control; restarting the server is the fallback if the iPad itself is unreachable — pairing state is deliberately kept in memory only, never persisted, so a restart genuinely revokes it. Session length is "pair once per server boot," per the design's own recommendation.

Also fixed: the state-file save is now atomic (write to a temp file, then rename), so a crash mid-write can't corrupt `.local/classroom-sync-state.json`.

**Verified:** `npm run test:classroom-sync` (sanitizer unit tests + a live integration test against a real spawned server and real WebSocket clients — poisoned-payload privacy checks, Blank precedence, unpaired/invalid-token rejection, a second never-paired browser unable to act, token revocation after unpair, atomic-write crash recovery); full existing regression suite (`build`, `lint`, `test:display-import-guard`, `test:display-bundle-guard`, `test:clean-board`) still green. Live-verified on real hardware: the physical school-owned iPad, over real Wi-Fi, paired via the code shown on `/display`, cast a screen (with its timer widget) and Blank, both reflected live on a separate machine; a second, never-paired browser was confirmed unable to control the display; unpair/re-pair with a fresh device and back to the iPad was exercised live; Random Number was also live-verified end-to-end this way.

**Still open:** Item 1 (touch/pointer support for `/control`'s drag code) and item 5 (reconnect/disconnected-state UI, §5) from the staged build plan below are not built — the client bridges retry with simple backoff, but `/display` has no visible "disconnected" indicator yet. Prize Board sync (above). A Linux Playwright snapshot baseline and a few other pre-existing, unrelated gaps noted elsewhere are untouched by this work. Pairing attempts during the unpaired window are not rate-limited — a brute-force guess against the 6-digit code on school Wi-Fi is not currently defended against. Sync runs over plain `ws://` on the local network; the token could be sniffed by another device on shared Wi-Fi, and whether `wss://` is worth the added certificate/setup complexity for a classroom LAN is an open question. The noise meter is not rendered on `/display` at all, in this codebase — that's a display feature gap independent of sync, not something Stage 2/3 need to carry.

## 1. How `/control` currently sends state to `/display` — and whether cross-device works today

**Verified fact: it doesn't, and the code says so explicitly.** The existing sync mechanism is same-browser, same-device only. Two primitives are in use:

- **`window.addEventListener('storage', ...)`** — the native browser `storage` event, which only fires when `localStorage` is written **from a different tab/window of the same browser on the same device**. The exact mechanism, with its own doc comment stating the constraint plainly:

  `src/features/display-composer/displayComposerStore.ts:309-327`:
  > "Live cross-tab sync: /control and /display are separate browser tabs sharing only localStorage. Zustand's persist middleware only rehydrates on load, so without this, an already-open /display tab would not see 'Send to Display' or live edits until reload."

  The same pattern is repeated in three other stores: `src/features/prize-board/pressYourLuck/pressYourLuckStore.ts:212`, `src/store/qrCastStore.ts:39`, `src/store/stampStore.ts:126`.

- **`BroadcastChannel`** — used once, in `src/store/stampProjectionChannel.ts`, for stamp-redemption celebration events. Also strictly same-origin, same-browser — does not cross devices, and (per MDN/spec) doesn't even cross different browsers on the same device.

**Plain answer: cross-device sync does not exist today.** `localStorage`, the `storage` event, and `BroadcastChannel` are all scoped to a single browser instance on a single device. An iPad opening `/control` in Safari and a Mac showing `/display` in its own browser are two completely separate storage origins with zero shared state. Nothing currently built carries a single byte between them. This is Stage 1's actual starting line — there is no partial cross-device mechanism to extend, only a same-device one to learn from and fully replace for the cross-device case.

**A second, related finding worth flagging:** even today's *same-device* sync is inconsistent. Only 4 of the many stores `/display` reads from have the `storage`-event bridge wired up (Display Composer, Prize Board/Press Your Luck, QR Cast, Stamps). Everything else — `timerStore`, `boardStore` (Morning Message, Now Showing, noise trackers), Clean Board's `spotifyStore`, `pickerStore`, `randomNumberStore` — has **no** cross-tab bridge at all; an already-open `/display` tab will not reflect a change to any of these until it's reloaded, even on the same Mac today. (`qa/display-overlay-pipeline-audit.md`'s own table confirms this for Random Number: "Cross-tab sync? no.") Any new sync design needs to cover all of these uniformly, or it will just relocate this same gap to the cross-device case.

---

## 2. State inventory: what `/display` needs, which store owns it, and privacy flags

| State | Owning store | Student/display-facing? | **Teacher-only — must never cross the wire** |
|---|---|---|---|
| Active screen / blank state | `displayComposerStore` | Screen content when `studentSafe` | `teacherNotes` on the screen; the full `screens` map (only the active, filtered screen should ever be sent) |
| Widget layout & settings (Display Studio) | `displayComposerStore` (`CanvasWidget`) | Position/size/type/label | Raw `settings: Record<string, unknown>` before `toDisplaySafeWidget`-style filtering — this is exactly what the existing `displaySafe.ts` already strips locally; the network boundary must apply the same filter, not trust the sender |
| Clean Board base canvas | Clean Board's own persisted `BoardState` (`storage/boardStorage.ts`) | Page content, background, theme | `teacherNotes`, `updatedAt`, `version`, and critically **`accessToken`, `refreshToken`, `deviceId`, `accountId`, `clientSecret`** — `boardSafety.ts`'s own `FORBIDDEN_BOARD_KEYS` list already names these; a network-transparent design must never let a raw `BoardState` object touch the wire unfiltered |
| Spotify | `spotify/spotifyStore.ts` | "Now playing" label only | `clientId`, `accessToken`, `refreshToken` — real OAuth credentials. Already reduced to `{ kind: 'spotifyNowPlayingPlaceholder', label }` by `boardSafety.ts`'s `sanitizeConfig`; that reduction must happen **before** anything is serialized for the network, not after |
| Timers (transition/task/routine) | `timerStore` | Label + remaining time | None significant — timers are inherently student-facing content |
| Noise meter / tracker | `boardStore.noiseTrackers` | Current level | Reset controls and any per-incident history stay teacher-only |
| Student Picker / Mystery Star | `pickerStore` | The picked student's name (when explicitly cast) | The full `students` roster, `fairnessHistory`, `coachingConfig` — these carry real student PII and are explicitly documented elsewhere in this project as a "privacy boundary" that must hold; only the single active pick result may ever be projected, never the roster |
| Prize Board / Press Your Luck | `pressYourLuckStore` | Game outcome/animation state | Any admin/config fields not part of `stripPrivateBoardFields`'s existing allowlist |
| Random Number | `randomNumberStore` | `lastResult` when `showOnDisplay` | Nothing else in this store needs to leave the device |
| Morning Message / Now Showing | `boardStore` | Message content, resource label | `todayPrep.resourceLinks`' underlying URLs beyond the safe label (per `NowShowingDisplayLabel`'s existing "label + preset text only, no URL" rule) |
| Stamps | `stampStore` + `stampProjectionChannel.ts` | The one actively-cast student's balance/milestones | The full per-student `students` map — `stampProjectionChannel.ts` already exists specifically to prevent this and is the right model to copy |

**The core design requirement this table implies:** the existing display-safe projection functions (`toDisplaySafeScreen`/`toDisplaySafeWidget`, `boardSafety.ts`'s `toSafeBoardPage`, `stripPrivateBoardFields`, `stampProjectionChannel.ts`'s narrow accessors) are currently a **within-browser** convention — they run in the same JS runtime as the data they're filtering, and nothing stops a bug from sending the unfiltered object instead. Once state crosses a real network boundary (iPad → Mac, two different processes), **the safe/unsafe boundary must be enforced by what the wire protocol carries, not by which function the sender happened to call.** Concretely: the M1 sync server should be the thing that applies (or re-applies) these existing filters server-side before relaying to any `/display` client, so a bug in a future `/control` code path can leak state into a local variable but can't leak it onto the wire.

---

## 3. Recommended sync architecture

**Keep it simple, per the brief: single teacher, one display, one remote, local network only, no cloud.**

- **A small WebSocket server on the M1**, running alongside the app (not a separate always-on service — start it as part of the same `npm run` flow that serves the app, so there's one process to reason about, not two). Node's built-in `ws`-style server or Bun's native WebSocket support both fit; no need for Socket.IO's reconnection/room machinery given the scale (one server, one client) — the reconnect logic in §5 is simple enough to hand-roll.
- **Source of truth: the M1 server holds canonical state in memory** (rehydrated from the same `localStorage`-backed persistence the app already uses, so nothing about today's persistence model needs to change). `/control` on the iPad sends *actions* (not raw state) over the WebSocket — "send screen X to display," "move widget Y," "start timer Z" — the server applies them to canonical state, applies the display-safe filter, and pushes the resulting safe projection to any connected `/display` client(s). This mirrors the existing Zustand action-based model closely, so the store actions themselves don't need to be rewritten — only their trigger path gains a network hop for the iPad case.
- **Two serving modes:**
  - **Development (Vite dev server):** the WebSocket server runs as a small sidecar process on a fixed local port (e.g. `ws://<mac-ip>:PORT`); Vite's dev server and the WS server are independent, which is fine for iterating.
  - **Production/classroom use:** build the app (`vite build`) and serve the static output plus the WebSocket endpoint from **one process** on the M1, so there's a single thing to start before class and a single thing that can fail — not two services to keep in sync.
- **Why not peer-to-peer (WebRTC data channels) instead of a server:** it's a heavier setup (signaling, ICE) for zero benefit here — both devices are already on the same LAN with a Mac that's staying put all day as the natural always-on host. A plain WebSocket server on the Mac is simpler to build, debug, and reason about for this scale.

---

## 4. Pairing / security design

**Verified pattern (2026, well-established):** the "code shown on the big screen, entered on the small device" flow — the same shape AirPlay, Chromecast, and virtually every smart-TV app (YouTube TV, Peacock, etc.) use, precisely because typing on a TV is worse than typing on a phone. This is a validated, standard UX pattern, not a novel design — Owen's working assumption in the task brief is correct.

**Design:**
1. On boot, `/display` shows a short pairing code (e.g. 6 digits) in a corner, generated by the M1 server and held in memory.
2. On the iPad, `/control` prompts for that code once; on submit, the iPad's WebSocket connection sends it, the server validates it and issues a session token back, which Safari stores (e.g. `localStorage` on the iPad — this is a different device/origin than the Mac's own storage, no conflict).
3. Any WebSocket connection without a valid token is rejected before it can send or receive real state.

**Session length — this is a judgment call, not a researched fact:** re-pairing on every reconnect would be classroom-hostile (the iPad will sleep and reconnect constantly through a school day). Recommend the token be valid until explicitly cleared or until the M1 server restarts (i.e., effectively "pair once per day/boot," not "pair once per connection"). The pairing code itself should regenerate each time the server (re)starts, so an old code from a previous day can't be reused by a different device later.

**School network context:** since this runs on a school Wi-Fi network Owen doesn't administer, the pairing code is the actual security boundary (not network trust) — anyone who can see the TV and is on the same Wi-Fi could theoretically pair, which is an acceptable risk for a single classroom, but worth being explicit about: this is "keep a stranger from casually taking over the display," not a hardened multi-tenant auth system, and doesn't need to be more than that.

---

## 5. Reliability design

**Auto-reconnect (verified 2026 standard practice):** exponential backoff **with jitter** (not plain backoff — without jitter, if both devices reconnect around the same trigger, e.g. Wi-Fi hiccup, they retry in lockstep) — start around 500ms–1s, double each attempt, cap around 30s, with a sane attempt ceiling (~10–15) before giving up and showing a persistent "disconnected" state rather than retrying forever silently. A hand-rolled `onclose`/`setTimeout` implementation is completely standard for a project this size — no need to pull in a library for this alone, though `reconnecting-websocket`-style libraries exist if preferred.

**What `/display` shows while disconnected:** keep the **last-known-good content on screen**, with a small, unobtrusive persistent status indicator (not a full-screen error) — the classroom shouldn't go blank or show a scary error just because the iPad's Wi-Fi blipped for two seconds. This is judgment, not a documented industry standard (no authoritative digital-signage source was found specifying this exact behavior), but it's consistent with how the existing Blank/Restore overlay is already designed to behave deliberately, not accidentally.

**What happens if the M1 restarts mid-lesson:** the server should rehydrate canonical state from the same persisted `localStorage`/board-storage data the app already keeps, so a restart returns to "whatever was last shown," not a blank slate. `/display`, on losing its WebSocket connection, keeps showing its last-received frame (per above) until the server comes back and pushes fresh state — it should not clear itself just because the connection dropped.

---

## 6. Network client isolation — verified risk, and a correction to the assumed fallback

**Verified fact:** AP/client (Wi-Fi) isolation — a setting that blocks device-to-device traffic between clients on the same SSID — is a standard, widely-deployed feature (documented by Meraki, Ubiquiti, TP-Link) and is common specifically on institutional/school/guest/BYOD networks, for exactly the reason this task is worried about. **If it's enabled on the school's network, a direct WebSocket between the iPad and the Mac will fail outright** — this isn't a "might be flaky," it's a hard block by design.

**Correction to the task's assumed fallback ("travel router or Mac network sharing"):** these two options are not equally viable here. **macOS Internet Sharing can only share a Wi-Fi hotspot when the Mac's own internet connection is *not* itself Wi-Fi** (it needs to be Ethernet, cellular, or USB — sharing "Wi-Fi out over Wi-Fi in" isn't supported). A MacBook Air M1 whose only network connection *is* the school's Wi-Fi **cannot** also host a Wi-Fi hotspot for the iPad to join. Since this app needs no actual internet access (it's local-first), the realistic, always-works fallback is a **standalone travel router**: its own SSID, its own subnet, no isolation, and it doesn't need to uplink to anything since neither device needs real internet — both just need to see each other. Mac Internet Sharing only becomes viable if the M1 gets a wired connection to the school network (e.g., a USB-Ethernet adapter) freeing its Wi-Fi radio to host the hotspot instead — worth keeping in mind as a lighter-weight option if that's ever available, but not the default plan.

**Practical guidance:** treat "bring a $30-40 travel router as backup" as a standing part of the classroom kit, not a one-time contingency — whether client isolation is on can change without notice if IT updates the school network, and there's no way to detect it in advance from the app itself short of trying to connect and timing out.

---

## 7. iPad touch on `/control`: what's needed, and does dnd-kit fit

**What's needed (from the earlier engine-choice research, restated for cross-device context):** the current widget-canvas drag implementation (`DisplayStudioCanvas.tsx`) is `MouseEvent`-only — no touch handling exists at all today, verified directly in code. This was already identified as Phase-1 hygiene work independent of the engine choice; cross-device control makes it non-optional rather than just nice-to-have, since the iPad *is* the primary `/control` device in this target setup, not an occasional one.

**Does dnd-kit fit — verified/reasoned:** yes, for the core interaction. dnd-kit's sensors are built on the **Pointer Events API** (`pointerdown`/`pointermove`/`pointerup`), which is a unified event model covering mouse, touch, and pen input through a single `pointerType` field (`'mouse' | 'touch' | 'pen'`) — this is how Safari on iPadOS exposes Apple Pencil input as well as finger-touch, so a Pointer-Events-based drag library like dnd-kit should handle both without separate code paths. This matches the earlier engine research's recommendation (dnd-kit for drag, paired with a small resize component or `re-resizable`, since dnd-kit has no built-in resize). **This specific finger-vs-Pencil distinction has not been tested on real hardware as part of this design pass — it's a reasoned expectation based on how Pointer Events work, not a verified on-device result.** Confirming it needs the real iPad Safari check called out below.

---

## Staged build plan

1. **Touch/pointer support for the existing drag code** (already scoped as Phase-1 hygiene, independent of everything else here) — do this regardless of sync work, since it's needed either way.
2. **M1 WebSocket server, minimal:** canonical in-memory state seeded from existing persistence, action-based protocol, no pairing yet, tested with two browser tabs on the same Mac before ever touching the iPad — de-risks the transport before adding the network variable.
3. **Server-side display-safe filtering:** port `toDisplaySafeScreen`/`toSafeBoardPage`/`stripPrivateBoardFields`/the stamp-projection pattern to run once, server-side, on every outbound push to `/display` clients — this is the item that turns "works on one Mac" into "safe to put an iPad on the network," and should land before real iPad testing begins, not after.
4. **Pairing flow:** code-on-TV, enter-on-iPad, session token, as designed in §4.
5. **Reconnect + disconnected-state UI** on both ends, per §5.
6. **Real hardware validation:** iPad Safari over the actual school Wi-Fi (to observe whether client isolation is actually in effect there — this can't be determined without trying), finger + Apple Pencil drag confirmation, and a travel-router fallback rehearsal.

## Honest sizing

This is a genuinely new subsystem, not a small addition — a stateful server process, a new protocol, a pairing UX, and a reconnect/offline UX are all new surface area layered on top of a codebase that has never had a real network boundary before (everything today is same-browser). The touch-support piece (item 1) is small and already scoped elsewhere. The server + protocol + safety-filtering core (items 2–3) is the bulk of the real engineering work. Pairing and reconnect UX (items 4–5) are each individually small once the core exists. Item 6 is unavoidable and can't be fully derisked without the actual iPad on the actual school network — that step should happen early, not saved for the end, specifically to find out whether client isolation is a real blocker here before more is built on top of the assumption that it isn't.

---

## Confirmation

No application code was changed while producing this document. This file is the only artifact written.
