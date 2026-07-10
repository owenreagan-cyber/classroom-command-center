import type { AppMode } from '../data/types'
import { VisibilityGate } from '../components/VisibilityGate'

interface TeacherHintProps {
  mode: AppMode
  text: string
  className?: string
}

/** Inline teacher-only hint shown on screen cards in edit mode only. */
export function TeacherHint({ mode, text, className = '' }: TeacherHintProps) {
  if (!text.trim()) {
    return null
  }

  return (
    <VisibilityGate
      visibility="teacherOnly"
      mode={mode}
      className={`mt-2 ${className}`}
      teacherLabel="Teacher hint"
    >
      <p className="text-left text-xs leading-relaxed text-amber-100/90">{text}</p>
    </VisibilityGate>
  )
}
