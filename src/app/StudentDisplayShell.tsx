import { BoardWorkspace } from './BoardWorkspace'

/** Student/projector route — classroom content only; no teacher-only components mount. */
export function StudentDisplayShell() {
  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-slate-950">
      <BoardWorkspace effectiveMode="display" studentDisplay />
    </div>
  )
}
