import { useState } from 'react'
import type { BoardPage, BoardScene, BoardState, SavedLayout, SceneType } from './types'
import {
  deleteLayout,
  deleteScene,
  layoutFromPage,
  loadPersistedBoardState,
  persistBoardState,
  renameLayout,
  saveLayout,
  saveScene,
  setActiveLayout,
  setActiveScene,
} from './storage/boardStorage'
import { BOARD_SCHEMA_VERSION, createEmptyBoardState } from './storage/boardSerialization'

/**
 * DB-4A — teacher-only "Saved Boards" panel (edit mode only).
 *
 * Saves/loads named layouts and classroom scenes to local storage. Compact by
 * design — this is a small library, not a dashboard. Never rendered in present
 * mode; the parent gates it behind edit mode.
 */

const btn =
  'rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
const inputCls =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'

const SCENE_TYPES: SceneType[] = ['arrival', 'math', 'reading', 'transition', 'packUp', 'custom']

export function SavedBoardsPanel({
  activePage,
  onLoadLayout,
}: {
  activePage: BoardPage
  onLoadLayout: (layout: SavedLayout) => void
}) {
  const [state, setState] = useState<BoardState>(
    () => loadPersistedBoardState() ?? createEmptyBoardState(),
  )
  const [name, setName] = useState('')
  const [sceneType, setSceneType] = useState<SceneType>('arrival')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const commit = (next: BoardState) => {
    setState(next)
    persistBoardState(next)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    commit(saveLayout(state, layoutFromPage(activePage, trimmed)))
    setName('')
  }

  const handleSaveScene = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const layout = layoutFromPage(activePage, trimmed)
    const now = Date.now()
    const scene: BoardScene = {
      schemaVersion: BOARD_SCHEMA_VERSION,
      id: `scene-${now}`,
      name: trimmed,
      kind: 'scene',
      type: sceneType,
      layoutId: layout.id,
      displayMode: 'default',
      ...(activePage.background.type === 'preset'
        ? { backgroundPresetId: activePage.background.presetId }
        : {}),
      keepAwake: false,
      studentSafe: true,
      createdAt: now,
      updatedAt: now,
    }
    let next = saveLayout(state, layout)
    next = saveScene(next, scene)
    next = setActiveScene(setActiveLayout(next, layout.id), scene.id)
    commit(next)
    setName('')
  }

  const handleLoad = (layout: SavedLayout) => {
    commit(setActiveLayout(setActiveScene(state, null), layout.id))
    onLoadLayout(layout)
  }

  const handleLoadScene = (scene: BoardScene) => {
    const layout = state.layouts.find((l) => l.id === scene.layoutId)
    if (!layout) return
    commit(setActiveScene(setActiveLayout(state, layout.id), scene.id))
    onLoadLayout(layout)
  }

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    commit(renameLayout(state, id, renameValue))
    setRenameId(null)
    setRenameValue('')
  }

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-3"
      data-saved-boards-panel
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
          Saved Boards
        </h2>
      </div>

      <div className="space-y-2">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
          placeholder="Name this board…"
          data-saved-boards-name-input
        />
        <div className="flex gap-1.5">
          <button type="button" className={btn} onClick={handleSave} disabled={!name.trim()} data-save-layout-button>
            Save Current
          </button>
          <select
            value={sceneType}
            onChange={(e) => setSceneType(e.target.value as SceneType)}
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900/60 px-1.5 py-1 text-xs text-slate-200"
            data-scene-type-select
          >
            {SCENE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className={btn} onClick={handleSaveScene} disabled={!name.trim()} data-save-scene-button>
            Scene
          </button>
        </div>
      </div>

      {state.layouts.length === 0 && state.scenes.length === 0 ? (
        <p className="m-0 text-xs text-slate-500" data-no-saved-boards>
          No saved boards yet. Name and save the current board to reuse it later.
        </p>
      ) : (
        <div className="space-y-3">
          {state.layouts.length > 0 && (
            <div className="space-y-1">
              <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Layouts
              </h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {state.layouts.map((l) => (
                  <li key={l.id} className="rounded-md border border-slate-800 bg-slate-900/40 p-1.5" data-saved-layout={l.id}>
                    {renameId === l.id ? (
                      <div className="flex gap-1">
                        <input
                          className={inputCls}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(l.id)
                          }}
                          autoFocus
                        />
                        <button type="button" className={btn} onClick={() => handleRename(l.id)}>
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800"
                          onClick={() => handleLoad(l)}
                          title={`Load "${l.name}"`}
                        >
                          {l.name}
                        </button>
                        <button
                          type="button"
                          className={btn}
                          onClick={() => {
                            setRenameId(l.id)
                            setRenameValue(l.name)
                          }}
                          title="Rename"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className={btn}
                          onClick={() => commit(deleteLayout(state, l.id))}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.scenes.length > 0 && (
            <div className="space-y-1">
              <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Scenes
              </h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {state.scenes.map((s) => (
                  <li key={s.id} className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/40 p-1.5" data-saved-scene={s.id}>
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800"
                      onClick={() => handleLoadScene(s)}
                      title={`Load "${s.name}"`}
                    >
                      {s.name}
                      <span className="ml-1.5 text-[10px] font-normal uppercase text-slate-500">{s.type}</span>
                    </button>
                    <button
                      type="button"
                      className={btn}
                      onClick={() => commit(deleteScene(state, s.id))}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
