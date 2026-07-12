import type { BehaviorLookFor, CoachingState } from './types'

export const DEFAULT_HOMEROOM_LOOK_FORS: BehaviorLookFor[] = [
  { id: 'hr-1', label: 'Following directions promptly' },
  { id: 'hr-2', label: 'Respectful behavior' },
  { id: 'hr-3', label: 'Hallway behavior' },
  { id: 'hr-4', label: 'Recess choices' },
  { id: 'hr-5', label: 'Cleanup' },
  { id: 'hr-6', label: 'Voice level' },
  { id: 'hr-7', label: 'Self-control' },
  { id: 'hr-8', label: 'Transitions' },
  { id: 'hr-9', label: 'Taking responsibility' },
]

export const DEFAULT_MATH_LOOK_FORS: BehaviorLookFor[] = [
  { id: 'math-1', label: 'Following directions' },
  { id: 'math-2', label: 'Prepared' },
  { id: 'math-3', label: 'Organized' },
  { id: 'math-4', label: 'Participation' },
  { id: 'math-5', label: 'Neat notes/work' },
  { id: 'math-6', label: 'Ready Position' },
  { id: 'math-7', label: 'Showing work' },
  { id: 'math-8', label: 'Perseverance' },
  { id: 'math-9', label: 'Answering on signal' },
]

export const DEFAULT_READING_LOOK_FORS: BehaviorLookFor[] = [
  { id: 'rd-1', label: 'Following directions' },
  { id: 'rd-2', label: 'Prepared' },
  { id: 'rd-3', label: 'Organized' },
  { id: 'rd-4', label: 'Participation' },
  { id: 'rd-5', label: 'Answering on signal' },
  { id: 'rd-6', label: 'Ready Position' },
  { id: 'rd-7', label: 'Reading loud and proud' },
  { id: 'rd-8', label: 'Listening respectfully' },
  { id: 'rd-9', label: 'Text evidence' },
  { id: 'rd-10', label: 'Reading stamina' },
]

export const ALL_DEFAULT_LOOK_FORS = [
  ...DEFAULT_HOMEROOM_LOOK_FORS,
  ...DEFAULT_MATH_LOOK_FORS,
  ...DEFAULT_READING_LOOK_FORS,
]

export const HOMEROOM_CONTEXTS = [
  'Morning Routine',
  'Hallway',
  'Shurley',
  'History / Science',
  'Snack',
  'Recess',
  'Lunch',
  'Cleanup',
  'Dismissal',
]

export const RECOGNITION_REASONS = [
  'Followed directions',
  'Demonstrated responsibility',
  'Showed perseverance',
  'Helped the classroom community',
  'Participated thoughtfully',
  'Stayed prepared and focused',
  'Improved throughout the class',
]

export const COACHING_PRESETS = [
  { id: 'preset-first-week', label: 'First Week Routines' },
  { id: 'preset-directions', label: 'Following Directions' },
  { id: 'preset-ready', label: 'Ready Position' },
  { id: 'preset-voice', label: 'Voice Level and Self-Control' },
  { id: 'preset-hallway', label: 'Hallway Expectations' },
  { id: 'preset-transitions', label: 'Transitions' },
  { id: 'preset-independent', label: 'Independent Work' },
  { id: 'preset-participation', label: 'Participation' },
  { id: 'preset-cleanup', label: 'Cleanup' },
  { id: 'preset-dismissal', label: 'Dismissal' },
]

export const DEFAULT_COACHING_STATE: CoachingState = {
  enabled: true,
  visibleBehaviors: ['hr-1', 'hr-6', 'hr-8'],
  customBehaviors: [],
  showOnScreens: ['homeroom', 'math', 'reading'],
  stage: 'teach',
  displayMode: 'expanded',
}
