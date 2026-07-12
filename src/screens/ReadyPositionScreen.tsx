import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type {
  AppMode,
  CardId,
  ReadyPositionContent,
  ScreenCardVisibility,
  NoiseTrackerState,
  ScreenId,
} from '../data/types'
import { displayFontRange, gridArea, screenGridClass, noiseCardOverlayClass } from '../lib/displayLayout'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { VoiceLevelWidget } from '../widgets/VoiceLevelWidget'

interface ReadyPositionScreenProps {
  screenId: 'ready-position' | 'recess'
  content: ReadyPositionContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['ready-position']
  noiseTracker?: NoiseTrackerState
  onContentChange: (content: ReadyPositionContent) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function ReadyPositionScreen({
  screenId,
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: ReadyPositionScreenProps) {
  const isEdit = mode === 'edit'
  const actualReadyVisible = cardVisibility.ready ?? true
  const actualCompactVisible = cardVisibility['compact-cue'] ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  const cueFonts = displayFontRange(mode, 16, 44)

  return (
    <div className={`${screenGridClass(screenId, mode)} relative`}>
      {(actualReadyVisible || isEdit) && (
        actualReadyVisible ? (
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
          ) : (
          <HiddenCardPlaceholder
            screenId={screenId}
            cardId="ready"
            label="Ready Position checklist"
            onToggle={onCardVisibleChange}
            className={gridArea.readyPosition.main}
          />
        )
      )}
      {(actualCompactVisible || isEdit) && (
        actualCompactVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId={screenId}
            cardId="compact-cue"
            label="Compact cue"
            onToggle={onCardVisibleChange}
            className={gridArea.readyPosition.cue}
          />
        )
      )}
      {noiseTracker && actualNoiseVisible && (
        <VoiceLevelWidget
          level={noiseTracker.voiceLevel}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
