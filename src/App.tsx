import { lazy, Suspense } from 'react'
import { AppShell } from './app/AppShell'
import { RootRedirect } from './app/RootRedirect'
import { useAppRoute } from './app/useAppRoute'

// Phase 15M: tldraw spike — dev-only, lazy-loaded so tldraw stays out of the main bundle.
// Only fetched when a browser navigates to /canvas-spike.
const CanvasSpikePage = lazy(() => import('./features/canvas-spike/CanvasSpikePage'))

// DB-1: Clean Board Lab — isolated, lazy-loaded, never wired as the default app.
const BoardLabPage = lazy(() => import('./features/clean-board/BoardLabPage'))

// DB-7A: Clean Board host display — the student/projector route for the M1.
const BoardHostDisplay = lazy(() => import('./features/clean-board/BoardHostDisplay'))

function App() {
  const route = useAppRoute()

  if (route === 'root') {
    return <RootRedirect />
  }

  if (route === 'canvasSpike') {
    return (
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white text-lg">Loading spike...</div>}>
        <CanvasSpikePage />
      </Suspense>
    )
  }

  if (route === 'boardLab') {
    return (
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white text-lg">Loading board lab...</div>}>
        <BoardLabPage />
      </Suspense>
    )
  }

  if (route === 'display') {
    return (
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white text-lg">Preparing display...</div>}>
        <BoardHostDisplay />
      </Suspense>
    )
  }

  return <AppShell route={route} />
}

export default App
