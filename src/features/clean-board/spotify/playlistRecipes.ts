import type { PlaylistRecipe } from './spotifyTypes'

/**
 * DB-2C / DB-2F — deterministic classroom playlist recipes.
 *
 * Template-based only. These are starting points for Spotify search queries,
 * NOT auto-generated playlists. Every recipe carries a "needs teacher review"
 * note: no recipe is asserted to be school-safe by construction. DB-2F adds
 * broad `category` groupings and seasonal recipes to power the AI prompt
 * builder's deterministic fallback.
 */

export const CLASSROOM_PLAYLIST_RECIPES: PlaylistRecipe[] = [
  {
    id: 'morning-arrival-calm',
    title: 'Morning Arrival Calm',
    category: 'morning-arrival',
    classroomUse: 'Soft background music while students settle in.',
    suggestedDurationMinutes: 15,
    energy: 'low',
    avoid: ['explicit', 'heavy percussion', 'vocals with lyrics'],
    searchQueries: ['calm morning instrumental', 'soft acoustic classroom', 'gentle ambient piano'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'independent-work-focus',
    title: 'Independent Work Focus',
    category: 'independent-work',
    classroomUse: 'Quiet concentration music for sustained individual work.',
    suggestedDurationMinutes: 25,
    energy: 'low',
    avoid: ['explicit', 'lyrics', 'upbeat dance'],
    searchQueries: ['focus instrumental', 'study ambient', 'lo-fi no lyrics'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'math-work-instrumental',
    title: 'Math Work Instrumental',
    category: 'math',
    classroomUse: 'Neutral instrumental backing for math practice.',
    suggestedDurationMinutes: 20,
    energy: 'medium',
    avoid: ['explicit', 'lyrics', 'distracting drops'],
    searchQueries: ['math study instrumental', 'neutral work music', 'instrumental math focus'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'reading-time-calm',
    title: 'Reading Time Calm',
    category: 'reading',
    classroomUse: 'Quiet acoustic ambience for independent reading blocks.',
    suggestedDurationMinutes: 25,
    energy: 'low',
    avoid: ['explicit', 'lyrics', 'percussion', 'upbeat'],
    searchQueries: ['quiet reading acoustic', 'cozy library ambience', 'soft acoustic instrumental'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'writing-time-piano',
    title: 'Writing Time Piano',
    category: 'writing',
    classroomUse: 'Calm piano for journaling and writing blocks.',
    suggestedDurationMinutes: 20,
    energy: 'low',
    avoid: ['explicit', 'percussion', 'vocals'],
    searchQueries: ['solo piano writing', 'calm piano instrumental', 'writing time piano'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'clean-up-cue',
    title: 'Clean Up Cue',
    category: 'cleanup',
    classroomUse: 'Upbeat signal music for transition/cleanup time.',
    suggestedDurationMinutes: 5,
    energy: 'high',
    avoid: ['explicit'],
    searchQueries: ['upbeat clean up song', 'classroom transition music', 'energetic instrumental cue'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'rainy-day-calm',
    title: 'Rainy Day Calm',
    category: 'reading',
    classroomUse: 'Soothing ambience for indoor recess or reading.',
    suggestedDurationMinutes: 20,
    energy: 'low',
    avoid: ['explicit', 'lyrics', 'upbeat'],
    searchQueries: ['rain sounds calm', 'cozy reading ambience', 'soft nature instrumental'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'test-mode-quiet',
    title: 'Test Mode Quiet',
    category: 'testing',
    classroomUse: 'Near-silent concentration for assessments.',
    suggestedDurationMinutes: 45,
    energy: 'low',
    avoid: ['explicit', 'lyrics', 'percussion', 'melodic hooks'],
    searchQueries: ['white noise focus', 'brown noise study', 'minimal ambient test'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'seasonal-fall',
    title: 'Fall Classroom Calm',
    category: 'seasonal',
    classroomUse: 'Warm, cozy instrumental for autumn classroom blocks.',
    suggestedDurationMinutes: 20,
    energy: 'low',
    avoid: ['explicit', 'lyrics'],
    searchQueries: ['fall acoustic instrumental', 'cozy autumn ambience', 'warm acoustic classroom'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'seasonal-winter',
    title: 'Winter Classroom Calm',
    category: 'seasonal',
    classroomUse: 'Gentle winter instrumental for quiet indoor work.',
    suggestedDurationMinutes: 20,
    energy: 'low',
    avoid: ['explicit', 'lyrics'],
    searchQueries: ['winter instrumental calm', 'snow day ambience', 'gentle winter acoustic'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
  {
    id: 'seasonal-spring',
    title: 'Spring Classroom Calm',
    category: 'seasonal',
    classroomUse: 'Light, airy instrumental for spring classroom blocks.',
    suggestedDurationMinutes: 20,
    energy: 'medium',
    avoid: ['explicit', 'lyrics'],
    searchQueries: ['spring acoustic instrumental', 'light airy classroom music', 'fresh spring ambience'],
    teacherNote: 'Needs teacher review — preview before use.',
  },
]

export function getRecipeById(id: string): PlaylistRecipe | undefined {
  return CLASSROOM_PLAYLIST_RECIPES.find((r) => r.id === id)
}
