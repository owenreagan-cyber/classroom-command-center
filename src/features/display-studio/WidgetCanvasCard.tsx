import type { CanvasWidget } from '../display-composer/types'
import { WidgetCardShell } from './WidgetCardShell'
import { TimerWidgetContent, RoutineTimerContent } from './WidgetTimerRenderers'
import { MysteryStudentContent, RandomPickerContent, HundredBoardContent, PrizeBoardContent, PressYourLuckContent } from './WidgetEngagementRenderers'
import { NoiseLevelContent, AtmosphereContent, DirectionsTextContent, WorkSymbolsContent, MaterialsContent, ChecklistContent, PlaceholderContent } from './WidgetMiscRenderers'

export function WidgetCanvasCard({
  widget,
  isSelected,
  onSelect,
  onDragStart,
}: {
  widget: CanvasWidget
  isSelected: boolean
  onSelect: (id: string) => void
  onDragStart: (e: React.MouseEvent, id: string) => void
}) {
  const content = (() => {
    switch (widget.type) {
      case 'countdown-timer': return <TimerWidgetContent widget={widget} />
      case 'routine-timer': return <RoutineTimerContent widget={widget} />
      case 'mystery-student': return <MysteryStudentContent widget={widget} />
      case 'random-picker': return <RandomPickerContent widget={widget} />
      case '100-board': return <HundredBoardContent widget={widget} />
      case 'prize-board': return <PrizeBoardContent widget={widget} />
      case 'press-your-luck': return <PressYourLuckContent widget={widget} />
      case 'noise-meter': return <NoiseLevelContent widget={widget} />
      case 'atmosphere': return <AtmosphereContent widget={widget} />
      case 'directions-text': return <DirectionsTextContent widget={widget} />
      case 'work-symbols': return <WorkSymbolsContent widget={widget} />
      case 'materials': return <MaterialsContent widget={widget} />
      case 'checklist': return <ChecklistContent widget={widget} />
      default: return <PlaceholderContent widget={widget} />
    }
  })()

  return (
    <WidgetCardShell widget={widget} isSelected={isSelected} onSelect={onSelect} onDragStart={onDragStart}>
      {content}
    </WidgetCardShell>
  )
}
