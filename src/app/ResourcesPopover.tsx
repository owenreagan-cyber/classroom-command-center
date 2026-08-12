import { useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { getResourcePresetMeta } from '../lib/resourcePresets'
import type { TeacherMaterialLink, Visibility } from '../data/types'

interface ResourcesPopoverProps {
  /** Routes to the old editor/studio surface — intentionally named
   *  "Studio" so the teacher knows they are leaving Teach Mode. */
  onOpenStudio: () => void
  screenLabel: string
  /** Open state is owned by the parent shell so it can close the sibling
   * Tools popover before opening this one — keeping the "single open
   * flyout at a time" guarantee even via keyboard activation. */
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const VISIBILITY_LABEL: Record<Visibility, { short: string; tone: string }> = {
  student: { short: '', tone: '' },
  teacherOnly: { short: 'Teacher only', tone: 'bg-amber-500/10 text-amber-400/80 border-amber-500/20' },
  hidden: { short: 'Hidden', tone: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
}

type ViewMode = 'list' | 'setup'

const RESOURCE_TYPES = [
  { key: 'slides', label: 'Slides', helper: 'Stage a classroom presentation for this block.' },
  { key: 'pdf', label: 'PDF / Worksheet', helper: 'Keep a worksheet or printable ready.' },
  { key: 'video', label: 'Video', helper: 'Queue a student-safe clip or preview.' },
  { key: 'notes', label: 'Teacher Notes', helper: 'Keep private notes available to you.' },
  { key: 'omni', label: 'OmniNote Package', helper: 'Prepare an annotated teaching canvas for iPad.' },
] as const

export function ResourcesPopover({
  onOpenStudio,
  screenLabel,
  isOpen,
  onOpenChange,
}: ResourcesPopoverProps) {
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const resourceLinks = useBoardStore((s) => s.todayPrep.resourceLinks)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const screenResources = useMemo(
    () => resourceLinks.filter((link) => link.screenId === activeScreen),
    [resourceLinks, activeScreen],
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200 active:scale-[0.97]"
      >
        Resources
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2.5 w-[340px] rounded-2xl border border-white/[0.08] bg-slate-900/98 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {/* ── Header ── */}
            <div className="border-b border-white/[0.05] px-4 py-3.5">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Resources
              </h4>
              <p className="mt-1 text-[13px] font-medium text-white/90">
                Active block:{' '}
                <span className="text-emerald-400/90">{screenLabel}</span>
              </p>
            </div>

            {/* ── Content ── */}
            <div className="px-4 py-3.5">
              {screenResources.length > 0 ? (
                <ResourceList
                  resources={screenResources}
                  onOpenStudio={onOpenStudio}
                  onOpenChange={onOpenChange}
                />
              ) : viewMode === 'setup' ? (
                <SetupView
                  selectedType={selectedType}
                  onSelectType={setSelectedType}
                  onBack={() => {
                    setViewMode('list')
                    setSelectedType(null)
                  }}
                  onDone={() => onOpenChange(false)}
                />
              ) : (
                <EmptyState
                  onPlanResource={() => setViewMode('setup')}
                />
              )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-white/[0.04] px-4 py-2.5">
              <p className="text-[10px] leading-relaxed text-slate-600">
                Resources are scoped to the current block. Linking workflow coming next.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Empty State — no routing, stays in Teach Mode ─── */

function EmptyState({ onPlanResource }: { onPlanResource: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        No resources linked to this block yet.
      </div>
      <p className="text-[12px] leading-relaxed text-slate-500">
        Plan what should be ready for this teaching moment.
      </p>
      <button
        type="button"
        onClick={onPlanResource}
        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-slate-300 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
      >
        Plan resource link
      </button>
    </div>
  )
}

/* ─── Setup View — resource linking setup stub ─── */

function SetupView({
  selectedType,
  onSelectType,
  onBack,
  onDone,
}: {
  selectedType: string | null
  onSelectType: (type: string) => void
  onBack: () => void
  onDone: () => void
}) {
  const selected = RESOURCE_TYPES.find((r) => r.key === selectedType)

  return (
    <div className="flex flex-col gap-4">
      {/* Eyebrow + Prompt */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Resource setup
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
          What should be ready for this block?
        </p>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-1.5">
        {RESOURCE_TYPES.map((res) => (
          <button
            key={res.key}
            type="button"
            onClick={() => onSelectType(res.key)}
            className={`rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 active:scale-[0.98] ${
              selectedType === res.key
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-slate-200'
            }`}
          >
            {res.label}
          </button>
        ))}
      </div>

      {/* Helper copy for selected type */}
      {selected && (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-slate-400">
            {selected.helper}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-200 active:scale-[0.98]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] font-medium text-emerald-300 transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-200 active:scale-[0.98]"
        >
          Done for now
        </button>
      </div>
    </div>
  )
}

/* ─── Resource List ─── */

function ResourceList({
  resources,
  onOpenStudio,
  onOpenChange,
}: {
  resources: TeacherMaterialLink[]
  onOpenStudio: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </ul>
      <div className="mt-1.5">
        <button
          type="button"
          onClick={() => {
            onOpenChange(false)
            onOpenStudio()
          }}
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-slate-400 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-200 active:scale-[0.98]"
        >
          Edit in Studio
        </button>
      </div>
    </div>
  )
}

/* ─── Resource Card ─── */

function ResourceCard({
  resource,
}: {
  resource: TeacherMaterialLink
}) {
  const presetMeta = resource.preset ? getResourcePresetMeta(resource.preset) : null
  const vis = resource.visibility ? VISIBILITY_LABEL[resource.visibility] : undefined

  return (
    <li className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-slate-300/80">
            {resource.label}
          </p>
          {resource.note && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
              {resource.note}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {presetMeta && (
          <span className="inline-flex items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {presetMeta.label}
          </span>
        )}
        {vis && vis.short && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${vis.tone}`}
          >
            {vis.short}
          </span>
        )}
      </div>
    </li>
  )
}
