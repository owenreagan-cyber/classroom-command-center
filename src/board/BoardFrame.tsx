import { useState, type ReactNode } from 'react'
import { SCREEN_META } from '../data/defaults'
import { getBackgroundAsset } from '../data/backgroundAssets'
import type { AppMode, BackgroundAssetId, ScreenId } from '../data/types'

import { CoachingCard } from '../features/student-picker/widgets/CoachingCard'
import { MysteryRevealStage } from '../features/student-picker/widgets/MysteryRevealStage'

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
  const isDisplay = mode === 'display'

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-slate-950 p-2 md:p-3">
      <div
        className="board-canvas relative w-full max-w-[min(100%,calc((100dvh-1rem)*16/9))] overflow-hidden rounded-2xl shadow-2xl"
        data-mode={mode}
        style={{
          aspectRatio: '16 / 9',
          background: background.fallbackGradient,
        }}
      >
        <BackgroundImage key={background.path} path={background.path} />
        <div
          className={`absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/20 ${
            isDisplay ? 'from-slate-950/28' : ''
          }`}
          aria-hidden="true"
        />

        <header
          className={`relative z-20 flex items-start justify-between gap-4 px-[var(--board-safe-x)] pb-1 pt-5 md:pt-6 ${
            isDisplay ? 'md:pt-7' : ''
          }`}
        >
          <div
            className={`board-header-brand rounded-2xl bg-slate-950/55 backdrop-blur-sm ${
              isDisplay ? 'px-5 py-3 md:px-6 md:py-3.5' : 'px-4 py-3 md:px-5'
            }`}
          >
            <p
              className={`font-semibold uppercase tracking-[0.25em] text-cyan-100/90 ${
                isDisplay
                  ? 'text-xs md:text-sm'
                  : 'text-sm md:text-base'
              }`}
            >
              Classroom Command Center
            </p>
            <h1
              className={`board-screen-title mt-1 font-bold text-white drop-shadow ${
                isDisplay
                  ? 'text-4xl md:text-5xl lg:text-[3.75rem] lg:leading-none'
                  : 'text-4xl md:text-5xl lg:text-6xl'
              }`}
            >
              {screenLabel}
            </h1>
          </div>
          {isDisplay && (
            <button
              type="button"
              onClick={onEnterEdit}
              className="board-edit-entry mt-1 rounded-xl bg-slate-950/50 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-slate-950/75 md:px-4 md:py-2 md:text-sm"
              aria-label="Enter edit mode"
            >
              Edit
            </button>
          )}
        </header>

        <main className="board-main-safe">{children}</main>

        <div className="absolute bottom-4 left-4 z-30 max-w-[22rem] pointer-events-none">
          <div className="pointer-events-auto">
            <CoachingCard
              screenId={activeScreen}
              presentation={isDisplay ? 'compact' : 'expanded'}
            />
          </div>
        </div>

        <MysteryRevealStage screenId={activeScreen} />
      </div>
    </div>
  )
}
