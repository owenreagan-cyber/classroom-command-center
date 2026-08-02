import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  defaultProviderSettings,
  type LessonMessageProviderSettings,
  type LessonMessageProviderStatus,
} from './aiProviderConfig'
import { emptyDraftUsageCounter, recordDraft, type DraftUsageCounter } from './aiProviderUsage'

/**
 * Persisted local-only settings for the optional AI provider layer. No secrets
 * are stored here — see aiProviderConfig.ts for why. Safe to persist to
 * localStorage in full, same as any other non-sensitive teacher preference.
 */
const AI_PROVIDER_SETTINGS_STORAGE_KEY = 'classroom-command-center-ai-provider-settings'

interface AiProviderSettingsState {
  settings: LessonMessageProviderSettings
  draftCounter: DraftUsageCounter
}

interface AiProviderSettingsActions {
  updateSettings: (patch: Partial<LessonMessageProviderSettings>) => void
  setLastProviderStatus: (status: LessonMessageProviderStatus) => void
  resetToDeterministicOnly: () => void
  recordDraftGenerated: () => void
  resetDraftCounter: () => void
}

type AiProviderSettingsStore = AiProviderSettingsState & AiProviderSettingsActions

export const useAiProviderSettingsStore = create<AiProviderSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultProviderSettings(),
      draftCounter: emptyDraftUsageCounter(),

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      setLastProviderStatus: (status) =>
        set((state) => ({ settings: { ...state.settings, lastProviderStatus: status } })),

      resetToDeterministicOnly: () =>
        set(() => ({ settings: defaultProviderSettings() })),

      recordDraftGenerated: () => set((state) => ({ draftCounter: recordDraft(state.draftCounter) })),

      resetDraftCounter: () => set(() => ({ draftCounter: emptyDraftUsageCounter() })),
    }),
    {
      name: AI_PROVIDER_SETTINGS_STORAGE_KEY,
      version: 1,
    },
  ),
)
