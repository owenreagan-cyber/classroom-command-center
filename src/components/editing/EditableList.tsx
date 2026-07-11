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
    <div className="group block min-w-[16rem] flex-1">
      <label className="block">
        <span className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-500 group-focus-within:text-cyan-600 transition-colors">
          {label}
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(normalizeList(event.target.value))}
          onBlur={(event) => onChange(normalizeList(event.target.value))}
          placeholder={placeholder ?? 'One item per line'}
          rows={4}
          className="w-full resize-y rounded-xl border border-slate-300 bg-white/95 px-3 py-2.5 text-sm font-medium leading-snug text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
        />
      </label>
      <span className="mt-1.5 block px-1 text-[0.68rem] leading-snug text-slate-400">
        {helperText ?? 'Use one item per line. Blank lines are ignored on the student board.'}
      </span>
    </div>
  )
}
