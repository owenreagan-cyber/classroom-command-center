import { useState } from 'react'

interface ToolItem {
  label: string
  onClick: () => void
}

function ToolTile({ label, onClick }: ToolItem) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98]"
    >
      {label}
    </button>
  )
}

interface QuickToolsPopoverProps {
  onActivateDashboard: () => void
}

export function QuickToolsPopover({ onActivateDashboard }: QuickToolsPopoverProps) {
  const [open, setOpen] = useState(false)

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
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200 active:scale-[0.98]"
      >
        Tools
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Quick Tools
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((tool) => (
                <ToolTile
                  key={tool.label}
                  label={tool.label}
                  onClick={() => {
                    setOpen(false)
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
