import type { AppMode } from '../../data/types'
import { useBoardStore } from '../../store/boardStore'
import { MorningMessageDisplay } from './MorningMessageDisplay'

interface MorningMessageWidgetProps {
  mode: AppMode
  className?: string
}

/** Subscribes to morning message state for live canvas updates. */
export function MorningMessageWidget({ mode, className }: MorningMessageWidgetProps) {
  const content = useBoardStore((s) => s.morningMessage.current)
  return <MorningMessageDisplay content={content} mode={mode} className={className} />
}
