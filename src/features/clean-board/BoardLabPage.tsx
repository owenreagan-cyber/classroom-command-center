import { useEffect, useMemo, useState } from 'react'
import { BoardCanvas } from './BoardCanvas'
import { BoardToolbar } from './BoardToolbar'
import { KeepAwakeToggle } from './KeepAwakeToggle'
import { pageHasKind, toSafeBoardPage } from './boardSafety'
import { createSeedBoard } from './seedBoard'
import { SpotifyTeacherPanel } from './spotify/SpotifyTeacherPanel'
import { hasCallbackParams } from './spotify/spotifyPkce'
import { toSafeNowPlaying } from './spotify/spotifySafety'
import { useSpotifyStore } from './spotify/spotifyStore'
import type { BoardDeck, BoardMode, BoardObject, BoardObjectKind } from './types'

const segBtn = 'rounded-md px-3 py-1.5 text-xs font-semibold transition'
const segActive = 'bg-slate-700 text-white'
const segIdle = 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'

function readInitialMode(): BoardMode {
  if (typeof window === 'undefined') return 'present'
  const params = new URLSearchParams(window.location.search)
  // Returning from Spotify OAuth (code/error in URL) routes back to edit mode
  // so the teacher lands next to their control panel.
  if (params.get('mode') === 'edit' || hasCallbackParams(window.location.search)) {
    return 'edit'
  }
  return 'present'
}

function createDefaultObject(kind: BoardObjectKind, id: string): BoardObject {
  const base = { id, kind, rotation: 0, locked: false, visible: true, layer: 100 }
  switch (kind) {
    case 'text':
      return {
        ...base,
        x: 660,
        y: 470,
        w: 600,
        h: 140,
        config: {
          kind,
          text: 'New text',
          fontSize: 64,
          color: '#f8fafc',
          align: 'center' as const,
        },
      }
    case 'image':
      return {
        ...base,
        x: 640,
        y: 360,
        w: 640,
        h: 360,
        config: { kind, src: '', alt: 'Image placeholder', fit: 'cover' as const },
      }
    case 'link':
      return {
        ...base,
        x: 720,
        y: 480,
        w: 480,
        h: 120,
        config: { kind, url: 'https://example.com', label: 'New Link' },
      }
    case 'videoEmbed':
      return {
        ...base,
        x: 640,
        y: 360,
        w: 640,
        h: 360,
        config: { kind, src: 'https://example.com', label: 'Video' },
      }
    case 'clock':
      return {
        ...base,
        x: 830,
        y: 470,
        w: 280,
        h: 150,
        config: { kind, format: '12h' as const, label: '8:00' },
      }
    case 'timer':
      return {
        ...base,
        x: 830,
        y: 470,
        w: 280,
        h: 150,
        config: { kind, durationMinutes: 5, label: '5:00' },
      }
    case 'spotifyNowPlayingPlaceholder':
      return {
        ...base,
        x: 720,
        y: 480,
        w: 520,
        h: 130,
        config: { kind, label: 'Now Playing' },
      }
  }
}

/**
 * DB-1 — Clean Board Lab shell.
 *
 * A single isolated /board-lab route with a dominant 16:9 board canvas, a
 * minimal top bar (title + Present/Edit toggle + page title), page dots, and
 * an edit-only add toolbar. No dock, no tool grid, no status wall, no old
 * Command Center UI.
 */
