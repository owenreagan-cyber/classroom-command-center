import type { MessageCardConfig, MessageCardKind, MessageCardTextSize, MessageCardTone } from './types'
import {
  MESSAGE_CARD_KINDS,
  MESSAGE_CARD_KIND_LABELS,
  MESSAGE_CARD_TEXT_SIZES,
  MESSAGE_CARD_TONES,
  getMessageCardPreset,
} from './messageCards'

/**
 * DB-4C — teacher-only message card editor (edit mode only).
 *
 * Compact controls for the selected message card: card type (applies a preset),
 * title, message, tone, text size, and checklist style. Never rendered in
 * present mode; the parent gates it behind edit mode + message-card selection.
 */

const field =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'
const label = 'text-[10px] font-semibold uppercase tracking-wide text-slate-500'
const segBtn = 'rounded-md px-2 py-1 text-xs font-semibold transition'
const segActive = 'border-cyan-400 bg-slate-800 text-white'
const segIdle = 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700'

const TONE_ACCENTS: Record<MessageCardTone, string> = {
  neutral: '#94a3b8',
  calm: '#34d399',
  focus: '#38bdf8',
  warning: '#fbbf24',
  success: '#22c55e',
}

interface MessageCardTeacherPanelProps {
  config: MessageCardConfig
  onChange: (next: MessageCardConfig) => void
}

export function MessageCardTeacherPanel({ config, onChange }: MessageCardTeacherPanelProps) {
  const applyKind = (cardKind: MessageCardKind) => {
    onChange({ ...config, ...getMessageCardPreset(cardKind) })
  }

  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-800 bg-slate-900/40 p-3"
      data-message-card-panel
    >
      <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
        Message Card
      </h2>

      <div className="space-y-1">
        <label className={label} htmlFor="mc-kind">
          Card type
        </label>
        <select
          id="mc-kind"
          className={field}
          value={config.cardKind}
          onChange={(e) => applyKind(e.target.value as MessageCardKind)}
          data-message-card-kind
        >
          {MESSAGE_CARD_KINDS.map((k) => (
            <option key={k} value={k}>
              {MESSAGE_CARD_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={label} htmlFor="mc-title">
          Title
        </label>
        <input
          id="mc-title"
          className={field}
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="Title"
          data-message-card-title
        />
      </div>

      <div className="space-y-1">
        <label className={label} htmlFor="mc-message">
          Message
        </label>
        <textarea
          id="mc-message"
          className={`${field} min-h-28 resize-y`}
          value={config.message}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder="Type the message… (plain text, one idea per line)"
          data-message-card-message
        />
      </div>

      <div className="space-y-1">
        <span className={label}>Tone</span>
        <div className="flex flex-wrap gap-1.5">
          {MESSAGE_CARD_TONES.map((tone) => {
            const active = config.tone === tone
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ ...config, tone })}
                className={`${segBtn} flex items-center gap-1.5 border capitalize ${
                  active ? segActive : segIdle
                }`}
                data-message-card-tone={tone}
                data-active={active || undefined}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TONE_ACCENTS[tone] }}
                />
                {tone}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <span className={label}>Text size</span>
        <div className="flex gap-1.5">
          {MESSAGE_CARD_TEXT_SIZES.map((size) => {
            const active = config.textSize === size
            return (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...config, textSize: size as MessageCardTextSize })}
                className={`${segBtn} flex-1 border capitalize ${
                  active ? segActive : segIdle
                }`}
                data-message-card-text-size={size}
                data-active={active || undefined}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
        <input
          type="checkbox"
          checked={config.checklistStyle}
          onChange={(e) => onChange({ ...config, checklistStyle: e.target.checked })}
          data-message-card-checklist
        />
        Checklist style
      </label>
    </aside>
  )
}
