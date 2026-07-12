import { EditableText } from '../components/editing/EditableText'
import { EditableList } from '../components/editing/EditableList'
import type { AppMode, LessonContent } from '../data/types'
import { SmartTextCard } from './SmartTextCard'

interface LessonCardProps {
  content?: LessonContent
  mode: AppMode
  className?: string
  onContentChange: (content: LessonContent) => void
  onBeautify?: () => void
}

export function LessonCard({
  content,
  mode,
  className = '',
  onContentChange,
  onBeautify,
}: LessonCardProps) {
  if (!content) {
    return null
  }

  const { title, objective, successCriteria, reminder } = content

  return (
    <SmartTextCard
      className={className}
      mode={mode}
      onBeautify={onBeautify}
      model={{
        title: title || "Today's Lesson",
        blocks: [
          {
            kind: 'paragraph',
            text: objective,
            emphasis: true,
          },
          ...(successCriteria.length > 0
            ? [
                {
                  kind: 'bullets' as const,
                  items: successCriteria,
                },
              ]
            : []),
          ...(reminder
            ? [
                {
                  kind: 'paragraph' as const,
                  text: `Remember: ${reminder}`,
                },
              ]
            : []),
        ],
      }}
      editSlot={
        <div className="space-y-4">
          <EditableText
            mode={mode}
            label="Card Title"
            value={title}
            onChange={(val) => onContentChange({ ...content, title: val })}
            helperText="e.g. Today's Goal, Learning Target"
          />
          <EditableText
            mode={mode}
            label="Lesson Objective / Focus"
            value={objective}
            onChange={(val) => onContentChange({ ...content, objective: val })}
            multiline
            helperText="What are we learning?"
          />
          <EditableList
            mode={mode}
            label="Success Criteria / I Can..."
            items={successCriteria}
            onChange={(items) =>
              onContentChange({ ...content, successCriteria: items })
            }
            helperText="One success criterion per line."
          />
          <EditableText
            mode={mode}
            label="Optional Reminder"
            value={reminder || ''}
            onChange={(val) => onContentChange({ ...content, reminder: val })}
            helperText="Student-safe reminder or rule for this lesson."
          />
        </div>
      }
    />
  )
}
