import type { AppMode, ReadyPositionContent } from '../data/types'
import { displayFontRange } from '../lib/displayLayout'
import { SmartTextCard } from './SmartTextCard'

interface ReadyPositionCardProps {
  content: ReadyPositionContent
  mode: AppMode
  className?: string
  compact?: boolean
  onBeautify?: () => void
}

export function ReadyPositionCard({
  content,
  mode,
  className,
  compact,
  onBeautify,
}: ReadyPositionCardProps) {
  const useCompact = compact ?? content.useCompact
  const fonts = displayFontRange(mode, 14, useCompact ? 36 : 48)

  return (
    <SmartTextCard
      mode={mode}
      className={className}
      onBeautify={onBeautify}
      minFontSize={fonts.minFontSize}
      maxFontSize={fonts.maxFontSize}
      model={
        useCompact
          ? {
              title: content.title,
              blocks: [
                {
                  kind: 'paragraph',
                  text: content.compactLine,
                  emphasis: true,
                },
              ],
              align: 'center',
            }
          : {
              title: content.title,
              blocks: [{ kind: 'bullets', items: content.steps }],
              align: 'left',
            }
      }
    />
  )
}
