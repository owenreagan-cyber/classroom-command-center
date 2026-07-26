/** Music mode presets for classroom atmosphere. */
export type MusicMode =
  | 'calm-arrival'
  | 'independent-work'
  | 'reading-time'
  | 'math-focus'
  | 'cleanup'
  | 'celebration'

export type PlaylistCategory = 'classical' | 'lofi'

export interface ClassroomPlaylist {
  id: string
  title: string
  mode: MusicMode
  category: PlaylistCategory
  /** Spotify playlist URL (open in app/browser). */
  spotifyUrl: string
  /** Spotify embed URI for iframe player. */
  embedUri: string
  schoolSafe: true
  notes?: string
}

export interface MusicProvider {
  readonly name: string
  play(playlistId: string): void
  pause(): void
  setVolume(level: number): void
  getCurrentPlaylist(): string | null
  isPlaying(): boolean
}

export interface AtmosphereState {
  activeMode: MusicMode | null
  activePlaylistId: string | null
  volume: number
  isPlaying: boolean
  showOnDisplay: boolean
}
