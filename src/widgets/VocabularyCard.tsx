import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import type { AppMode, VocabularyContent, VocabularyEntry } from '../data/types'

interface VocabularyCardProps {
  content?: VocabularyContent
  mode: AppMode
  className?: string
  onContentChange: (content: VocabularyContent) => void
  onBeautify?: () => void
}

export function VocabularyCard({
  content,
  mode,
  className = '',
  onContentChange,
}: VocabularyCardProps) {
  if (!content) {
    return null
  }

  const { title, entries } = content

  // Convert structured entries to a string format for editing: "term: definition"
  const rawTextLines = entries.map((entry) => {
    if (entry.definition) {
      return `${entry.term}: ${entry.definition}`
    }
    return entry.term
  })

  const handleRawLinesChange = (lines: string[]) => {
    const newEntries: VocabularyEntry[] = lines.map((line) => {
      const parts = line.split(':')
      if (parts.length > 1) {
        return {
          term: parts[0].trim(),
          definition: parts.slice(1).join(':').trim(),
        }
      }
      return { term: line.trim() }
    }).filter(entry => entry.term.length > 0)

    onContentChange({ ...content, entries: newEntries })
  }

  return (
    <section className={`flex flex-col rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-sm shadow-slate-200/50 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          {title || 'Vocabulary'}
        </h2>
        {mode === 'edit' && (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-500/20">
            Saved Locally
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {mode === 'display' ? (
          <ul className="space-y-3">
            {entries.length === 0 ? (
              <li className="text-slate-400 italic">No vocabulary terms</li>
            ) : (
              entries.map((entry, idx) => (
                <li key={idx} className="leading-snug">
                  <span className="font-bold text-slate-900 text-lg">{entry.term}</span>
                  {entry.definition && (
                    <span className="text-slate-600 text-base ml-2">— {entry.definition}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        ) : (
          <div className="space-y-4">
            <EditableText
              mode={mode}
              label="Card Title"
              value={title}
              onChange={(val) => onContentChange({ ...content, title: val })}
            />
            <EditableList
              mode={mode}
              label="Vocabulary Terms"
              items={rawTextLines}
              onChange={handleRawLinesChange}
              helperText="One word per line. Use colon for short definitions (e.g. 'sum: the answer')."
            />
          </div>
        )}
      </div>
    </section>
  )
}
