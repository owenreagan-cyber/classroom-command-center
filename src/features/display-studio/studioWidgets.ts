export type WidgetCategory = 'time' | 'classroom' | 'engagement' | 'rewards' | 'instruction'

export interface WidgetDefinition {
  id: string
  label: string
  description: string
  category: WidgetCategory
  status: 'connected' | 'live' | 'placeholder' | 'teacherOnly'
  icon: string
}

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  time: 'Time',
  classroom: 'Classroom',
  engagement: 'Engagement',
  rewards: 'Rewards',
  instruction: 'Instruction',
}

export const STUDIO_WIDGETS: WidgetDefinition[] = [
  // Time
  { id: 'clock', label: 'Clock', description: 'Show a live classroom clock', category: 'time', status: 'connected', icon: '🕐' },
  { id: 'countdown-timer', label: 'Countdown Timer', description: 'Simple countdown timer for pacing', category: 'time', status: 'connected', icon: '⏱' },
  { id: 'stopwatch', label: 'Stopwatch', description: 'Count-up stopwatch', category: 'time', status: 'placeholder', icon: '⏲' },
  { id: 'routine-timer', label: 'Routine Timer', description: 'Auto-advancing multi-step timer', category: 'time', status: 'connected', icon: '🔄' },
  // Classroom
  { id: 'directions-text', label: 'Directions / Text', description: 'Show text directions on screen', category: 'classroom', status: 'connected', icon: '📝' },
  { id: 'materials', label: 'Materials', description: 'List required materials', category: 'classroom', status: 'connected', icon: '📋' },
  { id: 'checklist', label: 'Checklist', description: 'Student-facing task checklist', category: 'classroom', status: 'connected', icon: '✅' },
  { id: 'work-symbols', label: 'Work Symbols', description: 'Visual work-mode indicators', category: 'classroom', status: 'connected', icon: '🔤' },
  { id: 'noise-meter', label: 'Noise Level', description: 'Classroom voice level display', category: 'classroom', status: 'connected', icon: '🔊' },
  { id: 'atmosphere', label: 'Atmosphere / Music', description: 'Classroom music status', category: 'classroom', status: 'connected', icon: '🎵' },
  { id: 'qr-code', label: 'QR Code', description: 'Share a link via QR code', category: 'classroom', status: 'placeholder', icon: '📱' },
  // Engagement
  { id: 'random-picker', label: 'Random Picker', description: 'Pick a random student', category: 'engagement', status: 'connected', icon: '🎯' },
  { id: 'mystery-student', label: 'Mystery Student', description: 'Mystery Star random reveal', category: 'engagement', status: 'connected', icon: '🌟' },
  { id: '100-board', label: '100 Board', description: 'Interactive number board with prize reveals', category: 'engagement', status: 'connected', icon: '🔢' },
  { id: 'dice-spinner', label: 'Dice / Spinner', description: 'Interactive dice roll or spinner', category: 'engagement', status: 'placeholder', icon: '🎲' },
  { id: 'poll', label: 'Poll', description: 'Quick classroom poll widget', category: 'engagement', status: 'placeholder', icon: '📊' },
  // Rewards
  { id: 'prize-board', label: 'Prize Board', description: 'Show Prize Board status', category: 'rewards', status: 'connected', icon: '🎁' },
  { id: 'press-your-luck', label: 'Press Your Luck', description: 'Spin-to-win game status', category: 'rewards', status: 'connected', icon: '🎰' },
  { id: 'scoreboard', label: 'Scoreboard', description: 'Team or class scoreboard', category: 'rewards', status: 'placeholder', icon: '🏆' },
  // Instruction
  { id: 'lotto-board', label: 'Lotto Board', description: 'Bingo-style 1-100 ball draw', category: 'engagement', status: 'connected', icon: '🎱' },
  { id: 'jobs-manager', label: 'Jobs Manager', description: 'Show classroom job assignments', category: 'classroom', status: 'connected', icon: '🧰' },
  // Instruction
  { id: 'image', label: 'Image', description: 'Show an image on the display', category: 'instruction', status: 'placeholder', icon: '🖼' },
  { id: 'pdf-embed', label: 'PDF / Embed', description: 'Embed a document or webpage', category: 'instruction', status: 'placeholder', icon: '📄' },
]

export const STATUS_LABELS: Record<string, string> = {
  connected: 'Ready',
  live: 'Live',
  placeholder: 'Coming Soon',
  teacherOnly: 'Teacher Only',
}
