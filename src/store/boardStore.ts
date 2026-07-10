import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_BACKGROUND_ID,
  DEFAULT_CONTENTS,
  DEFAULT_MODE,
  DEFAULT_SCREEN_ID,
} from '../data/defaults'
import { getBackgroundForScreen } from '../data/backgroundAssets'
import type {
  AppMode,
  BackgroundAssetId,
  BoardState,
  ScreenContents,
  ScreenId,
} from '../data/types'
import {
  beautifyBulletList,
  beautifyMaterialsLists,
  beautifySingleInstruction,
  beautifyTitle,
} from '../lib/beautify'
import { useTimerStore } from './timerStore'

interface BoardStore extends BoardState {
  /** Session-only snapshot taken before the latest Beautify. */
  beautifyUndo: ScreenContents | null
  setMode: (mode: AppMode) => void
  setActiveScreen: (screen: ScreenId) => void
  setBackgroundId: (backgroundId: BackgroundAssetId) => void
  updateContents: (contents: ScreenContents) => void
  beautifyActiveScreen: () => void
  undoBeautify: () => void
  resetToDefaults: () => void
}

const initialState: BoardState = {
  mode: DEFAULT_MODE,
  activeScreen: DEFAULT_SCREEN_ID,
  backgroundId: DEFAULT_BACKGROUND_ID,
  contents: structuredClone(DEFAULT_CONTENTS),
}

/**
 * Card-type-preserving, conservative beautify.
 * Cleans formatting without aggressive rewrite or phrase splitting.
 */
function beautifyScreenContents(
  screenId: ScreenId,
  contents: ScreenContents,
): ScreenContents {
  const next = structuredClone(contents)

  switch (screenId) {
    case 'homeroom': {
      next.homeroom.remindersTitle = beautifyTitle(next.homeroom.remindersTitle)
      next.homeroom.reminders = beautifyBulletList(next.homeroom.reminders)
      next.homeroom.doNowTitle = beautifyTitle(next.homeroom.doNowTitle)
      next.homeroom.doNow = beautifySingleInstruction(next.homeroom.doNow)
      next.homeroom.materialsTitle = beautifyTitle(next.homeroom.materialsTitle)
      next.homeroom.materials = beautifyMaterialsLists(next.homeroom.materials)
      next.homeroom.readyPosition.title = beautifyTitle(
        next.homeroom.readyPosition.title,
      )
      next.homeroom.readyPosition.steps = beautifyBulletList(
        next.homeroom.readyPosition.steps,
      )
      next.homeroom.readyPosition.compactLine = beautifySingleInstruction(
        next.homeroom.readyPosition.compactLine,
      )
      break
    }
    case 'math': {
      next.math.lessonTitle = beautifySingleInstruction(next.math.lessonTitle)
      next.math.materialsTitle = beautifyTitle(next.math.materialsTitle)
      next.math.materials = beautifyMaterialsLists(next.math.materials)
      break
    }
    case 'reading': {
      next.reading.lessonTitle = beautifySingleInstruction(next.reading.lessonTitle)
      next.reading.materialsTitle = beautifyTitle(next.reading.materialsTitle)
      next.reading.materials = beautifyMaterialsLists(next.reading.materials)
      next.reading.readyPosition.title = beautifyTitle(
        next.reading.readyPosition.title,
      )
      next.reading.readyPosition.steps = beautifyBulletList(
        next.reading.readyPosition.steps,
      )
      next.reading.readyPosition.compactLine = beautifySingleInstruction(
        next.reading.readyPosition.compactLine,
      )
      break
    }
    case 'snack-lunch': {
      next['snack-lunch'].cleanupTitle = beautifyTitle(
        next['snack-lunch'].cleanupTitle,
      )
      next['snack-lunch'].cleanupReminders = beautifyBulletList(
        next['snack-lunch'].cleanupReminders,
      )
      next['snack-lunch'].routineTitle = beautifyTitle(
        next['snack-lunch'].routineTitle,
      )
      next['snack-lunch'].routine = beautifyBulletList(next['snack-lunch'].routine)
      break
    }
    case 'ready-position': {
      next['ready-position'].title = beautifyTitle(next['ready-position'].title)
      next['ready-position'].steps = beautifyBulletList(
        next['ready-position'].steps,
      )
      next['ready-position'].compactLine = beautifySingleInstruction(
        next['ready-position'].compactLine,
      )
      break
    }
  }

  return next
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      beautifyUndo: null,
      setMode: (mode) => set({ mode }),
      setActiveScreen: (activeScreen) => {
        const matched = getBackgroundForScreen(activeScreen)
        set({
          activeScreen,
          backgroundId: matched.id,
        })
      },
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      updateContents: (contents) => set({ contents, beautifyUndo: null }),
      beautifyActiveScreen: () => {
        const { activeScreen, contents } = get()
        set({
          beautifyUndo: structuredClone(contents),
          contents: beautifyScreenContents(activeScreen, contents),
        })
      },
      undoBeautify: () => {
        const { beautifyUndo } = get()
        if (!beautifyUndo) return
        set({
          contents: structuredClone(beautifyUndo),
          beautifyUndo: null,
        })
      },
      resetToDefaults: () => {
        useTimerStore.getState().resetAllTimers()
        set({
          mode: DEFAULT_MODE,
          activeScreen: DEFAULT_SCREEN_ID,
          backgroundId: DEFAULT_BACKGROUND_ID,
          contents: structuredClone(DEFAULT_CONTENTS),
          beautifyUndo: null,
        })
      },
    }),
    {
      name: 'classroom-command-center-lite',
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<BoardState> & {
          themeId?: string
        }
        // v3: recover from aggressive Beautify regressions by restoring defaults
        // when migrating from older persisted shapes.
        const contents =
          version < 3
            ? structuredClone(DEFAULT_CONTENTS)
            : (state.contents ?? structuredClone(DEFAULT_CONTENTS))

        return {
          mode: state.mode ?? DEFAULT_MODE,
          activeScreen: state.activeScreen ?? DEFAULT_SCREEN_ID,
          backgroundId: state.backgroundId ?? DEFAULT_BACKGROUND_ID,
          contents,
        }
      },
      partialize: (state) => ({
        mode: state.mode,
        activeScreen: state.activeScreen,
        backgroundId: state.backgroundId,
        contents: state.contents,
      }),
    },
  ),
)
