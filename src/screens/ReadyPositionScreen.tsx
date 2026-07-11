import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import type {
  AppMode,
  ReadyPositionContent,
  ScreenCardVisibility,
  NoiseTrackerState,
} from '../data/types'
import { displayFontRange, gridArea, screenGridClass, noiseCardOverlayClass } from '../lib/displayLayout'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { NoiseStatusCard } from '../widgets/NoiseStatusCard'

interface ReadyPositionScreenProps {
  content: ReadyPositionContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['ready-position']
  noiseTracker?: NoiseTrackerState
  onContentChange: (content: ReadyPositionContent) => void
  onBeautify?: () => void
}

export function ReadyPositionScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onBeautify,
}: ReadyPositionScreenProps) {
  const cueFonts = displayFontRange(mode, 16, 44)

  return (
    <div className={`${screenGridClass('ready-position', mode)} relative`}>
      {(cardVisibility.ready ?? true) && (
        <ReadyPositionCard
          content={content}
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableList
              mode={mode}
              label="Checklist steps"
              items={content.steps}
              onChange={(steps) => onContentChange({ ...content, steps })}
              helperText="One checklist cue per line."
            />
          }
          className={`min-h-0 ${gridArea.readyPosition.main}`}
        />
      )}
      {(cardVisibility['compact-cue'] ?? true) && (
        <SmartTextCard
          mode={mode}
          className={`min-h-0 ${gridArea.readyPosition.cue}`}
          minFontSize={cueFonts.minFontSize}
          maxFontSize={cueFonts.maxFontSize}
          editSlot={
            <EditableText
              mode={mode}
              label="Compact cue"
              value={content.compactLine}
              onChange={(compactLine) =>
                onContentChange({ ...content, compactLine })
              }
              multiline
              helperText="This quick cue is useful for redirects and transitions."
            />
          }
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
      {noiseTracker && (cardVisibility.noise ?? true) && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
