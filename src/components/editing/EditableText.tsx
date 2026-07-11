import type { ChangeEvent } from 'react'
import type { AppMode } from '../../data/types'

interface EditableTextProps {
  mode: AppMode
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  helperText?: string
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'

const labelClass =
  'mb-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-500'

export function EditableText({
  mode,
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  helperText,
}: EditableTextProps) {
  if (mode !== 'edit') return null

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value)
  }

  return (
    <div className="group block min-w-[16rem] flex-1">
      <label className="block">
        <span className={`${labelClass} group-focus-within:text-cyan-600 transition-colors`}>{label}</span>
        {multiline ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
            rows={3}
            className={`${inputClass} resize-y leading-snug`}
          />
        ) : (
          <input
            value={value}
            onChange={handleChange}
            placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
            className={inputClass}
          />
        )}
      </label>
      {helperText && (
        <span className="mt-1.5 block px-1 text-[0.68rem] leading-snug text-slate-400">
          {helperText}
        </span>
      )}
    </div>
  )
}
