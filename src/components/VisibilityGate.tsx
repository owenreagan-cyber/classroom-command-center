import type { ReactNode } from 'react'
import type { AppMode, Visibility } from '../data/types'
import { shouldRenderForMode } from '../lib/visibility'

interface VisibilityGateProps {
  visibility?: Visibility
  mode: AppMode
  children: ReactNode
  /** Optional label shown above teacher-only content in edit mode. */
  teacherLabel?: string
  className?: string
}

export function VisibilityGate({
  visibility = 'student',
  mode,
  children,
  teacherLabel = 'Teacher only',
  className = '',
}: VisibilityGateProps) {
  if (!shouldRenderForMode(visibility, mode)) {
    return null
  }

  if (visibility === 'teacherOnly' && mode === 'edit') {
    return (
      <div
        className={`rounded-xl border border-amber-400/40 bg-amber-950/30 ${className}`}
        data-visibility="teacherOnly"
      >
        <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
          {teacherLabel}
        </p>
        <div className="px-3 pb-3 pt-1">{children}</div>
      </div>
    )
  }

  return <>{children}</>
}
