import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AppMode, SmartCardModel, SmartTextBlock, TextAlign } from '../data/types'
import { boardCardShell, displayFontRange } from '../lib/displayLayout'
import { shouldRenderForMode } from '../lib/visibility'
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

function hasStudentFacingContent(blocks: SmartTextBlock[]): boolean {
  return blocks.some((block) => {
    if (block.kind === 'bullets') {
      return (block.items?.length ?? 0) > 0
    }

    return Boolean(block.text?.trim())
  })
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
  const fonts = displayFontRange(mode, minFontSize, maxFontSize)
  const align: TextAlign = model.align ?? 'left'
  const [overflows, setOverflows] = useState(false)
  const [forceCompact, setForceCompact] = useState(false)

  const visibleBlocks = useMemo(
    () => model.blocks.filter((block) => shouldRenderForMode(block.visibility, mode)),
    [model.blocks, mode],
  )

  const visibleModel = useMemo(
    () => ({ ...model, blocks: visibleBlocks }),
    [model, visibleBlocks],
  )

  const bulletCount = countBulletItems(visibleModel.blocks)
  const shouldCompact =
    forceCompact || dense || overflows || bulletCount > 5

  const { displayModel, hiddenCount } = useMemo(() => {
    if (!shouldCompact || bulletCount <= 5) {
      return { displayModel: visibleModel, hiddenCount: 0 }
    }
    const compacted = compactModel(visibleModel, dense || overflows ? 4 : 5)
    return { displayModel: compacted.model, hiddenCount: compacted.hiddenCount }
  }, [visibleModel, shouldCompact, bulletCount, dense, overflows])

  const handleOverflow = useCallback((nextOverflows: boolean) => {
    setOverflows(nextOverflows)
    if (nextOverflows) setForceCompact(true)
  }, [])

  const hasContent = hasStudentFacingContent(displayModel.blocks)
  const fitKey = `${displayModel.title}|${displayModel.subtitle ?? ''}|${JSON.stringify(displayModel.blocks)}|${displayModel.footer ?? ''}|${align}|${shouldCompact}|${hiddenCount}|${hasContent}`

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      {mode === 'edit' && (onBeautify || editSlot) && (
        <div className="mb-3 rounded-xl border border-cyan-200/70 bg-cyan-50/80 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cyan-900">
              Edit student-facing text
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
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
        </div>
      )}

      <div className="min-h-0 flex-1">
        <AutoFitText
          minFontSize={fonts.minFontSize}
          maxFontSize={
            shouldCompact
              ? Math.min(fonts.maxFontSize, mode === 'display' ? 38 : 34)
              : fonts.maxFontSize
          }
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
            {!hasContent && (
              <p
                className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2 font-semibold text-slate-500"
                style={{ fontSize: '0.72em' }}
              >
                Add details in edit mode.
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
                const isTeacherNote = block.visibility === 'teacherOnly'
                return (
                  <p
                    key={`n-${index}`}
                    className={
                      isTeacherNote
                        ? 'rounded-lg border border-amber-300/50 bg-amber-50/90 px-2 py-1.5 text-amber-900'
                        : 'text-slate-600'
                    }
                    style={{ fontSize: '0.58em', lineHeight: 1.3 }}
                  >
                    {isTeacherNote && mode === 'edit' && (
                      <span className="mr-1 text-[0.85em] font-semibold uppercase tracking-wide">
                        Teacher only:
                      </span>
                    )}
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
