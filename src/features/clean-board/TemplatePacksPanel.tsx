import { useState } from 'react'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_PACK_IDS,
  TEMPLATE_PACKS,
  getTemplatePack,
} from './templatePacks'
import type { ClassroomTemplateId, ClassroomTemplatePack } from './templatePacks'
import { getDisplayModeConfig } from './displayModes'
import { getBackgroundPreset } from './backgrounds'
import { getTimerPreset } from './timerPresets'

/**
 * DB-5A — teacher-only Template Pack picker.
 *
 * A compact "choose → preview → apply" control. Rendered only inside the Saved
 * Boards panel, which is itself edit-mode-only, so it never appears in present
 * mode. Applying a template produces normal board state; it owns no hidden
 * runtime.
 */
export function TemplatePacksPanel({
  onApply,
}: {
  onApply: (template: ClassroomTemplatePack) => void
}) {
  const [selectedId, setSelectedId] = useState<ClassroomTemplateId>(TEMPLATE_PACK_IDS[0])
  const template = getTemplatePack(selectedId)
  const displayMode = getDisplayModeConfig(template.displayModeId)
  const background = getBackgroundPreset(template.backgroundPresetId)
  const timer = getTimerPreset(template.timerPresetId)

  return (
    <div className="space-y-2 border-b border-slate-800 pb-3" data-template-packs-panel>
      <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
        Template Packs
      </h2>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value as ClassroomTemplateId)}
        className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200"
        data-template-select
      >
        {TEMPLATE_CATEGORIES.map((cat) => (
          <optgroup key={cat} label={TEMPLATE_CATEGORY_LABELS[cat]}>
            {TEMPLATE_PACK_IDS.filter((id) => TEMPLATE_PACKS[id].category === cat).map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_PACKS[id].name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div
        className="space-y-1 rounded-md border border-slate-800 bg-slate-900/40 p-2"
        data-template-summary
      >
        <p className="m-0 text-xs text-slate-400">{template.description}</p>
        <dl className="m-0 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
          <dt className="font-semibold text-slate-500">Mode</dt>
          <dd className="m-0">{displayMode.name}</dd>
          <dt className="font-semibold text-slate-500">Background</dt>
          <dd className="m-0">{background.name}</dd>
          <dt className="font-semibold text-slate-500">Timer</dt>
          <dd className="m-0">{timer.label}</dd>
          <dt className="font-semibold text-slate-500">Keep Awake</dt>
          <dd className="m-0">{template.keepAwakeRecommended ? 'Recommended' : 'Optional'}</dd>
        </dl>
      </div>
      <button
        type="button"
        onClick={() => onApply(template)}
        className="w-full rounded-md border border-emerald-600/60 bg-emerald-900/40 px-2 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-900/60"
        data-apply-template-button
      >
        Apply Template
      </button>
    </div>
  )
}
