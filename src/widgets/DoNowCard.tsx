import type { ReactNode } from 'react'
import type { AppMode } from '../data/types'
import { displayFontRange } from '../lib/displayLayout'
import { SmartTextCard } from './SmartTextCard'

interface DoNowCardProps {
  title?: string
  prompt: string
  mode: AppMode
  className?: string
  onBeautify?: () => void
  editSlot?: ReactNode
  /** Hero sizing for homeroom Do Now — larger type in display mode. */
  hero?: boolean
}

export function DoNowCard({
  title = 'Do Now',
  prompt,
  mode,
  className,
  onBeautify,
  editSlot,
  hero = false,
}: DoNowCardProps) {
  const baseMax = hero ? 46 : 40
  const fonts = displayFontRange(mode, 16, baseMax)

  return (
    <SmartTextCard
      mode={mode}
      className={className}
      onBeautify={onBeautify}
      editSlot={editSlot}
      minFontSize={fonts.minFontSize}
      maxFontSize={fonts.maxFontSize}
      model={{
        title,
        blocks: [{ kind: 'paragraph', text: prompt, emphasis: true }],
        align: prompt.length < 60 ? 'center' : 'left',
      }}
    />
  )
}
