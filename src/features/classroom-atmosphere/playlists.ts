import type { ClassroomPlaylist, MusicMode } from './types'

/**
 * Curated classroom playlists — Spotify embed URIs only, no API tokens.
 * Teachers can override URLs via the atmosphere panel.
 */
export const CLASSROOM_PLAYLISTS: ClassroomPlaylist[] = [
  {
    id: 'calm-arrival-classical',
    title: 'Calm Arrival — Piano Focus',
    mode: 'calm-arrival',
    category: 'classical',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
    schoolSafe: true,
    notes: 'Peaceful piano for morning arrival',
  },
  {
    id: 'independent-work-lofi',
    title: 'Independent Work — LoFi Study',
    mode: 'independent-work',
    category: 'lofi',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TqZp6',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TqZp6',
    schoolSafe: true,
    notes: 'Instrumental lo-fi for focused work',
  },
  {
    id: 'reading-time-classical',
    title: 'Reading Time — Orchestral Calm',
    mode: 'reading-time',
    category: 'classical',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX7K31D69s4M1',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX7K31D69s4M1',
    schoolSafe: true,
    notes: 'Soft orchestral for silent reading',
  },
  {
    id: 'math-focus-lofi',
    title: 'Math Focus — Concentration',
    mode: 'math-focus',
    category: 'lofi',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRd88',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRd88',
    schoolSafe: true,
    notes: 'Steady beats for math block',
  },
  {
    id: 'cleanup-classical',
    title: 'Cleanup — Upbeat Classical',
    mode: 'cleanup',
    category: 'classical',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX7EFiUP51EAu',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX7EFiUP51EAu',
    schoolSafe: true,
    notes: 'Energetic classical for transitions',
  },
  {
    id: 'celebration-classical',
    title: 'Celebration — Modern Classical',
    mode: 'celebration',
    category: 'classical',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY',
    embedUri: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY',
    schoolSafe: true,
    notes: 'Piano Guys / Brooklyn Duo style',
  },
]

export const MUSIC_MODE_LABELS: Record<MusicMode, string> = {
  'calm-arrival': 'Calm Arrival',
  'independent-work': 'Independent Work',
  'reading-time': 'Reading Time',
  'math-focus': 'Math Focus',
  cleanup: 'Cleanup',
  celebration: 'Celebration',
}

export function getPlaylistsForMode(mode: MusicMode): ClassroomPlaylist[] {
  return CLASSROOM_PLAYLISTS.filter((p) => p.mode === mode)
}

export function getPlaylistById(id: string): ClassroomPlaylist | undefined {
  return CLASSROOM_PLAYLISTS.find((p) => p.id === id)
}
