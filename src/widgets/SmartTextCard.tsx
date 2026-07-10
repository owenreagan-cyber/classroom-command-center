import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AppMode, SmartCardModel, SmartTextBlock, TextAlign } from '../data/types'
import { AutoFitText } from './AutoFitText'

interface SmartTextCardProps {
  model: SmartCardModel
  mode: AppMode
  className?: string
  minFontSize?: number
  maxFontSize?: number
  /** Prefer denser spacing / smaller title hierarchy. */
  dense?: boolean
  onBeautify?: () => void
  editSlot?: ReactNode
}

function countBulletItems(blocks: SmartTextBlock[]): number {
  return blocks.reduce((count, block) => count + (block.items?.length ?? 0), 0)
}

function compactModel(model: SmartCardModel, maxVisibleBullets = 4): {
  model: SmartCardModel
  hiddenCount: number
} {
  let remaining = maxVisibleBullets
  let hiddenCount = 0
  const blocks: SmartTextBlock[] = []

  for (const block of model.blocks) {
    if (block.kind !== 'bullets' || !block.items) {
      blocks.push(block)
      continue
    }

    if (remaining <= 0) {
      hiddenCount += block.items.length
      continue
    }

    if (block.items.length <= remaining) {
      blocks.push(block)
      remaining -= block.items.length
    } else {
      blocks.push({ ...block, items: block.items.slice(0, remaining) })
      hiddenCount += block.items.length - remaining
      remaining = 0
    }
  }

  return {
    model: {
      ...model,
      blocks,
      footer: hiddenCount > 0 ? undefined : model.footer,
    },
    hiddenCount,
  }
}

export function SmartTextCard({
  model,
  mode,
  className = '',
  minFontSize = 14,
  maxFontSize = 42,
  dense = false,
  onBeautify,
  editSlot,
}: SmartTextCardProps) {
  const align: TextAlign = model.align ?? 'left'
  const [overflows, setOverflows] = useState(false)
  const [forceCompact, setForceCompact] = useState(false)

  const bulletCount = countBulletItems(model.blocks)
  const shouldCompact =
    forceCompact || dense || overflows || bulletCount > 5

  const { displayModel, hiddenCount } = useMemo(() => {
    if (!shouldCompact || bulletCount <= 5) {
      return { displayModel: model, hiddenCount: 0 }
    }
    const compacted = compactModel(model, dense || overflows ? 4 : 5)
    return { displayModel: compacted.model, hiddenCount: compacted.hiddenCount }
  }, [model, shouldCompact, bulletCount, dense, overflows])

  const handleOverflow = useCallback((nextOverflows: boolean) => {
    setOverflows(nextOverflows)
    if (nextOverflows) setForceCompact(true)
  }, [])

  const fitKey = `${displayModel.title}|${displayModel.subtitle ?? ''}|${JSON.stringify(displayModel.blocks)}|${displayModel.footer ?? ''}|${align}|${shouldCompact}|${hiddenCount}`

  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/92 p-4 shadow-lg backdrop-blur-sm md:p-5 ${className}`}
    >
      {mode === 'edit' && (onBeautify || editSlot) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {onBeautify && (
            <button
              type="button"
              onClick={onBeautify}
              className="rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Beautify
            </button>
          )}
          {editSlot}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <AutoFitText
          minFontSize={minFontSize}
          maxFontSize={shouldCompact ? Math.min(maxFontSize, 34) : maxFontSize}
          align={align}
          fitKey={fitKey}
          compact={shouldCompact}
          onOverflowChange={handleOverflow}
        >
          <div
            className={`flex flex-col ${shouldCompact ? 'gap-[0.35em]' : 'gap-[0.45em]'}`}
          >
            <h2
              className="font-bold tracking-tight text-slate-900"
              style={{ fontSize: shouldCompact ? '1.15em' : '1.25em' }}
            >
              {displayModel.title}
            </h2>
            {displayModel.subtitle && (
              <p
                className="font-semibold uppercase tracking-[0.12em] text-slate-600"
                style={{ fontSize: '0.52em' }}
              >
                {displayModel.subtitle}
              </p>
            )}
            {displayModel.blocks.map((block, index) => {
              if (block.kind === 'bullets' && block.items) {
                return (
                  <ul
                    key={`b-${index}`}
                    className={shouldCompact ? 'space-y-[0.2em]' : 'space-y-[0.28em]'}
                    style={{ fontSize: '0.9em' }}
                  >
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-[0.4em] text-slate-800">
                        <span
                          className="mt-[0.35em] inline-block h-[0.32em] w-[0.32em] shrink-0 rounded-full bg-slate-800"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                )
              }

              if (block.kind === 'note' && block.text) {
                return (
                  <p
                    key={`n-${index}`}
                    className="text-slate-600"
                    style={{ fontSize: '0.58em', lineHeight: 1.3 }}
                  >
                    {block.text}
                  </p>
                )
              }

              return (
                <p
                  key={`p-${index}`}
                  className={
                    block.emphasis
                      ? 'font-bold text-slate-900'
                      : 'font-medium text-slate-800'
                  }
                  style={{
                    fontSize: block.emphasis
                      ? shouldCompact
                        ? '0.82em'
                        : '0.9em'
                      : '0.85em',
                  }}
                >
                  {block.text}
                </p>
              )
            })}
            {displayModel.footer && (
              <p className="text-slate-600" style={{ fontSize: '0.55em' }}>
                {displayModel.footer}
              </p>
            )}
            {hiddenCount > 0 && (
              <p
                className="font-semibold text-slate-700"
                style={{ fontSize: '0.7em' }}
                aria-label={`${hiddenCount} more items`}
              >
                + {hiddenCount} more
              </p>
            )}
          </div>
        </AutoFitText>
      </div>
    </article>
  )
}
