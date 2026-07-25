import type { NowShowingDisplayInfo } from '../../lib/nowShowing'

interface NowShowingDisplayLabelProps {
  info: NowShowingDisplayInfo
}

/** Student-safe Now Showing badge — label and preset text only; no URLs or controls. */
export function NowShowingDisplayLabel({ info }: NowShowingDisplayLabelProps) {
  return (
    <div
      className="now-showing-display inline-flex max-w-[min(100%,42rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-cyan-300/45 bg-slate-950/72 px-4 py-2.5 text-center shadow-lg backdrop-blur-md md:px-5 md:py-3"
      data-testid="now-showing-display"
      role="status"
      aria-label={`Now Showing: ${info.label}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/85 md:text-xs">
        Now Showing
      </span>
      <span className="text-base font-bold leading-tight text-white md:text-lg lg:text-xl">
        {info.label}
      </span>
      <span className="rounded-md border border-slate-500/60 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 md:text-[11px]">
        {info.presetLabel}
      </span>
    </div>
  )
}
