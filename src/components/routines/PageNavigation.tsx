import type { VibePage, VibePageId, AppMode } from '../../data/types'

interface PageNavigationProps {
  pages: VibePage[]
  activePageId: VibePageId | null
  mode: AppMode
  onNavigateToPage: (pageId: VibePageId) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  className?: string
}

export function PageNavigation({
  pages,
  activePageId,
  mode,
  onNavigateToPage,
  onNavigatePrevious,
  onNavigateNext,
  className = '',
}: PageNavigationProps) {
  const currentIndex = pages.findIndex(p => p.id === activePageId)
  const activePage = pages[currentIndex] ?? null
  const isDisplay = mode === 'display'
  const total = pages.length

  if (isDisplay) return null

  return (
    <nav
      aria-label="Page navigation"
      className={`flex items-center gap-3 rounded-2xl border border-white/12 bg-slate-950/40 px-4 py-2 backdrop-blur-sm ${className}`}
    >
      <button
        type="button"
        onClick={onNavigatePrevious}
        disabled={currentIndex <= 0}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="flex flex-1 flex-col items-center min-w-0">
        <span className="text-xs font-semibold text-white/70">
          {activePage?.title ?? 'Page'}
        </span>
        <span className="text-[10px] text-white/50">
          {currentIndex + 1} of {total}
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1">
        {pages.map((page, idx) => (
          <button
            key={page.id}
            type="button"
            onClick={() => onNavigateToPage(page.id)}
            aria-label={`Go to page ${idx + 1}: ${page.title}`}
            aria-current={idx === currentIndex ? 'page' : undefined}
            className={`h-2 w-2 rounded-full transition ${
              idx === currentIndex
                ? 'bg-cyan-400 scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNavigateNext}
        disabled={currentIndex < 0 || currentIndex >= total - 1}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  )
}
