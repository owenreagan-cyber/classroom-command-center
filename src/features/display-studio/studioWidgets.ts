export type WidgetCategory = 'time' | 'classroom' | 'engagement' | 'rewards' | 'instruction'

export interface WidgetDefinition {
  id: string
  label: string
  description: string
  category: WidgetCategory
  status: 'live' | 'placeholder'
  icon: string
}

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  time: 'Time',
  classroom: 'Classroom',
  engagement: 'Engagement',
  rewards: 'Rewards',
  instruction: 'Instruction',
}

/**
 * Ordered widget definitions organized into categories for the widget library.
 * 'live' widgets are fully implemented; 'placeholder' widgets show "coming soon".
 */
export const STUDIO_WIDGETS: WidgetDefinition[] = [
  // Time
  { id: 'clock', label: 'Clock', description: 'Show a live classroom clock', category: 'time', status: 'live', icon: '🕐' },
  { id: 'countdown-timer', label: 'Countdown Timer', description: 'Simple countdown timer for pacing', category: 'time', status: 'live', icon: '⏱' },
  { id: 'stopwatch', label: 'Stopwatch', description: 'Count-up stopwatch for timed activities', category: 'time', status: 'live', icon: '⏲' },
  { id: 'routine-timer', label: 'Routine Timer', description: 'Auto-advancing multi-step timer', category: 'time', status: 'live', icon: '🔄' },
  // Classroom
  { id: 'directions-text', label: 'Directions / Text', description: 'Show text directions on screen', category: 'classroom', status: 'live', icon: '📝' },
  { id: 'materials', label: 'Materials', description: 'List required materials for an activity', category: 'classroom', status: 'live', icon: '📋' },
  { id: 'checklist', label: 'Checklist', description: 'Student-facing task checklist', category: 'classroom', status: 'live', icon: '✅' },
  { id: 'work-symbols', label: 'Work Symbols', description: 'Visual work-mode indicators', category: 'classroom', status: 'live', icon: '🔤' },
  { id: 'noise-meter', label: 'Noise Meter', description: 'Classroom noise level display', category: 'classroom', status: 'placeholder', icon: '🔊' },
  { id: 'qr-code', label: 'QR Code', description: 'Share a link via QR code on screen', category: 'classroom', status: 'placeholder', icon: '📱' },
  // Engagement
  { id: 'random-picker', label: 'Random Name Picker', description: 'Pick a random student', category: 'engagement', status: 'live', icon: '🎯' },
  { id: 'mystery-student', label: 'Mystery Student', description: 'Mystery Star random reveal', category: 'engagement', status: 'live', icon: '🌟' },
  { id: '100-board', label: '100 Board', description: 'Random number display board', category: 'engagement', status: 'live', icon: '🔢' },
  { id: 'dice-spinner', label: 'Dice / Spinner', description: 'Interactive dice roll or spinner', category: 'engagement', status: 'placeholder', icon: '🎲' },
  { id: 'poll', label: 'Poll', description: 'Quick classroom poll widget', category: 'engagement', status: 'placeholder', icon: '📊' },
  // Rewards
  { id: 'prize-board', label: 'Prize Board', description: 'Press Your Luck / Prize Board game', category: 'rewards', status: 'live', icon: '🎁' },
  { id: 'press-your-luck', label: 'Press Your Luck', description: 'Spin-to-win game mode', category: 'rewards', status: 'live', icon: '🎰' },
  { id: 'scoreboard', label: 'Scoreboard', description: 'Team or class scoreboard', category: 'rewards', status: 'placeholder', icon: '🏆' },
  // Instruction
  { id: 'image', label: 'Image', description: 'Show an image on the display', category: 'instruction', status: 'placeholder', icon: '🖼' },
  { id: 'pdf-embed', label: 'PDF / Embed', description: 'Embed a document or webpage', category: 'instruction', status: 'placeholder', icon: '📄' },
]
