import { useState, type ReactNode } from 'react'
import { SCREEN_META } from '../data/defaults'
import { getBackgroundAsset } from '../data/backgroundAssets'
import type { AppMode, BackgroundAssetId, ScreenId } from '../data/types'

interface BoardChromeProps {
  mode: AppMode
  activeScreen: ScreenId
  backgroundId: BackgroundAssetId
  onEnterEdit: () => void
  children: ReactNode
}

function BackgroundImage({ path }: { path: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <img
      src={path}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export function BoardFrame({
  mode,
  activeScreen,
  backgroundId,
  onEnterEdit,
  children,
}: BoardChromeProps) {
  const background = getBackgroundAsset(backgroundId)
  const screenLabel =
    SCREEN_META.find((screen) => screen.id === activeScreen)?.label ?? 'Board'

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-slate-950 p-3 md:p-4">
      <div
        className="relative w-full max-w-[min(100%,calc((100dvh-1.5rem)*16/9))] overflow-hidden rounded-2xl shadow-2xl"
        style={{
          aspectRatio: '16 / 9',
          background: background.fallbackGradient,
        }}
      >
        <BackgroundImage key={background.path} path={background.path} />
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/20"
          aria-hidden="true"
        />

        <header className="relative z-10 flex items-start justify-between gap-4 px-8 pb-2 pt-6 md:px-10 md:pt-8">
          <div className="rounded-2xl bg-slate-950/55 px-4 py-3 backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100/90 md:text-base">
              Classroom Command Center
            </p>
            <h1 className="mt-1 text-4xl font-bold text-white drop-shadow md:text-5xl lg:text-6xl">
              {screenLabel}
            </h1>
          </div>
          {mode === 'display' && (
            <button
              type="button"
              onClick={onEnterEdit}
              className="rounded-xl bg-slate-950/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-slate-950/80"
              aria-label="Enter edit mode"
            >
              Edit
            </button>
          )}
        </header>

        <main className="absolute inset-x-0 bottom-0 top-[7.5rem] z-10 px-6 pb-6 md:top-[8.5rem] md:px-8 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
