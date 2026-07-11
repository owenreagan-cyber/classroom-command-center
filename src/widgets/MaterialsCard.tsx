import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppMode, MaterialsLists } from '../data/types'
import { EditableMaterials } from '../components/editing/EditableMaterials'
import { boardCardShell, displayFontRange } from '../lib/displayLayout'
import { AutoFitText } from './AutoFitText'

interface MaterialsCardProps {
  title?: string
  materials: MaterialsLists
  mode: AppMode
  className?: string
  onBeautify?: () => void
  onMaterialsChange?: (materials: MaterialsLists) => void
}

interface SectionProps {
  heading: string
  items: string[]
  compact: boolean
  maxVisible: number
}

function MaterialSection({ heading, items, compact, maxVisible }: SectionProps) {
  const visible = items.slice(0, maxVisible)
  const hidden = Math.max(0, items.length - visible.length)
  const hasItems = visible.length > 0

  return (
    <div className="min-w-0">
      <h3
        className="font-bold uppercase tracking-[0.08em] text-slate-700"
        style={{ fontSize: compact ? '0.7em' : '0.78em' }}
      >
        {heading}
      </h3>
      {hasItems ? (
        <ul
          className={compact ? 'mt-[0.25em] space-y-[0.18em]' : 'mt-[0.3em] space-y-[0.25em]'}
          style={{ fontSize: '0.88em' }}
        >
          {visible.map((item) => (
            <li key={item} className="flex gap-[0.4em] text-slate-800">
              <span
                className="mt-[0.35em] inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-slate-800"
                aria-hidden="true"
              />
              <span className="min-w-0 break-normal">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="mt-[0.3em] rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-[0.7em] py-[0.45em] font-semibold text-slate-500"
          style={{ fontSize: '0.72em' }}
        >
          Add items in edit mode.
        </p>
      )}
      {hidden > 0 && (
        <p className="mt-[0.2em] font-semibold text-slate-700" style={{ fontSize: '0.68em' }}>
          + {hidden} more
        </p>
      )}
    </div>
  )
}

/**
 * Materials card with Have Out / Put Away. Uses its own autofit + optional
 * two-column compact layout so neither section pushes the other out of view.
 */
export function MaterialsCard({
  title = 'Materials',
  materials,
  mode,
  className = '',
  onBeautify,
  onMaterialsChange,
}: MaterialsCardProps) {
  const shellRef = useRef<HTMLElement>(null)
  const [wide, setWide] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const compact = overflows || materials.haveOut.length + materials.putAway.length > 6
  const useColumns = wide && (compact || materials.haveOut.length + materials.putAway.length >= 4)
  const maxVisible = compact ? (useColumns ? 5 : 4) : 8

  useEffect(() => {
    const node = shellRef.current
    if (!node) return
    const update = () => setWide(node.clientWidth >= 280)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleOverflow = useCallback((next: boolean) => {
    setOverflows(next)
  }, [])

  const fitKey = `${title}|${materials.haveOut.join(',')}|${materials.putAway.join(',')}|${useColumns}|${compact}|${maxVisible}`
  const fonts = displayFontRange(mode, 13, compact ? 30 : 36)

  return (
    <article ref={shellRef} className={`${boardCardShell(mode)} ${className}`}>
      {mode === 'edit' && (onBeautify || onMaterialsChange) && (
        <div className="mb-3 rounded-xl border border-cyan-200/70 bg-cyan-50/80 p-3 shadow-sm">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cyan-900">
            Edit student-facing materials
          </p>
          <div className="flex flex-col gap-3">
          {onBeautify && (
            <button
              type="button"
              onClick={onBeautify}
              className="w-fit rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Beautify
            </button>
          )}
          {onMaterialsChange && (
            <EditableMaterials
              mode={mode}
              materials={materials}
              onChange={onMaterialsChange}
            />
          )}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <AutoFitText
          minFontSize={fonts.minFontSize}
          maxFontSize={fonts.maxFontSize}
          align="left"
          fitKey={fitKey}
          compact={compact}
          onOverflowChange={handleOverflow}
        >
          <div className={`flex flex-col ${compact ? 'gap-[0.35em]' : 'gap-[0.45em]'}`}>
            <h2
              className="font-bold tracking-tight text-slate-900"
              style={{ fontSize: compact ? '1.1em' : '1.2em' }}
            >
              {title}
            </h2>
            <div className={useColumns ? 'grid grid-cols-2 gap-[0.7em]' : 'flex flex-col gap-[0.55em]'}>
              <MaterialSection
                heading="Have Out"
                items={materials.haveOut}
                compact={compact}
                maxVisible={maxVisible}
              />
              <MaterialSection
                heading="Put Away"
                items={materials.putAway}
                compact={compact}
                maxVisible={maxVisible}
              />
            </div>
          </div>
        </AutoFitText>
      </div>
    </article>
  )
}
