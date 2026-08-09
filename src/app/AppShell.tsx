import type { AppShellRoute } from './appRoute'
import { StudentDisplayShell } from './StudentDisplayShell'
import { TeacherControlShell } from './TeacherControlShell'

interface AppShellProps {
  route: AppShellRoute
}

export function AppShell({ route }: AppShellProps) {
  if (route === 'display') {
    return <StudentDisplayShell />
  }

  // Phase 15M: tldraw spike route — dev-only, not reachable from production navigation.
  // Handled by CanvasSpikePage directly in App.tsx for isolation.
  return <TeacherControlShell />
}
