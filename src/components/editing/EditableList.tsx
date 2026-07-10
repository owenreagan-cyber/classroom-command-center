import type { AppMode } from '../../data/types'

interface EditableListProps {
  mode: AppMode
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  helperText?: string
}

const normalizeList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

export function EditableList({
  mode,
  label,
  items,
  onChange,
  placeholder,
  helperText,
}: EditableListProps) {
  if (mode !== 'edit') return null

  const value = items.join('\n')

  return (
    <label className="block min-w-[14rem] flex-1">
      <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(normalizeList(event.target.value))}
        onBlur={(event) => onChange(normalizeList(event.target.value))}
        placeholder={placeholder ?? 'One item per line'}
        rows={4}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white/95 px-3 py-2 text-sm font-medium leading-snug text-slate-900 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
      />
      <span className="mt-1 block text-[0.7rem] leading-snug text-slate-500">
        {helperText ?? 'Use one item per line. Blank lines are ignored on the student board.'}
      </span>
    </label>
  )
}
