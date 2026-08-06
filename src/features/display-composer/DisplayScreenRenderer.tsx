import type { AppMode } from '../../data/types'
import { resolveDisplayBackground } from './backgroundStyles'
import { ChecklistCardView } from './elements/ChecklistCardView'
import { ClockBlock } from './elements/ClockBlock'
import { MaterialsCardView } from './elements/MaterialsCardView'
import { TimerSlot } from './elements/TimerSlot'
import { WidgetDisplayOverlay } from './WidgetDisplayOverlay'
import type { DisplaySafeScreen } from './displaySafe'

interface DisplayScreenRendererProps {
  screen: DisplaySafeScreen
  /** 'display' = full projector view (no teacher controls); 'controlPreview' = teacher-side preview (timer controls visible). */
  variant: 'display' | 'controlPreview'
  className?: string
}

/**
 * Student-safe, projector-ready render of a composed classroom display screen.
 * Used both on /display (variant="display") and as the live preview inside
 * the Teacher Dock's Display Composer panel (variant="controlPreview").
 */
export function DisplayScreenRenderer({ screen, variant, className = '' }: DisplayScreenRendererProps) {
  const mode: AppMode = variant === 'display' ? 'display' : 'edit'
  const background = resolveDisplayBackground(screen.background)
  // Runtime-hardened (Phase 14F): a timer kind set without a timerId renders
  // nothing (TimerSlot returns null), so the layout must not reserve a column
  // for it either — otherwise the screen shows a blank gap where a timer was
  // expected. Can happen via a quick-start template or manual editing.
  const hasTimer = screen.timerWidget.kind !== 'none' && Boolean(screen.timerWidget.timerId)
  const hasCards = Boolean(screen.materialsCard || screen.checklistCard)
  const slotCount = [Boolean(screen.materialsCard), hasTimer, Boolean(screen.checklistCard)].filter(Boolean).length
  const gridColsClass = slotCount === 1 ? 'md:grid-cols-1' : slotCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'

  return (
    <div
      data-display-screen-id={screen.id}
      className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}
      style={{
        backgroundImage: background.backgroundImage,
        backgroundColor: background.backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Contrast scrim so text stays readable over any background image. */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/25 to-slate-950/55" />

      {/* Canvas widget overlay — student-safe rendering (display variant only) */}
      {variant === 'display' && <WidgetDisplayOverlay widgets={screen.widgets} />}

      <div className="relative flex h-full flex-col gap-3 p-4 md:gap-4 md:p-8">"@
      -- I'll actually do this differently, just update key layout areas.
        <header className="flex items-start justify-between gap-4">
          <h1 className="max-w-[75%] rounded-2xl bg-slate-950/80 px-6 py-3 text-4xl font-black leading-tight tracking-tight text-white shadow-xl backdrop-blur-sm md:text-6xl">
            {screen.title}
          </h1>
          {screen.showClock && <ClockBlock large />}
        </header>

        {screen.studentMessage && (
          <p className="max-w-4xl rounded-2xl bg-slate-950/40 px-5 py-3 text-xl font-semibold leading-snug text-white backdrop-blur-sm md:text-2xl">
            {screen.studentMessage}
          </p>
        )}

        <div className={`grid flex-1 min-h-0 grid-cols-1 gap-4 md:gap-6 ${gridColsClass}`}>
          {screen.materialsCard && (
            <MaterialsCardView card={screen.materialsCard} mode={mode} className="md:col-span-1" />
          )}

          {hasTimer && (
            <div className="flex min-h-0 flex-col justify-center md:col-span-1">
              <TimerSlot config={screen.timerWidget} mode={mode} className="w-full" />
            </div>
          )}

          {screen.checklistCard && (
            <ChecklistCardView card={screen.checklistCard} mode={mode} className="md:col-span-1" />
          )}
        </div>

        {!hasTimer && !hasCards && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-2xl font-semibold text-white/80">No cards added to this screen yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
