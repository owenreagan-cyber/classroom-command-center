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
} from './types'

interface DisplayComposerStoreState {
  screens: Record<string, DisplayScreen>
  order: string[]
  activeScreenId: string | null
}

interface DisplayComposerStoreActions {
  updateScreen: (id: string, patch: Partial<Omit<DisplayScreen, 'id'>>) => void
  duplicateScreen: (id: string) => string | undefined
  resetScreenToDefault: (id: string) => void
  createCustomScreen: (title: string) => string
  sendToDisplay: (id: string) => void
  clearDisplay: () => void
}

type DisplayComposerStore = DisplayComposerStoreState & DisplayComposerStoreActions

export const useDisplayComposerStore = create<DisplayComposerStore>()(
  persist(
    (set, get) => ({
      ...buildSeededScreensState(),
      activeScreenId: null,

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

      clearDisplay: () => set({ activeScreenId: null }),
    }),
    {
      name: DISPLAY_COMPOSER_STORAGE_KEY,
      version: DISPLAY_COMPOSER_STORAGE_VERSION,
      partialize: (state) => ({
        screens: state.screens,
        order: state.order,
        activeScreenId: state.activeScreenId,
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
