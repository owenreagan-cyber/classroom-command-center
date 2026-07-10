import type { AppMode } from '../data/types'
import { SmartTextCard } from './SmartTextCard'

interface DoNowCardProps {
  title?: string
  prompt: string
  mode: AppMode
  className?: string
  onBeautify?: () => void
}

export function DoNowCard({
  title = 'Do Now',
  prompt,
  mode,
  className,
  onBeautify,
}: DoNowCardProps) {
  return (
    <SmartTextCard
      mode={mode}
      className={className}
      onBeautify={onBeautify}
      maxFontSize={40}
      model={{
        title,
        blocks: [{ kind: 'paragraph', text: prompt, emphasis: true }],
        align: prompt.length < 60 ? 'center' : 'left',
      }}
    />
  )
}
