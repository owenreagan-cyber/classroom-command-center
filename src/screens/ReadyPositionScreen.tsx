import type { AppMode, ReadyPositionContent } from '../data/types'
import { displayFontRange, gridArea, screenGridClass } from '../lib/displayLayout'
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
  const cueFonts = displayFontRange(mode, 16, 44)

  return (
    <div className={screenGridClass('ready-position', mode)}>
      <ReadyPositionCard
        content={content}
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.readyPosition.main}`}
      />
      <SmartTextCard
        mode={mode}
        className={`min-h-0 ${gridArea.readyPosition.cue}`}
        minFontSize={cueFonts.minFontSize}
        maxFontSize={cueFonts.maxFontSize}
        model={{
          title: mode === 'display' ? 'Quick Cue' : 'Compact Cue',
          blocks: [
            {
              kind: 'paragraph',
              text: content.compactLine,
              emphasis: true,
            },
            ...(mode === 'edit'
              ? [
                  {
                    kind: 'note' as const,
                    visibility: 'teacherOnly' as const,
                    text: 'Use the compact line for quick redirects. Full checklist stays on the left.',
                  },
                ]
              : []),
          ],
          align: 'center',
        }}
      />
    </div>
  )
}
