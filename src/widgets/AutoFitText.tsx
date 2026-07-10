import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

interface AutoFitTextProps {
  children: ReactNode
  minFontSize?: number
  maxFontSize?: number
  className?: string
  style?: CSSProperties
  align?: 'left' | 'center'
  /** Bumps recalculation when parent content/theme changes. */
  fitKey?: string | number
  /** Compact spacing when content is dense. */
  compact?: boolean
  /** Called when content still overflows at min font size. */
  onOverflowChange?: (overflows: boolean) => void
}

/**
 * Scales text down until it fits the container. Lightweight binary search —
 * no external libs, no network.
 *
 * Does not silently hide overflow: reports overflow so parents can switch to
 * compact mode or show a "+ more" indicator.
 */
export function AutoFitText({
  children,
  minFontSize = 14,
  maxFontSize = 56,
  className = '',
  style,
  align = 'left',
  fitKey,
  compact = false,
  onOverflowChange,
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(maxFontSize)
  const [overflows, setOverflows] = useState(false)

  const fit = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const availableWidth = container.clientWidth
    const availableHeight = container.clientHeight
    if (availableWidth < 8 || availableHeight < 8) return

    let low = minFontSize
    let high = maxFontSize
    let best = minFontSize

    // Measure with content-sized height so scrollHeight reflects true need.
    content.style.height = 'auto'
    content.style.fontSize = `${maxFontSize}px`

    for (let i = 0; i < 16; i += 1) {
      const mid = (low + high) / 2
      content.style.fontSize = `${mid}px`

      const fits =
        content.scrollWidth <= availableWidth + 1 &&
        content.scrollHeight <= availableHeight + 1

      if (fits) {
        best = mid
        low = mid
      } else {
        high = mid
      }
    }

    const nextSize = Math.max(minFontSize, Math.floor(best * 10) / 10)
    content.style.fontSize = `${nextSize}px`
    const stillOverflows =
      content.scrollWidth > availableWidth + 1 ||
      content.scrollHeight > availableHeight + 1

    setFontSize(nextSize)
    setOverflows(stillOverflows)
    onOverflowChange?.(stillOverflows)
  }, [maxFontSize, minFontSize, onOverflowChange])

  useLayoutEffect(() => {
    fit()
  }, [fit, fitKey, children, compact])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      fit()
    })
    observer.observe(container)

    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [fit])

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 w-full ${className}`}
      style={style}
      data-overflows={overflows ? 'true' : 'false'}
    >
      <div
        ref={contentRef}
        className="w-full"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: compact ? 1.15 : 1.25,
          textAlign: align,
          // Prefer visible overflow detection over silent clipping.
          overflow: 'visible',
        }}
      >
        {children}
      </div>
    </div>
  )
}
