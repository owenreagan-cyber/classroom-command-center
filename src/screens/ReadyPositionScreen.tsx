import type { AppMode, ReadyPositionContent } from '../data/types'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'

interface ReadyPositionScreenProps {
  content: ReadyPositionContent
  mode: AppMode
  onBeautify?: () => void
}

export function ReadyPositionScreen({
  content,
  mode,
  onBeautify,
}: ReadyPositionScreenProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
      <ReadyPositionCard
        content={content}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <SmartTextCard
        mode={mode}
        className="min-h-0"
        maxFontSize={44}
        model={{
          title: 'Compact Cue',
          blocks: [
            {
              kind: 'paragraph',
              text: content.compactLine,
              emphasis: true,
            },
            {
              kind: 'note',
              text: 'Use the compact line for quick redirects. Full checklist stays on the left.',
            },
          ],
          align: 'center',
        }}
      />
    </div>
  )
}
