import type {
  AppMode,
  ReadyPositionContent,
  ScreenCardVisibility,
} from '../data/types'
import { displayFontRange, gridArea, screenGridClass } from '../lib/displayLayout'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'

interface ReadyPositionScreenProps {
  content: ReadyPositionContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['ready-position']
  onBeautify?: () => void
}

export function ReadyPositionScreen({
  content,
  mode,
  cardVisibility,
  onBeautify,
}: ReadyPositionScreenProps) {
  const cueFonts = displayFontRange(mode, 16, 44)

  return (
    <div className={screenGridClass('ready-position', mode)}>
      {(cardVisibility.ready ?? true) && (
        <ReadyPositionCard
          content={content}
          mode={mode}
          onBeautify={onBeautify}
          className={`min-h-0 ${gridArea.readyPosition.main}`}
        />
      )}
      {(cardVisibility['compact-cue'] ?? true) && (
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
      )}
    </div>
  )
}
