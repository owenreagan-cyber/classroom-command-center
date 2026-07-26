import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AtmosphereState, MusicMode } from './types'
import { getPlaylistsForMode } from './playlists'

interface AtmosphereStore extends AtmosphereState {
  setMode: (mode: MusicMode) => void
  setPlaylist: (playlistId: string) => void
  play: () => void
  pause: () => void
  setVolume: (volume: number) => void
  toggleDisplayIndicator: () => void
  stop: () => void
}

const DEFAULT_STATE: AtmosphereState = {
  activeMode: null,
  activePlaylistId: null,
  volume: 0.5,
  isPlaying: false,
  showOnDisplay: false,
}

export const useAtmosphereStore = create<AtmosphereStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setMode: (mode) => {
        const playlists = getPlaylistsForMode(mode)
        const first = playlists[0]
        set({
          activeMode: mode,
          activePlaylistId: first?.id ?? null,
          isPlaying: false,
        })
      },

      setPlaylist: (playlistId) => {
        set({ activePlaylistId: playlistId, isPlaying: false })
      },

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      toggleDisplayIndicator: () =>
        set((s) => ({ showOnDisplay: !s.showOnDisplay })),

      stop: () =>
        set({
          activeMode: null,
          activePlaylistId: null,
          isPlaying: false,
        }),
    }),
    {
      name: 'classroom-atmosphere-v1',
      version: 1,
      partialize: (state) => ({
        activeMode: state.activeMode,
        activePlaylistId: state.activePlaylistId,
        volume: state.volume,
        showOnDisplay: state.showOnDisplay,
      }),
    },
  ),
)

/** Student-safe music indicator — mode label only, no URLs. */
export function getDisplayMusicLabel(
  mode: MusicMode | null,
): string | null {
  if (!mode) return null
  const labels: Record<MusicMode, string> = {
    'calm-arrival': 'Calm Music',
    'independent-work': 'Focus Music',
    'reading-time': 'Reading Music',
    'math-focus': 'Focus Music',
    cleanup: 'Cleanup Music',
    celebration: 'Celebration Music',
  }
  return labels[mode]
}
