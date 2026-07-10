import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyBoardPresetToContents } from '../data/boardPresets'
import {
  applyCustomPresetToContents,
  makeCustomPreset,
} from '../data/customPresets'
import {
  DEFAULT_BACKGROUND_ID,
  DEFAULT_CARD_VISIBILITY,
  DEFAULT_CONTENTS,
  DEFAULT_MODE,
  DEFAULT_NOISE_TRACKERS,
  DEFAULT_SCREEN_ID,
  DEFAULT_TEACHER_NOTES,
} from '../data/defaults'
import { getBackgroundForScreen } from '../data/backgroundAssets'
import type {
  AppMode,
  BackgroundAssetId,
  BoardExportPayload,
  BoardPresetId,
  BoardState,
  CardId,
  NoiseTrackerId,
  ScreenCardVisibility,
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
  applyBoardPreset: (presetId: BoardPresetId) => void
  saveCustomPreset: (label: string) => void
  applyCustomPreset: (presetId: string) => void
  deleteCustomPreset: (presetId: string) => void
  importBoardState: (payload: BoardExportPayload) => void
  setNoiseVoiceLevel: (trackerId: NoiseTrackerId, voiceLevel: BoardState['noiseTrackers'][NoiseTrackerId]['voiceLevel']) => void
  addNoisyPoint: (trackerId: NoiseTrackerId) => void
  adjustNoiseLapMinutes: (trackerId: NoiseTrackerId, delta: number) => void
  setNoiseMeterLevel: (trackerId: NoiseTrackerId, meterLevel: number) => void
  resetNoiseLapMinutes: (trackerId: NoiseTrackerId) => void
  setCardVisible: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  beautifyActiveScreen: () => void
  undoBeautify: () => void
  resetToDefaults: () => void
}

const initialState: BoardState = {
  mode: DEFAULT_MODE,
  activeScreen: DEFAULT_SCREEN_ID,
  backgroundId: DEFAULT_BACKGROUND_ID,
  contents: structuredClone(DEFAULT_CONTENTS),
  teacherNotes: structuredClone(DEFAULT_TEACHER_NOTES),
  cardVisibility: structuredClone(DEFAULT_CARD_VISIBILITY),
  customPresets: [],
  noiseTrackers: structuredClone(DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
}

/**
 * Card-type-preserving, conservative beautify.
 * Cleans formatting without aggressive rewrite or phrase splitting.
 */
function mergeCardVisibility(
  persisted: ScreenCardVisibility | undefined,
): ScreenCardVisibility {
  const next = structuredClone(DEFAULT_CARD_VISIBILITY)

  if (!persisted) {
    return next
  }

  for (const [screenId, cards] of Object.entries(persisted)) {
    if (!cards) continue
    next[screenId as ScreenId] = {
      ...(next[screenId as ScreenId] ?? {}),
      ...cards,
    }
  }

  return next
}

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
      applyBoardPreset: (presetId) =>
        set((state) => ({
          contents: applyBoardPresetToContents(state.contents, presetId),
          beautifyUndo: null,
        })),
      saveCustomPreset: (label) =>
        set((state) => ({
          customPresets: [
            makeCustomPreset(state.contents, state.activeScreen, label),
            ...state.customPresets,
          ],
        })),
      applyCustomPreset: (presetId) =>
        set((state) => {
          const preset = state.customPresets.find((item) => item.id === presetId)
          if (!preset) return state

          return {
            activeScreen: preset.screenId,
            backgroundId: getBackgroundForScreen(preset.screenId).id,
            contents: applyCustomPresetToContents(state.contents, preset),
            beautifyUndo: null,
          }
        }),
      deleteCustomPreset: (presetId) =>
        set((state) => ({
          customPresets: state.customPresets.filter(
            (preset) => preset.id !== presetId,
          ),
        })),
      importBoardState: (payload) => {
        const imported = payload.state

        set({
          mode: imported.mode,
          activeScreen: imported.activeScreen,
          backgroundId: imported.backgroundId,
          contents: structuredClone(imported.contents),
          teacherNotes: structuredClone(imported.teacherNotes),
          cardVisibility: mergeCardVisibility(imported.cardVisibility),
          customPresets: structuredClone(imported.customPresets ?? []),
          noiseTrackers:
            structuredClone(imported.noiseTrackers ?? DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
          beautifyUndo: null,
        })
      },
      setNoiseVoiceLevel: (trackerId, voiceLevel) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: {
              ...state.noiseTrackers[trackerId],
              voiceLevel,
              isPaused: voiceLevel === 'off',
            },
          },
        })),
      addNoisyPoint: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: {
              ...state.noiseTrackers[trackerId],
              noisyPoints: state.noiseTrackers[trackerId].noisyPoints + 1,
              lapMinutes: state.noiseTrackers[trackerId].lapMinutes + 2,
              meterLevel: 100,
            },
          },
        })),
      adjustNoiseLapMinutes: (trackerId, delta) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: {
              ...state.noiseTrackers[trackerId],
              lapMinutes: Math.max(
                0,
                state.noiseTrackers[trackerId].lapMinutes + delta,
              ),
            },
          },
        })),
      setNoiseMeterLevel: (trackerId, meterLevel) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: {
              ...state.noiseTrackers[trackerId],
              meterLevel: Math.max(0, Math.min(100, meterLevel)),
            },
          },
        })),
      resetNoiseLapMinutes: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: {
              ...state.noiseTrackers[trackerId],
              lapMinutes: 0,
            },
          },
        })),
      setCardVisible: (screenId, cardId, visible) =>
        set((state) => ({
          cardVisibility: {
            ...state.cardVisibility,
            [screenId]: {
              ...(state.cardVisibility[screenId] ?? {}),
              [cardId]: visible,
            },
          },
        })),
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
          teacherNotes: structuredClone(DEFAULT_TEACHER_NOTES),
          cardVisibility: structuredClone(DEFAULT_CARD_VISIBILITY),
          customPresets: [],
          noiseTrackers: structuredClone(DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
          beautifyUndo: null,
        })
      },
    }),
    {
      name: 'classroom-command-center-lite',
      version: 5,
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

        const teacherNotes =
          version < 4
            ? structuredClone(DEFAULT_TEACHER_NOTES)
            : (state.teacherNotes ?? structuredClone(DEFAULT_TEACHER_NOTES))

        const cardVisibility = mergeCardVisibility(
          version < 5 ? undefined : state.cardVisibility,
        )

        return {
          mode: state.mode ?? DEFAULT_MODE,
          activeScreen: state.activeScreen ?? DEFAULT_SCREEN_ID,
          backgroundId: state.backgroundId ?? DEFAULT_BACKGROUND_ID,
          contents,
          teacherNotes,
          cardVisibility,
          customPresets: state.customPresets ?? [],
          noiseTrackers:
            structuredClone(state.noiseTrackers ?? DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
        }
      },
      partialize: (state) => ({
        mode: state.mode,
        activeScreen: state.activeScreen,
        backgroundId: state.backgroundId,
        contents: state.contents,
        teacherNotes: state.teacherNotes,
        cardVisibility: state.cardVisibility,
        customPresets: state.customPresets,
        noiseTrackers: state.noiseTrackers,
      }),
    },
  ),
)
