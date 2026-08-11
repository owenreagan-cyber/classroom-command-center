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
      className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
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
        className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-500/80 hover:bg-slate-800/80 hover:text-slate-200 active:scale-[0.97]"
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
