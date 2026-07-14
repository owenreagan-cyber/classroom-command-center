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
import { getBackgroundForScreen, normalizeBackgroundId } from '../data/backgroundAssets'
import { buildClassWorkspaces } from '../data/pageSequences'
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
  TeacherNote,
  VibePageId,
} from '../data/types'
import {
  applyNoisyPointToTracker,
  applyRepairTickToTracker,
  normalizeNoiseTrackerMap,
  resetNoiseTrackerState,
} from '../lib/noiseTowers'
import {
  beautifyBulletList,
  beautifyMaterialsLists,
  beautifySingleInstruction,
  beautifyTitle,
} from '../lib/beautify'
import { useTimerStore } from './timerStore'
import {
  moveWidget,
  redoCanvasHistory,
  resetActivePageLayout as resetActivePageLayoutPure,
  setWidgetGeometry,
  setWidgetLocked,
  undoCanvasHistory,
  pushHistory,
  type CanvasHistoryEntry,
} from '../lib/studioCanvasActions'
import { normalizeClassWorkspacesGeometry } from '../lib/studioCanvasMigration'
import type { ArrowKey } from '../lib/studioCanvasGeometry'

interface BoardStore extends BoardState {
  /** Session-only snapshot taken before the latest Beautify. */
  beautifyUndo: ScreenContents | null
  /** Session-only Studio Canvas layout history — never persisted. */
  canvasHistoryPast: CanvasHistoryEntry[]
  canvasHistoryFuture: CanvasHistoryEntry[]
  /** Session-only snap-to-grid preference for the Studio Canvas toolbar. */
  studioSnapEnabled: boolean
  setStudioSnapEnabled: (enabled: boolean) => void
  updatePageWidgetGeometry: (
    classId: ScreenId,
    pageId: VibePageId,
    widgetId: string,
    geometry: { x: number; y: number; width?: number; height?: number; snap?: boolean },
  ) => void
  movePageWidget: (
    classId: ScreenId,
    pageId: VibePageId,
    widgetId: string,
    key: ArrowKey,
    shiftKey: boolean,
  ) => void
  setPageWidgetLocked: (classId: ScreenId, pageId: VibePageId, widgetId: string, locked: boolean) => void
  resetActivePageLayout: (classId: ScreenId, pageId: VibePageId) => void
  undoCanvasLayout: () => void
  redoCanvasLayout: () => void
  setMode: (mode: AppMode) => void
  setActiveScreen: (screen: ScreenId) => void
  setActivePageId: (pageId: VibePageId) => void
  navigateToPreviousPage: () => void
  navigateToNextPage: () => void
  setBackgroundId: (backgroundId: BackgroundAssetId) => void
  updateContents: (contents: ScreenContents) => void
  applyBoardPreset: (presetId: BoardPresetId) => void
  saveCustomPreset: (label: string) => void
  applyCustomPreset: (presetId: string) => void
  deleteCustomPreset: (presetId: string) => void
  importBoardState: (payload: BoardExportPayload) => void
  setNoiseVoiceLevel: (trackerId: NoiseTrackerId, voiceLevel: BoardState['noiseTrackers'][NoiseTrackerId]['voiceLevel']) => void
  addNoisyPoint: (trackerId: NoiseTrackerId) => void
  repairNoiseTick: (trackerId: NoiseTrackerId) => void
  adjustNoiseLapMinutes: (trackerId: NoiseTrackerId, delta: number) => void
  setNoiseMeterLevel: (trackerId: NoiseTrackerId, meterLevel: number) => void
  resetNoiseLapMinutes: (trackerId: NoiseTrackerId) => void
  resetNoiseTracker: (trackerId: NoiseTrackerId) => void
  setCardVisible: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  beautifyActiveScreen: () => void
  undoBeautify: () => void
  resetToDefaults: () => void
}

const defaultWorkspaces = buildClassWorkspaces()

