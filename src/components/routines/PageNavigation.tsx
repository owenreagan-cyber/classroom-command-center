import { useEffect } from 'react'
import type { VibePage, VibePageId } from '../../data/types'

interface PageNavigationProps {
  pages: VibePage[]
  activePageId: VibePageId | null
  onNavigateToPage: (pageId: VibePageId) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  /** Hide all navigation chrome on student /display route. */
  showControls?: boolean
  className?: string
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function PageNavigation({
  pages,
  activePageId,
  onNavigateToPage,
  onNavigatePrevious,
  onNavigateNext,
  showControls = true,
  className = '',
}: PageNavigationProps) {
  const currentIndex = pages.findIndex((p) => p.id === activePageId)
  const activePage = pages[currentIndex] ?? null
  const total = pages.length
  const atStart = currentIndex <= 0
  const atEnd = currentIndex < 0 || currentIndex >= total - 1

  useEffect(() => {
    if (!showControls || total <= 1) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return
      if (isEditableTarget(event.target)) return
      if (event.target instanceof HTMLElement && event.target.closest('[data-widget-id]')) return

      if (event.key === 'ArrowLeft' && !atStart) {
        event.preventDefault()
        onNavigatePrevious()
      } else if (event.key === 'ArrowRight' && !atEnd) {
        event.preventDefault()
        onNavigateNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showControls, total, atStart, atEnd, onNavigatePrevious, onNavigateNext])

  if (!showControls || total <= 1) return null

  return (
    <nav
      aria-label="Page navigation"
      className={`flex items-center gap-3 rounded-2xl border border-white/12 bg-slate-950/40 px-4 py-2.5 backdrop-blur-sm ${className}`}
    >
      <button
        type="button"
        onClick={onNavigatePrevious}
        disabled={atStart}
        aria-label="Previous page"
        className="flex h-10 min-w-[2.5rem] items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/8 px-2 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="hidden text-sm font-semibold sm:inline">Previous</span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center">
        <span className="truncate text-sm font-bold text-white/90">
          {activePage?.title ?? 'Page'}
        </span>
        <span className="text-xs font-semibold text-white/55">
          {currentIndex + 1} of {total}
        </span>
      </div>

      <div className="hidden items-center gap-1.5 md:flex">
        {pages.map((page, idx) => (
          <button
            key={page.id}
            type="button"
            onClick={() => onNavigateToPage(page.id)}
            aria-label={`Go to page ${idx + 1}: ${page.title}`}
            aria-current={idx === currentIndex ? 'page' : undefined}
            className={`h-2.5 w-2.5 rounded-full transition ${
              idx === currentIndex
                ? 'scale-125 bg-cyan-400'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNavigateNext}
        disabled={atEnd}
        aria-label="Next page"
        className="flex h-10 min-w-[2.5rem] items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/8 px-2 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="hidden text-sm font-semibold sm:inline">Next</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  )
}
