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
   * flyout at a time" guarantee even via keyboard activation. */
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2.5 w-60 rounded-2xl border border-white/[0.08] bg-slate-900/98 p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
