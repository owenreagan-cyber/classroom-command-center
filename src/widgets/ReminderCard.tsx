import type { AppMode } from '../data/types'
import { SmartTextCard } from './SmartTextCard'

interface ReminderCardProps {
  title?: string
  reminders: string[]
  mode: AppMode
  className?: string
  onBeautify?: () => void
}

export function ReminderCard({
  title = 'Reminders',
  reminders,
  mode,
  className,
  onBeautify,
}: ReminderCardProps) {
  return (
    <SmartTextCard
      mode={mode}
      className={className}
      onBeautify={onBeautify}
      model={{
        title,
        blocks: [{ kind: 'bullets', items: reminders }],
        align: reminders.length > 3 ? 'left' : 'left',
      }}
    />
  )
}
