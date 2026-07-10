import type { AppMode, ReadingContent } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface ReadingScreenProps {
  content: ReadingContent
  mode: AppMode
  onBeautify?: () => void
}

export function ReadingScreen({ content, mode, onBeautify }: ReadingScreenProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SmartTextCard
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
        model={{
          title: 'Reading',
          blocks: [{ kind: 'paragraph', text: content.lessonTitle, emphasis: true }],
          align: 'center',
        }}
      />
      <MaterialsCard
        title={content.materialsTitle}
        materials={content.materials}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <ReadyPositionCard
        content={content.readyPosition}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <TimerWidget screenId="reading" mode={mode} className="min-h-0" />
    </div>
  )
}