export function BoardLabPage() {
  const [deck, setDeck] = useState<BoardDeck>(() => createSeedBoard())
  const [mode, setModeState] = useState<BoardMode>(() => readInitialMode())
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    // Pre-select the Spotify placeholder in edit mode (including on OAuth
    // callback) so the teacher panel is immediately visible.
    if (readInitialMode() === 'edit') {
      const seed = createSeedBoard()
      return (
        seed.pages[0].objects.find((o) => o.kind === 'spotifyNowPlayingPlaceholder')?.id ?? null
      )
    }
    return null
  })

  const init = useSpotifyStore((s) => s.init)
  const authStatus = useSpotifyStore((s) => s.authStatus)
  const startPlaybackPolling = useSpotifyStore((s) => s.startPlaybackPolling)
  const stopPlaybackPolling = useSpotifyStore((s) => s.stopPlaybackPolling)

  // Run the Spotify handshake/restore once at the shell level so the OAuth
  // callback is consumed even when present mode is the initial route (the
  // teacher panel is only mounted in edit mode).
  useEffect(() => {
    void init()
  }, [init])

  // Single owner for now-playing polling: the board shell runs in both edit
  // and present modes, and this effect stops the loop on unmount or when the
  // session is no longer connected.
  useEffect(() => {
    if (authStatus === 'connected') {
      startPlaybackPolling()
    } else {
      stopPlaybackPolling()
    }
    return () => stopPlaybackPolling()
  }, [authStatus, startPlaybackPolling, stopPlaybackPolling])

  const activePage = deck.pages.find((p) => p.id === deck.activePageId) ?? deck.pages[0]

  const spotifyNowPlaying = useSpotifyStore((s) => s.nowPlaying)
  const safeNowPlaying = useMemo(() => toSafeNowPlaying(spotifyNowPlaying), [spotifyNowPlaying])

  const selectedObject = activePage.objects.find((o) => o.id === selectedObjectId)
  const showSpotifyPanel =
    mode === 'edit' && selectedObject?.kind === 'spotifyNowPlayingPlaceholder'

  const present = useMemo(() => toSafeBoardPage(activePage), [activePage])

  const canvasObjects = useMemo(() => {
    if (mode === 'present') return present.objects
    return [...activePage.objects].sort((a, b) => a.layer - b.layer)
  }, [mode, present.objects, activePage.objects])

  const setMode = (next: BoardMode) => {
    setModeState(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (next === 'present') url.searchParams.delete('mode')
      else url.searchParams.set('mode', 'edit')
      window.history.replaceState(null, '', url)
    }
  }

  const handleAddObject = (kind: BoardObjectKind) => {
    const pageId = activePage.id
    // A now-playing tile is singular by nature — prevent stacking duplicates
    // (e.g. from repeated "Add Spotify" clicks across HMR) by re-selecting the
    // existing object instead of adding another.
    if (kind === 'spotifyNowPlayingPlaceholder' && pageHasKind(activePage.objects, kind)) {
      const existing = activePage.objects.find((o) => o.kind === kind)
      if (existing) setSelectedObjectId(existing.id)
      return
    }
    const obj = createDefaultObject(kind, `${kind}-${Date.now()}`)
    setDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      pages: prev.pages.map((p) =>
        p.id === pageId ? { ...p, objects: [...p.objects, obj] } : p,
      ),
    }))
    setSelectedObjectId(obj.id)
  }

  const handleMoveObject = (id: string, x: number, y: number) => {
    const pageId = activePage.id
    setDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      pages: prev.pages.map((p) =>
        p.id === pageId
          ? { ...p, objects: p.objects.map((o) => (o.id === id ? { ...o, x, y } : o)) }
          : p,
      ),
    }))
  }

  const selectPage = (id: string) => {
    setDeck((prev) => ({ ...prev, activePageId: id }))
    setSelectedObjectId(null)
  }

  return (
    <div
      className="flex h-dvh w-dvw flex-col overflow-hidden bg-slate-950 text-slate-100"
      data-board-lab
    >
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Board Lab
          </span>
          <div
            className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5"
            role="tablist"
            aria-label="Board mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'present'}
              onClick={() => setMode('present')}
              data-board-mode="present"
              className={`${segBtn} ${mode === 'present' ? segActive : segIdle}`}
            >
              Present
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'edit'}
              onClick={() => setMode('edit')}
              data-board-mode="edit"
              className={`${segBtn} ${mode === 'edit' ? segActive : segIdle}`}
            >
              Edit
            </button>
          </div>
        </div>
        <span className="truncate text-sm font-medium text-slate-300" data-board-page-title>
          {activePage.title}
        </span>
      </header>

      {mode === 'edit' && (
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-800 px-5 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add</span>
          <BoardToolbar onAdd={handleAddObject} />
          <div className="ml-auto">
            <KeepAwakeToggle />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className="min-h-0 flex-1">
          <BoardCanvas
            background={mode === 'present' ? present.background : activePage.background}
            objects={canvasObjects}
            mode={mode}
            selectedObjectId={selectedObjectId}
            onSelect={setSelectedObjectId}
            onMoveObject={handleMoveObject}
            spotifyNowPlaying={safeNowPlaying}
          />
        </main>
        {showSpotifyPanel && (
          <div className="w-80 shrink-0" data-board-lab-spotify-panel>
            <SpotifyTeacherPanel />
          </div>
        )}
      </div>

      <footer
        className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-800 py-2.5"
        data-board-page-dots
      >
        {deck.pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPage(p.id)}
            aria-label={p.title}
            data-board-page-dot={p.id}
            className={`h-2.5 w-2.5 rounded-full transition ${
              p.id === activePage.id ? 'bg-cyan-400' : 'bg-slate-700 hover:bg-slate-500'
            }`}
          />
        ))}
      </footer>
    </div>
  )
}

export default BoardLabPage
