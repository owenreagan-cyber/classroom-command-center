import { memo } from 'react'
import { getPlaylistById } from './playlists'

interface SpotifyEmbedPlayerProps {
  playlistId: string
  volume?: number
}

/** Spotify embed iframe — no API tokens, teacher-controlled. */
export const SpotifyEmbedPlayer = memo(function SpotifyEmbedPlayer({
  playlistId,
  volume = 0.5,
}: SpotifyEmbedPlayerProps) {
  const playlist = getPlaylistById(playlistId)
  if (!playlist) return null

  const volumeParam = Math.round(volume * 100)

  return (
    <iframe
      title={`Spotify: ${playlist.title}`}
      src={`${playlist.embedUri}?utm_source=generator&theme=0&volume=${volumeParam}`}
      width="100%"
      height="80"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg border border-slate-700"
    />
  )
})
