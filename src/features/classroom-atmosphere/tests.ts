function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { CLASSROOM_PLAYLISTS, getPlaylistsForMode, getPlaylistById, MUSIC_MODE_LABELS } from './playlists'
import { getDisplayMusicLabel } from './atmosphereStore'

// --- Playlist manifest ---

assert(CLASSROOM_PLAYLISTS.length >= 6, 'at least 6 curated playlists')

const modes = new Set(CLASSROOM_PLAYLISTS.map((p) => p.mode))
assert(modes.has('calm-arrival'), 'calm-arrival mode exists')
assert(modes.has('independent-work'), 'independent-work mode exists')
assert(modes.has('reading-time'), 'reading-time mode exists')
assert(modes.has('math-focus'), 'math-focus mode exists')
assert(modes.has('cleanup'), 'cleanup mode exists')
assert(modes.has('celebration'), 'celebration mode exists')

for (const playlist of CLASSROOM_PLAYLISTS) {
  assert(playlist.schoolSafe === true, `${playlist.id} is school safe`)
  assert(playlist.spotifyUrl.startsWith('https://'), `${playlist.id} has valid spotify URL`)
  assert(playlist.embedUri.startsWith('https://'), `${playlist.id} has valid embed URI`)
  assert(!playlist.spotifyUrl.includes('token'), `${playlist.id} has no tokens in URL`)
  assert(!playlist.embedUri.includes('token'), `${playlist.id} has no tokens in embed`)
}

// --- Mode lookup ---

const calmPlaylists = getPlaylistsForMode('calm-arrival')
assert(calmPlaylists.length >= 1, 'calm-arrival has playlists')
assert(calmPlaylists.every((p) => p.mode === 'calm-arrival'), 'filtered by mode')

const found = getPlaylistById(calmPlaylists[0].id)
assert(found !== undefined, 'getPlaylistById finds playlist')

// --- Display privacy ---

assert(getDisplayMusicLabel('calm-arrival') === 'Calm Music', 'calm display label')
assert(getDisplayMusicLabel('math-focus') === 'Focus Music', 'math focus display label')
assert(getDisplayMusicLabel(null) === null, 'null mode returns null label')

// No URLs in display labels
for (const mode of Object.keys(MUSIC_MODE_LABELS) as Array<keyof typeof MUSIC_MODE_LABELS>) {
  const label = getDisplayMusicLabel(mode)
  assert(label !== null, `${mode} has display label`)
  assert(!label!.includes('http'), `${mode} label has no URL`)
  assert(!label!.includes('spotify'), `${mode} label has no spotify reference`)
}

// --- Mode labels ---

assert(MUSIC_MODE_LABELS['calm-arrival'] === 'Calm Arrival', 'mode label')
assert(Object.keys(MUSIC_MODE_LABELS).length === 6, 'six music modes')

console.log('All classroom atmosphere tests passed.')
