import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyScreenPatch,
  buildCustomScreen,
  buildSeededScreensState,
  duplicateScreenData,
  resetScreenToDefault,
} from './displayComposerLogic'
import {
  DISPLAY_COMPOSER_STORAGE_KEY,
  DISPLAY_COMPOSER_STORAGE_VERSION,
  type DisplayScreen,
  type CanvasWidget,
  WIDGET_SIZE_PRESETS,
  type WidgetSizePreset,
  type CanvasWidgetType,
} from './types'

interface DisplayComposerStoreState {
  screens: Record<string, DisplayScreen>
  order: string[]
  activeScreenId: string | null
  /** When true, /display shows a blank black screen instead of any content. */
  displayBlanked: boolean
  /** Saved screen id to restore after unblanking. */
  _previousScreenId: string | null
}

interface DisplayComposerStoreActions {
  updateScreen: (id: string, patch: Partial<Omit<DisplayScreen, 'id'>>) => void
  duplicateScreen: (id: string) => string | undefined
  resetScreenToDefault: (id: string) => void
  createCustomScreen: (title: string) => string
  sendToDisplay: (id: string) => void
  clearDisplay: () => void
  /** Blank the display (black screen), saving current screen for restore. */
  blankDisplay: () => void
  /** Restore the display to the screen that was showing before blanking. */
  unblankDisplay: () => void
  addWidget: (screenId: string, widgetType: CanvasWidgetType, label: string, sizePreset: WidgetSizePreset) => string | undefined
  removeWidget: (screenId: string, widgetId: string) => void
  updateWidget: (screenId: string, widgetId: string, patch: Partial<CanvasWidget>) => void
  duplicateWidget: (screenId: string, widgetId: string) => string | undefined
  toggleWidgetVisibility: (screenId: string, widgetId: string) => void
  toggleWidgetLock: (screenId: string, widgetId: string) => void
  moveWidget: (screenId: string, widgetId: string, x: number, y: number) => void
  resizeWidget: (screenId: string, widgetId: string, preset: WidgetSizePreset) => void
  bringWidgetForward: (screenId: string, widgetId: string) => void
  sendWidgetBackward: (screenId: string, widgetId: string) => void
}

type DisplayComposerStore = DisplayComposerStoreState & DisplayComposerStoreActions

