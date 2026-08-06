/**
 * Shared template category definitions used by both the Display Studio
 * template picker UI (.tsx) and unit tests (.ts).
 */
export const TEMPLATE_CATEGORIES = [
  { id: 'daily', label: 'Daily', description: 'Morning routines, transitions, lunch, and end of day' },
  { id: 'instruction', label: 'Instruction', description: 'Launch lessons and guide practice' },
  { id: 'management', label: 'Management', description: 'Work time, groups, clean up, assessments' },
  { id: 'engagement', label: 'Engagement', description: 'Games, mystery student, prizes, and review' },
] as const
