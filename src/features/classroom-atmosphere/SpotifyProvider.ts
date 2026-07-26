import type { MusicProvider } from './types'

/**
 * Level 1 Spotify provider — embed-based, no OAuth or API tokens.
 * Playback is controlled via the Spotify embed iframe; this provider
 * tracks state for the teacher UI.
 */
export class SpotifyProvider implements MusicProvider {
  readonly name = 'Spotify Embed'

  private currentPlaylistId: string | null = null
  private playing = false
  private vol = 0.5

  play(playlistId: string): void {
    this.currentPlaylistId = playlistId
    this.playing = true
  }

  pause(): void {
    this.playing = false
  }

  setVolume(level: number): void {
    this.vol = Math.max(0, Math.min(1, level))
  }

  getVolume(): number {
    return this.vol
  }

  getCurrentPlaylist(): string | null {
    return this.currentPlaylistId
  }

  isPlaying(): boolean {
    return this.playing
  }
}

/** Singleton for teacher-side playback tracking. */
export const spotifyProvider = new SpotifyProvider()