const initialState: BoardState = {
  mode: DEFAULT_MODE,
  activeScreen: DEFAULT_SCREEN_ID,
  activePageId: defaultWorkspaces[DEFAULT_SCREEN_ID]?.activePageId ?? null,
  classWorkspaces: defaultWorkspaces,
  backgroundId: DEFAULT_BACKGROUND_ID,
  contents: structuredClone(DEFAULT_CONTENTS),
  teacherNotes: structuredClone(DEFAULT_TEACHER_NOTES),
  cardVisibility: structuredClone(DEFAULT_CARD_VISIBILITY),
  customPresets: [],
  noiseTrackers: structuredClone(DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
}

// ── Screen ID normalization with legacy support ────────────────────────

export function normalizeScreenIdForBoard(screenId: string | undefined): ScreenId {
  switch (screenId) {
    case 'homeroom':
    case 'math':
    case 'reading':
    case 'snack':
    case 'lunch':
    case 'recess':
    case 'ready-position':
    case 'writing':
    case 'science':
    case 'social-studies':
    case 'assessment':
    case 'centers':
    case 'homework':
    case 'pack-up':
    case 'spelling':
      return screenId
    case 'snack-lunch':
      // Legacy: snack-lunch -> snack by default (content preserved)
      return 'snack'
    case 'homework-packup':
      // Legacy: homework-packup -> homework by default
      return 'homework'
    case 'intervention':
    case 'flexible-groups':
      return 'centers'
    default:
      return DEFAULT_SCREEN_ID
  }
}

function normalizeBoardContents(contents: ScreenContents | undefined): ScreenContents {
  if (!contents) {
    return structuredClone(DEFAULT_CONTENTS)
  }

  const next = structuredClone(DEFAULT_CONTENTS)
  const raw = contents as unknown as Record<string, unknown>

  // Helper to try reading a field from contents raw
  function readField<K extends keyof ScreenContents>(key: K, legacyKey?: string): ScreenContents[K] {
    const val = raw[key as string] ?? (legacyKey ? raw[legacyKey] : undefined)
    return val !== undefined ? structuredClone(val as ScreenContents[K]) : structuredClone(DEFAULT_CONTENTS[key])
  }

  next.homeroom = readField('homeroom')
  next.math = readField('math')
  next.reading = readField('reading')
  next.writing = readField('writing')
  next.science = readField('science')
  next['social-studies'] = readField('social-studies')
  next.assessment = readField('assessment')
  next.centers = readField('centers') ?? readField('centers', 'flexible-groups') ?? readField('centers', 'intervention')
  next.recess = readField('recess')
  next['ready-position'] = readField('ready-position')
  next.snack = readField('snack', 'snack-lunch')
  next.lunch = readField('lunch')
  next.homework = readField('homework', 'homework-packup')
  next['pack-up'] = readField('pack-up')
  next.spelling = readField('spelling')

  return next
}

function normalizeTeacherNotes(notes: TeacherNote[] | undefined): TeacherNote[] {
  if (!notes) return structuredClone(DEFAULT_TEACHER_NOTES)
  return notes.map((note) => ({
    ...note,
    screenId: note.screenId ? normalizeScreenIdForBoard(note.screenId) : note.screenId,
  }))
}

function normalizeCustomPresets(presets: BoardState['customPresets'] | undefined) {
  if (!presets) return []
  return presets.map((preset) => ({
    ...preset,
    screenId: normalizeScreenIdForBoard(preset.screenId),
  }))
}

function mergeCardVisibility(
  persisted: ScreenCardVisibility | undefined,
): ScreenCardVisibility {
  const next = structuredClone(DEFAULT_CARD_VISIBILITY)
  if (!persisted) return next

  for (const [screenId, cards] of Object.entries(persisted)) {
    if (!cards) continue
    const resolvedScreenId = normalizeScreenIdForBoard(screenId)
    next[resolvedScreenId] = {
      ...(next[resolvedScreenId] ?? {}),
      ...cards,
    }
  }

  // Ensure legacy snack-lunch card visibility maps to snack (lunch gets default)
  const legacyPersisted = persisted as Record<string, Partial<Record<string, boolean>> | undefined>
  if (legacyPersisted['snack-lunch']) {
    next.snack = { ...next.snack, ...legacyPersisted['snack-lunch'] as Record<string, boolean> }
  }
  if (legacyPersisted['homework-packup']) {
    next.homework = { ...next.homework, ...legacyPersisted['homework-packup'] as Record<string, boolean> }
  }

  return next
}

// ── Beautify ───────────────────────────────────────────────────────────

function beautifyScreenContents(
  screenId: ScreenId,
  contents: ScreenContents,
): ScreenContents {
  const next = structuredClone(contents)

  const beautifySubject = (subj: ScreenContents['writing' | 'science' | 'social-studies' | 'assessment' | 'centers' | 'homework' | 'pack-up' | 'spelling']) => {
    subj.focusTitle = beautifyTitle(subj.focusTitle)
    subj.focusTask = beautifySingleInstruction(subj.focusTask)
    subj.agendaTitle = beautifyTitle(subj.agendaTitle)
    subj.agenda = beautifyBulletList(subj.agenda)
    subj.materialsTitle = beautifyTitle(subj.materialsTitle)
    subj.materials = beautifyMaterialsLists(subj.materials)
    if (subj.lesson) {
      subj.lesson.title = beautifyTitle(subj.lesson.title)
      subj.lesson.objective = beautifySingleInstruction(subj.lesson.objective)
      subj.lesson.successCriteria = beautifyBulletList(subj.lesson.successCriteria)
      if (subj.lesson.reminder) subj.lesson.reminder = beautifySingleInstruction(subj.lesson.reminder)
    }
    if (subj.vocabulary) subj.vocabulary.title = beautifyTitle(subj.vocabulary.title)
  }

  switch (screenId) {
    case 'homeroom': {
      next.homeroom.remindersTitle = beautifyTitle(next.homeroom.remindersTitle)
      next.homeroom.reminders = beautifyBulletList(next.homeroom.reminders)
      next.homeroom.doNowTitle = beautifyTitle(next.homeroom.doNowTitle)
      next.homeroom.doNow = beautifySingleInstruction(next.homeroom.doNow)
      next.homeroom.materialsTitle = beautifyTitle(next.homeroom.materialsTitle)
      next.homeroom.materials = beautifyMaterialsLists(next.homeroom.materials)
      next.homeroom.readyPosition.title = beautifyTitle(next.homeroom.readyPosition.title)
      next.homeroom.readyPosition.steps = beautifyBulletList(next.homeroom.readyPosition.steps)
      next.homeroom.readyPosition.compactLine = beautifySingleInstruction(next.homeroom.readyPosition.compactLine)
      break
    }
    case 'math': {
      next.math.lessonTitle = beautifySingleInstruction(next.math.lessonTitle)
      next.math.materialsTitle = beautifyTitle(next.math.materialsTitle)
      next.math.materials = beautifyMaterialsLists(next.math.materials)
      if (next.math.lesson) {
        next.math.lesson.title = beautifyTitle(next.math.lesson.title)
        next.math.lesson.objective = beautifySingleInstruction(next.math.lesson.objective)
        next.math.lesson.successCriteria = beautifyBulletList(next.math.lesson.successCriteria)
        if (next.math.lesson.reminder) next.math.lesson.reminder = beautifySingleInstruction(next.math.lesson.reminder)
      }
      if (next.math.vocabulary) next.math.vocabulary.title = beautifyTitle(next.math.vocabulary.title)
      break
    }
    case 'reading': {
      next.reading.lessonTitle = beautifySingleInstruction(next.reading.lessonTitle)
      next.reading.materialsTitle = beautifyTitle(next.reading.materialsTitle)
      next.reading.materials = beautifyMaterialsLists(next.reading.materials)
      next.reading.readyPosition.title = beautifyTitle(next.reading.readyPosition.title)
      next.reading.readyPosition.steps = beautifyBulletList(next.reading.readyPosition.steps)
      next.reading.readyPosition.compactLine = beautifySingleInstruction(next.reading.readyPosition.compactLine)
      if (next.reading.lesson) {
        next.reading.lesson.title = beautifyTitle(next.reading.lesson.title)
        next.reading.lesson.objective = beautifySingleInstruction(next.reading.lesson.objective)
        next.reading.lesson.successCriteria = beautifyBulletList(next.reading.lesson.successCriteria)
        if (next.reading.lesson.reminder) next.reading.lesson.reminder = beautifySingleInstruction(next.reading.lesson.reminder)
      }
      if (next.reading.vocabulary) next.reading.vocabulary.title = beautifyTitle(next.reading.vocabulary.title)
      break
    }
    case 'snack': {
      next.snack.cleanupTitle = beautifyTitle(next.snack.cleanupTitle)
      next.snack.cleanupReminders = beautifyBulletList(next.snack.cleanupReminders)
      next.snack.routineTitle = beautifyTitle(next.snack.routineTitle)
      next.snack.routine = beautifyBulletList(next.snack.routine)
      break
    }
    case 'lunch': {
      next.lunch.cleanupTitle = beautifyTitle(next.lunch.cleanupTitle)
      next.lunch.cleanupReminders = beautifyBulletList(next.lunch.cleanupReminders)
      next.lunch.routineTitle = beautifyTitle(next.lunch.routineTitle)
      next.lunch.routine = beautifyBulletList(next.lunch.routine)
      break
    }
    case 'ready-position':
    case 'recess': {
      const rp = screenId === 'ready-position' ? next['ready-position'] : next.recess
      rp.title = beautifyTitle(rp.title)
      rp.steps = beautifyBulletList(rp.steps)
      rp.compactLine = beautifySingleInstruction(rp.compactLine)
      break
    }
    case 'writing':
    case 'science':
    case 'social-studies':
    case 'assessment':
    case 'centers':
    case 'homework':
    case 'pack-up':
    case 'spelling':
      beautifySubject(next[screenId])
      break
  }

  return next
}

// ── Store ──────────────────────────────────────────────────────────────

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      beautifyUndo: null,
      canvasHistoryPast: [],
      canvasHistoryFuture: [],
      studioSnapEnabled: true,
      setStudioSnapEnabled: (enabled) => set({ studioSnapEnabled: enabled }),
      updatePageWidgetGeometry: (classId, pageId, widgetId, geometry) => {
        const { classWorkspaces, canvasHistoryPast } = get()
        const result = setWidgetGeometry(classWorkspaces, classId, pageId, widgetId, geometry)
        if (!result.historyEntry) return
        set({
          classWorkspaces: result.workspaces,
          canvasHistoryPast: pushHistory(canvasHistoryPast, result.historyEntry),
          canvasHistoryFuture: [],
        })
      },
      movePageWidget: (classId, pageId, widgetId, key, shiftKey) => {
        const { classWorkspaces, canvasHistoryPast } = get()
        const result = moveWidget(classWorkspaces, classId, pageId, widgetId, key, shiftKey)
        if (!result.historyEntry) return
        set({
          classWorkspaces: result.workspaces,
          canvasHistoryPast: pushHistory(canvasHistoryPast, result.historyEntry),
          canvasHistoryFuture: [],
        })
      },
      setPageWidgetLocked: (classId, pageId, widgetId, locked) => {
        const { classWorkspaces, canvasHistoryPast } = get()
        const result = setWidgetLocked(classWorkspaces, classId, pageId, widgetId, locked)
        if (!result.historyEntry) return
        set({
          classWorkspaces: result.workspaces,
          canvasHistoryPast: pushHistory(canvasHistoryPast, result.historyEntry),
          canvasHistoryFuture: [],
        })
      },
      resetActivePageLayout: (classId, pageId) => {
        const { classWorkspaces, canvasHistoryPast } = get()
        const result = resetActivePageLayoutPure(classWorkspaces, classId, pageId)
        if (!result.historyEntry) return
        set({
          classWorkspaces: result.workspaces,
          canvasHistoryPast: pushHistory(canvasHistoryPast, result.historyEntry),
          canvasHistoryFuture: [],
        })
      },
      undoCanvasLayout: () => {
        const { classWorkspaces, canvasHistoryPast, canvasHistoryFuture } = get()
        const result = undoCanvasHistory(classWorkspaces, canvasHistoryPast, canvasHistoryFuture)
        set({ classWorkspaces: result.workspaces, canvasHistoryPast: result.past, canvasHistoryFuture: result.future })
      },
      redoCanvasLayout: () => {
        const { classWorkspaces, canvasHistoryPast, canvasHistoryFuture } = get()
        const result = redoCanvasHistory(classWorkspaces, canvasHistoryPast, canvasHistoryFuture)
        set({ classWorkspaces: result.workspaces, canvasHistoryPast: result.past, canvasHistoryFuture: result.future })
      },
      setMode: (mode) => set({ mode }),
      setActiveScreen: (activeScreen) => {
        const normalizedScreen = normalizeScreenIdForBoard(activeScreen)
        const matched = getBackgroundForScreen(normalizedScreen)
        const workspaces = get().classWorkspaces
        const ws = workspaces[normalizedScreen]
        set({
          activeScreen: normalizedScreen,
          backgroundId: matched.id,
          activePageId: ws?.activePageId ?? ws?.pages[0]?.id ?? null,
        })
      },
      setActivePageId: (pageId) => {
        const workspaces = get().classWorkspaces
        for (const [screenId, ws] of Object.entries(workspaces)) {
          if (!ws) continue
          const index = ws.pages.findIndex(p => p.id === pageId)
          if (index >= 0) {
            set({
              activePageId: pageId,
              classWorkspaces: {
                ...workspaces,
                [screenId]: {
                  ...ws,
                  activePageId: pageId,
                  previousPageId: index > 0 ? ws.pages[index - 1].id : null,
                  nextPageId: index < ws.pages.length - 1 ? ws.pages[index + 1].id : null,
                },
              },
            })
            return
          }
        }
      },
      navigateToPreviousPage: () => {
        const { activePageId, classWorkspaces, activeScreen } = get()
        if (!activePageId) return
        const ws = classWorkspaces[activeScreen]
        if (!ws) return
        const currentIndex = ws.pages.findIndex(p => p.id === activePageId)
        if (currentIndex <= 0) return
        const prevPage = ws.pages[currentIndex - 1]
        if (!prevPage) return
        set({
          activePageId: prevPage.id,
          classWorkspaces: {
            ...classWorkspaces,
            [activeScreen]: {
              ...ws,
              activePageId: prevPage.id,
              previousPageId: currentIndex - 2 >= 0 ? ws.pages[currentIndex - 2].id : null,
              nextPageId: ws.pages[currentIndex].id,
            },
          },
        })
      },
      navigateToNextPage: () => {
        const { activePageId, classWorkspaces, activeScreen } = get()
        if (!activePageId) return
        const ws = classWorkspaces[activeScreen]
        if (!ws) return
        const currentIndex = ws.pages.findIndex(p => p.id === activePageId)
        if (currentIndex < 0 || currentIndex >= ws.pages.length - 1) return
        const nextPage = ws.pages[currentIndex + 1]
        if (!nextPage) return
        set({
          activePageId: nextPage.id,
          classWorkspaces: {
            ...classWorkspaces,
            [activeScreen]: {
              ...ws,
              activePageId: nextPage.id,
              previousPageId: ws.pages[currentIndex].id,
              nextPageId: currentIndex + 2 < ws.pages.length ? ws.pages[currentIndex + 2].id : null,
            },
          },
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
          const screenId = normalizeScreenIdForBoard(preset.screenId)
          const normalizedPreset = { ...preset, screenId }
          const ws = state.classWorkspaces[screenId]
          return {
            activeScreen: screenId,
            backgroundId: getBackgroundForScreen(screenId).id,
            activePageId: ws?.activePageId ?? ws?.pages[0]?.id ?? null,
            contents: applyCustomPresetToContents(state.contents, normalizedPreset),
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
        const normalizedScreen = normalizeScreenIdForBoard(imported.activeScreen)
        const workspaces = normalizeClassWorkspacesGeometry(imported.classWorkspaces as never)
        const ws = workspaces[normalizedScreen]
        set({
          mode: imported.mode,
          activeScreen: normalizedScreen,
          activePageId: ws?.activePageId ?? ws?.pages[0]?.id ?? null,
          classWorkspaces: workspaces,
          backgroundId: normalizeBackgroundId(imported.backgroundId),
          contents: normalizeBoardContents(imported.contents),
          teacherNotes: normalizeTeacherNotes(imported.teacherNotes),
          cardVisibility: mergeCardVisibility(imported.cardVisibility),
          customPresets: normalizeCustomPresets(imported.customPresets),
          noiseTrackers: normalizeNoiseTrackerMap(imported.noiseTrackers),
          beautifyUndo: null,
          canvasHistoryPast: [],
          canvasHistoryFuture: [],
        })
      },
      setNoiseVoiceLevel: (trackerId, voiceLevel) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: { ...state.noiseTrackers[trackerId], voiceLevel, isPaused: voiceLevel === 'off' },
          },
        })),
      addNoisyPoint: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: applyNoisyPointToTracker(state.noiseTrackers[trackerId]),
          },
        })),
      repairNoiseTick: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: applyRepairTickToTracker(state.noiseTrackers[trackerId]),
          },
        })),
      adjustNoiseLapMinutes: (trackerId, delta) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: { ...state.noiseTrackers[trackerId], lapMinutes: Math.max(0, state.noiseTrackers[trackerId].lapMinutes + delta) },
          },
        })),
      setNoiseMeterLevel: (trackerId, meterLevel) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: { ...state.noiseTrackers[trackerId], meterLevel: Math.max(0, Math.min(100, meterLevel)) },
          },
        })),
      resetNoiseLapMinutes: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: { ...state.noiseTrackers[trackerId], lapMinutes: 0 },
          },
        })),
      resetNoiseTracker: (trackerId) =>
        set((state) => ({
          noiseTrackers: {
            ...state.noiseTrackers,
            [trackerId]: resetNoiseTrackerState(trackerId),
          },
        })),
      setCardVisible: (screenId, cardId, visible) =>
        set((state) => ({
          cardVisibility: {
            ...state.cardVisibility,
            [screenId]: { ...(state.cardVisibility[screenId] ?? {}), [cardId]: visible },
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
        set({ contents: structuredClone(beautifyUndo), beautifyUndo: null })
      },
      resetToDefaults: () => {
        useTimerStore.getState().resetAllTimers()
        const freshWorkspaces = buildClassWorkspaces()
        set({
          mode: DEFAULT_MODE,
          activeScreen: DEFAULT_SCREEN_ID,
          activePageId: freshWorkspaces[DEFAULT_SCREEN_ID]?.activePageId ?? null,
          classWorkspaces: freshWorkspaces,
          backgroundId: DEFAULT_BACKGROUND_ID,
          contents: structuredClone(DEFAULT_CONTENTS),
          teacherNotes: structuredClone(DEFAULT_TEACHER_NOTES),
          cardVisibility: structuredClone(DEFAULT_CARD_VISIBILITY),
          customPresets: [],
          noiseTrackers: structuredClone(DEFAULT_NOISE_TRACKERS) as BoardState['noiseTrackers'],
          beautifyUndo: null,
          canvasHistoryPast: [],
          canvasHistoryFuture: [],
        })
      },
    }),
    {
      name: 'classroom-command-center-lite',
      version: 8,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<BoardState> & {
          themeId?: string
        }
        const contents =
          version < 3
            ? structuredClone(DEFAULT_CONTENTS)
            : (state.contents ?? structuredClone(DEFAULT_CONTENTS))

        const teacherNotes =
          version < 4
            ? structuredClone(DEFAULT_TEACHER_NOTES)
            : normalizeTeacherNotes(state.teacherNotes)

        const cardVisibility = mergeCardVisibility(
          version < 5 ? undefined : state.cardVisibility,
        )

        const normalizedScreen = normalizeScreenIdForBoard(state.activeScreen)
        // < 8: classWorkspaces were always rebuilt from scratch on migration
        // (the Studio Canvas widget-geometry model did not exist yet), so
        // there is nothing page-specific to preserve beyond what
        // normalizeClassWorkspacesGeometry already seeds by default.
        const workspaces = normalizeClassWorkspacesGeometry(
          version < 8 ? undefined : (state.classWorkspaces as never),
        )
        const ws = workspaces[normalizedScreen]

        return {
          mode: state.mode ?? DEFAULT_MODE,
          activeScreen: normalizedScreen,
          activePageId: ws?.activePageId ?? ws?.pages[0]?.id ?? null,
          classWorkspaces: workspaces,
          backgroundId: normalizeBackgroundId(state.backgroundId),
          contents: normalizeBoardContents(contents as ScreenContents),
          teacherNotes,
          cardVisibility,
          customPresets: normalizeCustomPresets(state.customPresets),
          noiseTrackers: normalizeNoiseTrackerMap(state.noiseTrackers),
        }
      },
      partialize: (state) => ({
        mode: state.mode,
        activeScreen: state.activeScreen,
        activePageId: state.activePageId,
        classWorkspaces: state.classWorkspaces,
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