export const useDisplayComposerStore = create<DisplayComposerStore>()(
  persist(
    (set, get) => ({
      ...buildSeededScreensState(),
      activeScreenId: null,
      displayBlanked: false,
      _previousScreenId: null,

      updateScreen: (id, patch) => {
        const screen = get().screens[id]
        if (!screen) return
        set((state) => ({
          screens: {
            ...state.screens,
            [id]: applyScreenPatch(screen, patch, Date.now()),
          },
        }))
      },

      duplicateScreen: (id) => {
        const { screens, order } = get()
        const source = screens[id]
        if (!source) return undefined
        const copy = duplicateScreenData(source, screens, Date.now())
        set({
          screens: { ...screens, [copy.id]: copy },
          order: [...order, copy.id],
        })
        return copy.id
      },

      resetScreenToDefault: (id) => {
        const reset = resetScreenToDefault(id, Date.now())
        if (!reset) return
        set((state) => ({ screens: { ...state.screens, [id]: reset } }))
      },

      createCustomScreen: (title) => {
        const { screens, order } = get()
        const screen = buildCustomScreen(title, screens, Date.now())
        set({
          screens: { ...screens, [screen.id]: screen },
          order: [...order, screen.id],
        })
        return screen.id
      },

      sendToDisplay: (id) => {
        if (!get().screens[id]) return
        set({ activeScreenId: id })
      },

      clearDisplay: () => set({ activeScreenId: null, displayBlanked: false }),

      blankDisplay: () => {
        const { activeScreenId, _previousScreenId } = get()
        set({
          displayBlanked: true,
          _previousScreenId: activeScreenId ?? _previousScreenId,
          activeScreenId: null,
        })
      },

      unblankDisplay: () => {
        const { _previousScreenId } = get()
        const restoreId = _previousScreenId && get().screens[_previousScreenId] ? _previousScreenId : null
        set({
          displayBlanked: false,
          activeScreenId: restoreId,
          _previousScreenId: null,
        })
      },

      addWidget: (screenId, widgetType, label, sizePreset) => {
        const screen = get().screens[screenId]
        if (!screen) return undefined
        const size = WIDGET_SIZE_PRESETS[sizePreset]
        const widgets = [...(screen.widgets ?? [])]
        const maxZ = widgets.reduce((max, w) => Math.max(max, w.zIndex), 0)
        const id = `${widgetType}-${Date.now()}`
        const widget: CanvasWidget = {
          id,
          type: widgetType,
          label,
          x: Math.max(0, 50 - size.w / 2),
          y: Math.max(0, 50 - size.h / 2),
          w: size.w,
          h: size.h,
          visible: true,
          locked: false,
          settings: {},
          zIndex: maxZ + 1,
        }
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets: [...widgets, widget] }, Date.now()),
          },
        }))
        return id
      },

      removeWidget: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const widgets = (screen.widgets ?? []).filter((w) => w.id !== widgetId)
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      updateWidget: (screenId, widgetId, patch) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const widgets = (screen.widgets ?? []).map((w) =>
          w.id === widgetId ? { ...w, ...patch } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      duplicateWidget: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return undefined
        const src = (screen.widgets ?? []).find((w) => w.id === widgetId)
        if (!src) return undefined
        const newId = `${src.type}-${Date.now()}`
        const clone: CanvasWidget = {
          ...structuredClone(src),
          id: newId,
          label: `${src.label} (copy)`,
          x: Math.min(90, src.x + 5),
          y: Math.min(90, src.y + 5),
        }
        const widgets = [...(screen.widgets ?? []), clone]
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
        return newId
      },

      toggleWidgetVisibility: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const widgets = (screen.widgets ?? []).map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      toggleWidgetLock: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const widgets = (screen.widgets ?? []).map((w) =>
          w.id === widgetId ? { ...w, locked: !w.locked } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      moveWidget: (screenId, widgetId, x, y) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const widgets = (screen.widgets ?? []).map((w) =>
          w.id === widgetId ? { ...w, x, y } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      resizeWidget: (screenId, widgetId, preset) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const size = WIDGET_SIZE_PRESETS[preset]
        const widgets = (screen.widgets ?? []).map((w) =>
          w.id === widgetId ? { ...w, w: size.w, h: size.h } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      bringWidgetForward: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const existing = screen.widgets ?? []
        const maxZ = existing.reduce((max, w) => Math.max(max, w.zIndex), 0)
        const widgets = existing.map((w) =>
          w.id === widgetId ? { ...w, zIndex: maxZ + 1 } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },

      sendWidgetBackward: (screenId, widgetId) => {
        const screen = get().screens[screenId]
        if (!screen) return
        const existing = screen.widgets ?? []
        const minZ = existing.reduce((min, w) => Math.min(min, w.zIndex), Infinity)
        const widgets = existing.map((w) =>
          w.id === widgetId ? { ...w, zIndex: Math.max(0, minZ - 1) } : w,
        )
        set((state) => ({
          screens: {
            ...state.screens,
            [screenId]: applyScreenPatch(screen, { widgets }, Date.now()),
          },
        }))
      },
    }),
    {
      name: DISPLAY_COMPOSER_STORAGE_KEY,
      version: DISPLAY_COMPOSER_STORAGE_VERSION,
      partialize: (state) => ({
        screens: state.screens,
        order: state.order,
        activeScreenId: state.activeScreenId,
        displayBlanked: state.displayBlanked,
        _previousScreenId: state._previousScreenId,
      }),
    },
  ),
)

/**
 * Live cross-tab sync: /control and /display are separate browser tabs sharing
 * only localStorage. Zustand's persist middleware only rehydrates on load, so
 * without this, an already-open /display tab would not see "Send to Display"
 * or live edits until reload. Mirrors the existing pattern in
 * src/features/prize-board/pressYourLuck/pressYourLuckStore.ts.
 */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== DISPLAY_COMPOSER_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<DisplayComposerStoreState> }
      const restored = parsed.state ?? parsed
      useDisplayComposerStore.setState(restored as Partial<DisplayComposerStoreState>)
    } catch {
      // ignore malformed storage
    }
  })
}
