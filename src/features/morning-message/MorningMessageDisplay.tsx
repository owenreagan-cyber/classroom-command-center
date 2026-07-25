import type { AppMode } from '../../data/types'
import type { MorningMessageContent } from '../../data/morningMessage'
import {
  MORNING_MESSAGE_SECTION_META,
  MORNING_MESSAGE_SECTION_ORDER,
  enabledMorningMessageSections,
  resolveMorningMessageDate,
  sectionHasContent,
} from '../../data/morningMessage'
import { boardCardShell, displayFontRange } from '../../lib/displayLayout'
import { AutoFitText } from '../../widgets/AutoFitText'

interface MorningMessageDisplayProps {
  content: MorningMessageContent
  mode: AppMode
  className?: string
}

/** Student-facing Morning Message layout — no editor chrome. */
export function MorningMessageDisplay({
  content,
  mode,
  className = 'h-full',
}: MorningMessageDisplayProps) {
  const enabled = enabledMorningMessageSections(content)
  const isDisplay = mode === 'display'
  const density = enabled.length <= 3 ? 'sparse' : enabled.length >= 7 ? 'dense' : 'normal'

  if (enabled.length === 0) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-400/40 bg-slate-900/20 p-6 text-center text-slate-400 ${className}`}
      >
        <p className="text-sm">No morning message sections enabled.</p>
      </div>
    )
  }

  const greeting = content.text.greeting?.trim()
  const dateText = resolveMorningMessageDate(content)
  const closing = content.text.closing?.trim()
  const showGreeting = sectionHasContent('greeting', content)
  const showDate = sectionHasContent('date', content)
  const showClosing = sectionHasContent('closing', content)

  const bodySections = MORNING_MESSAGE_SECTION_ORDER.filter(
    (id) =>
      id !== 'greeting' &&
      id !== 'date' &&
      id !== 'closing' &&
      sectionHasContent(id, content),
  )

  return (
    <div
      className={`morning-message-display morning-message-display--${density} flex h-full min-h-0 flex-col ${className}`}
      data-testid="morning-message-display"
    >
      <div className={`${boardCardShell(mode)} morning-message-display__shell flex min-h-0 flex-1 flex-col overflow-hidden`}>
        {(showGreeting || showDate) && (
          <header
            className={`morning-message-display__header shrink-0 text-center ${
              density === 'sparse' ? 'pb-4 md:pb-5' : 'pb-2 md:pb-3'
            }`}
          >
            {showGreeting && greeting && (
              <AutoFitText
                minFontSize={isDisplay ? 42 : 32}
                maxFontSize={isDisplay ? 64 : 48}
                className="font-bold leading-tight text-slate-900"
                align="center"
              >
                {greeting}
              </AutoFitText>
            )}
            {showDate && (
              <p
                className={`mt-1 font-medium text-slate-600 ${displayFontRange(mode, 18, 24)}`}
              >
                {dateText}
              </p>
            )}
          </header>
        )}

        <div
          className={`morning-message-display__body grid min-h-0 flex-1 auto-rows-min gap-3 overflow-hidden md:gap-4 ${
            bodySections.length >= 4 ? 'morning-message-display__body--grid' : ''
          }`}
        >
          {bodySections.map((sectionId) => {
            const meta = MORNING_MESSAGE_SECTION_META.find((m) => m.id === sectionId)!
            if (meta.kind === 'bullets') {
              const items = (content.bullets[sectionId] ?? []).filter((item) => item.trim())
              if (items.length === 0) return null
              return (
                <section key={sectionId} className="morning-message-display__section min-h-0">
                  {meta.heading && (
                    <h2
                      className={`mb-1 font-semibold uppercase tracking-wide text-slate-500 ${displayFontRange(mode, 16, 20)}`}
                    >
                      {meta.heading}
                    </h2>
                  )}
                  <ul className={`space-y-1 ${displayFontRange(mode, 20, 28)}`}>
                    {items.map((item, i) => (
                      <li key={`${sectionId}-${i}`} className="flex gap-2 text-slate-800">
                        <span className="shrink-0 text-cyan-600" aria-hidden="true">
                          •
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            }

            const text = content.text[sectionId]?.trim()
            if (!text) return null
            const isHero = sectionId === 'mainMessage'
            return (
              <section
                key={sectionId}
                className={`morning-message-display__section min-h-0 ${
                  isHero ? 'morning-message-display__section--hero' : ''
                }`}
              >
                {meta.heading && (
                  <h2
                    className={`mb-1 font-semibold uppercase tracking-wide text-slate-500 ${displayFontRange(mode, 16, 20)}`}
                  >
                    {meta.heading}
                  </h2>
                )}
                <AutoFitText
                  minFontSize={isDisplay ? (isHero ? 28 : 20) : 18}
                  maxFontSize={isDisplay ? (isHero ? 40 : 28) : 24}
                  className={`leading-snug text-slate-800 ${isHero ? 'font-semibold' : ''}`}
                >
                  {text}
                </AutoFitText>
              </section>
            )
          })}
        </div>

        {showClosing && closing && (
          <footer
            className={`morning-message-display__footer shrink-0 border-t border-slate-200/80 text-center ${
              density === 'sparse' ? 'mt-4 pt-4 md:mt-5 md:pt-5' : 'mt-2 pt-2 md:mt-3 md:pt-3'
            }`}
          >
            <p className={`font-medium italic text-slate-700 ${displayFontRange(mode, 20, 28)}`}>
              {closing}
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}
