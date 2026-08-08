import type { ClassroomJob } from './types'

function job(
  id: string,
  title: string,
  description: string,
  capacity: number,
  points: number,
  category: string,
  displayEmoji: string,
): ClassroomJob {
  const now = Date.now()
  return { id, title, description, capacity, points, active: true, displayOrder: 0, category, createdAt: now, updatedAt: now, displayEmoji }
}

export const DEFAULT_JOBS: ClassroomJob[] = [
  job('job-filer', 'Filer', 'Organize and file papers, handouts, and graded work.', 2, 5, 'classroom', '🗂'),
  job('job-cleaner', 'Cleaner', 'Wipe desks, tidy shelves, and keep the room neat.', 2, 5, 'classroom', '🧹'),
  job('job-lunch-crew', 'Lunch Crew', 'Help with lunch setup, cleanup, and line management.', 2, 5, 'daily', '🍎'),
  job('job-monitor', 'Class Monitor', 'Lead the pledge, make announcements, and represent the class.', 1, 10, 'leadership', '🎤'),
  job('job-distributor', 'Distributor', 'Pass out papers, supplies, and materials.', 2, 5, 'classroom', '📦'),
  job('job-line-leader', 'Line Leader', 'Lead the class line and set the pace.', 1, 10, 'leadership', '🚶'),
  job('job-substitute', 'Substitute', 'Fill in for any absent student jobs.', 1, 5, 'classroom', '🔄'),
  job('job-hall-monitor', 'Hall Monitor', 'Monitor hallway behavior during transitions.', 1, 5, 'classroom', '👀'),
  job('job-door-holder', 'Door Holder', 'Hold the door for classmates and visitors.', 2, 5, 'classroom', '🚪'),
].map((j, i) => ({ ...j, displayOrder: i + 1 }))

export const DEFAULT_CYCLE_LABEL = 'Cycle 1'
export const DEFAULT_CYCLE_LENGTH_DAYS = 10
