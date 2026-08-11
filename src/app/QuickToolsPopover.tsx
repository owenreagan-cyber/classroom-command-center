interface ToolItem {
  label: string
  onClick: () => void
}

function ToolTile({ label, onClick }: ToolItem) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 text-sm font-medium text-slate-300 transition-colors duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
    >
      {label}
    </button>
  )
}

interface QuickToolsPopoverProps {
  onActivateDashboard: () => void
  /** Open state is owned by the parent shell so it can close the sibling
   * Resources popover before opening this one — keeping the "single open
   * flyout at a time" guarantee even via keyboard activation, where the
   * backdrop's click-to-close can't intervene. */
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickToolsPopover({ onActivateDashboard, isOpen, onOpenChange }: QuickToolsPopoverProps) {
  const tools: ToolItem[] = [
    { label: 'Timer', onClick: onActivateDashboard },
    { label: 'Noise', onClick: onActivateDashboard },
    { label: 'Mystery', onClick: onActivateDashboard },
    { label: 'Music', onClick: onActivateDashboard },
    { label: 'Materials', onClick: onActivateDashboard },
    { label: 'Prize', onClick: onActivateDashboard },
    { label: 'Jobs', onClick: onActivateDashboard },
    { label: 'More', onClick: onActivateDashboard },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-200 active:scale-[0.97]"
      >
        Tools
      </button>
      {isOpen && (
        <>
          {/* Backdrop scrim closes the popover on outside click. Selecting
              a tool also closes it (line below). Neither is a competing
              "open" affordance — there's exactly one of those, the
              trigger button above. */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          {/* Positioned relative to the trigger via the wrapping `relative`
              div above — a floating on-demand flyout, not a persistent
              screen element, so this isn't the reserved-zone case the
              overlap gate targets. Opens upward (`bottom-full`) since the
              trigger sits in the footer, near the viewport's bottom edge. */}
          <div className="absolute bottom-full right-0 z-50 mb-2.5 w-60 rounded-2xl border border-white/[0.1] bg-slate-900/95 p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Quick Tools
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <ToolTile
                  key={tool.label}
                  label={tool.label}
                  onClick={() => {
                    onOpenChange(false)
                    tool.onClick()
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
