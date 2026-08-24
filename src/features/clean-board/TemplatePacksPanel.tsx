import { useState } from 'react'
import {
  TEMPLATE_PACK_IDS,
  getTemplatePreviewSummary,
  getTemplatesByCategory,
} from './templatePacks'
import type {
  ClassroomTemplateId,
  ClassroomTemplatePack,
  TemplatePreviewSummary,
} from './templatePacks'
import { getTheme } from './themes'

/**
 * DB-5B — polished teacher-facing Template Pack picker.
 *
 * Category-grouped preview cards with a CSS-only mini board thumbnail and a
 * compact "included pieces" chip row. Selecting a card expands a slightly more
 * detailed preview; applying stays an explicit button action (no accidental
 * apply on click). Rendered only inside the Saved Boards panel (edit-mode-only),
 * so it never appears in present mode. No new assets, remote URLs, or runtime.
 */

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 text-[9px] font-medium leading-none text-slate-300">
      {label}
    </span>
  )
}

/** CSS-only 16:9 mini board preview built from the template's background/theme. */
function TemplateThumbnail({
  summary,
  accent,
}: {
  summary: TemplatePreviewSummary
  accent: string
}) {
  const dark = summary.backgroundTextTone === 'dark'
  return (
    <div
      className="relative h-16 w-full overflow-hidden"
      style={{ background: summary.backgroundCss }}
      aria-hidden="true"
    >
      {/* heading bar */}
      <div
        className={`absolute left-2 top-2 h-1.5 w-1/3 rounded-full ${
          dark ? 'bg-slate-700/70' : 'bg-white/80'
        }`}
      />
      {/* message card */}
      <div
        className={`absolute left-2 top-5 h-6 w-2/5 rounded-sm border ${
          dark ? 'border-slate-700/40 bg-slate-700/20' : 'border-white/50 bg-white/25'
        }`}
        style={{ borderLeftWidth: 3, borderLeftColor: accent }}
      />
      {/* timer */}
      <div
        className={`absolute right-2 top-2 h-4 w-10 rounded-sm ${
          dark ? 'bg-slate-700/50' : 'bg-white/60'
        }`}
      />
      {/* spotify strip */}
      {summary.includeSpotify && (
        <div
          className={`absolute bottom-2 left-2 h-2 w-1/3 rounded-sm ${
            dark ? 'bg-slate-700/60' : 'bg-white/70'
          }`}
        />
      )}
    </div>
  )
}

function TemplateCard({
  template,
  selected,
  onSelect,
  onApply,
}: {
  template: ClassroomTemplatePack
  selected: boolean
  onSelect: () => void
  onApply: () => void
}) {
  const summary = getTemplatePreviewSummary(template)
  const accent = getTheme(template.themeId).accent
  return (
    <div
      className={`overflow-hidden rounded-lg border transition ${
        selected
          ? 'border-emerald-500/60 bg-slate-900/60'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
      }`}
      data-template-card={template.id}
      data-selected={selected || undefined}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full cursor-pointer text-left"
        data-template-card-select
      >
        <TemplateThumbnail summary={summary} accent={accent} />
        <div className="space-y-1 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-100">{template.name}</span>
            <span className="shrink-0 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {summary.categoryLabel}
            </span>
          </div>
          <p className="m-0 text-[11px] text-slate-400">{summary.shortLabel}</p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <Chip label={summary.displayModeName} />
            <Chip label={`${summary.timerDurationMinutes} min`} />
            <Chip label={summary.messageTitle} />
            {summary.includeSpotify && <Chip label="Spotify" />}
          </div>
        </div>
      </button>

      {selected && (
        <div className="space-y-1.5 border-t border-slate-800 p-2" data-template-detail>
          <p className="m-0 text-[11px] leading-snug text-slate-300">{summary.description}</p>
          <p className="m-0 text-[11px] leading-snug text-slate-500">
            <span className="font-semibold text-slate-400">When to use: </span>
            {summary.teacherUseCase}
          </p>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {summary.previewBullets.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                <span
                  className="mt-1 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                {b}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
            <span>Background: {summary.backgroundName}</span>
            <span>Keep awake: {summary.keepAwakeRecommended ? 'Recommended' : 'Optional'}</span>
          </div>
          <button
            type="button"
            onClick={onApply}
            className="min-h-[44px] w-full rounded-md border border-emerald-600/60 bg-emerald-900/40 px-2 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-900/60"
            data-apply-template-button
          >
            Apply Template
          </button>
        </div>
      )}
    </div>
  )
}

export function TemplatePacksPanel({
  onApply,
}: {
  onApply: (template: ClassroomTemplatePack) => void
}) {
  const [selectedId, setSelectedId] = useState<ClassroomTemplateId>(TEMPLATE_PACK_IDS[0])
  const groups = getTemplatesByCategory()

  return (
    <div className="space-y-2.5 border-b border-slate-800 pb-3" data-template-packs-panel>
      <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
        Template Packs
      </h2>
      <p className="m-0 text-[11px] text-slate-500">
        Pick a ready-made classroom setup, then apply it.
      </p>
      {groups.map((group) => (
        <div key={group.category} className="space-y-1.5" data-template-category={group.category}>
          <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
          </h3>
          {group.templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={t.id === selectedId}
              onSelect={() => setSelectedId(t.id)}
              onApply={() => onApply(t)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
