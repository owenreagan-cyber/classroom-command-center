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
  'w-full rounded-lg border border-slate-300 bg-white/95 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200'

const labelClass =
  'mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600'

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
    <label className="block min-w-[14rem] flex-1">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          className={`${inputClass} resize-y leading-snug`}
        />
      ) : (
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {helperText && (
        <span className="mt-1 block text-[0.7rem] leading-snug text-slate-500">
          {helperText}
        </span>
      )}
    </label>
  )
}
