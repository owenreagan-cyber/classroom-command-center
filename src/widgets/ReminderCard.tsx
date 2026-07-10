import type { ReactNode } from 'react'
import type { AppMode } from '../data/types'
import { SmartTextCard } from './SmartTextCard'

interface ReminderCardProps {
  title?: string
  reminders: string[]
  mode: AppMode
  className?: string
  onBeautify?: () => void
  editSlot?: ReactNode
}

export function ReminderCard({
  title = 'Reminders',
  reminders,
  mode,
  className,
  onBeautify,
  editSlot,
}: ReminderCardProps) {
  return (
    <SmartTextCard
      mode={mode}
      className={className}
      onBeautify={onBeautify}
      editSlot={editSlot}
      model={{
        title,
        blocks: [{ kind: 'bullets', items: reminders }],
        align: reminders.length > 3 ? 'left' : 'left',
      }}
    />
  )
}
