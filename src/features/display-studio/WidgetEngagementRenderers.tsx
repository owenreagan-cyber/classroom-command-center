import { useMemo } from 'react'
import type { CanvasWidget } from '../display-composer/types'
import { usePickerStore } from '../student-picker/pickerStore'
import { getMysteryDisplayStatus } from '../roster/displaySafe'
import { useHundredBoardStore } from '../hundred-board/hundredBoardStore'
import { usePressYourLuckStore } from '../prize-board/pressYourLuck/pressYourLuckStore'

export function MysteryStudentContent({ widget }: { widget: CanvasWidget }) {
  void widget // consumed by stores
  const sessions = usePickerStore((s) => s.activeMysterySessions)
  const activeSession = useMemo(() => {
    for (const key of Object.keys(sessions)) {
      const session = sessions[key]
      if (session?.status === 'active' || session?.status?.startsWith('revealed-')) return session
    }
    return null
  }, [sessions])
  const status = getMysteryDisplayStatus(activeSession)

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🌟</span>
      {status.isActive ? (
        <>
          <span className="text-[12px] font-semibold text-amber-200 mt-1.5">{status.statusLabel}</span>
          {status.hasHiddenDraw && <span className="text-[10px] text-slate-400 mt-1">Keep showing expectations</span>}
          {status.celebratingWin && <span className="text-[10px] text-amber-300 mt-1">Great job!</span>}
        </>
      ) : (
        <span className="text-[11px] text-slate-400 mt-1.5">No active Mystery Star</span>
      )}
    </div>
  )
}

export function RandomPickerContent({ widget }: { widget: CanvasWidget }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🎯</span>
      <span className="text-[12px] font-semibold text-slate-200 mt-1.5">{widget.label}</span>
      <span className="text-[10px] text-slate-400 mt-1">Ready to pick</span>
    </div>
  )
}

export function HundredBoardContent({ widget }: { widget: CanvasWidget }) {
  const completedCount = useHundredBoardStore((s) => s.completedCount)
  const activeTileNumber = useHundredBoardStore((s) => s.activeTileNumber)
  const tiles = useHundredBoardStore((s) => s.tiles)
  const hasBoard = tiles.some((t) => t.outcomeIndex !== null)

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🔢</span>
      {hasBoard ? (
        <>
          <span className="text-[12px] font-semibold text-slate-200 mt-1.5">{widget.label}</span>
          <span className="text-[11px] font-semibold text-cyan-300 mt-1">{completedCount}/100 revealed</span>
          {activeTileNumber && (
            <span className="text-[10px] text-cyan-200 mt-0.5">#{activeTileNumber} selected</span>
          )}
        </>
      ) : (
        <>
          <span className="text-[12px] font-semibold text-slate-200">{widget.label}</span>
          <span className="text-[10px] text-slate-400 mt-1">Generate a board to start</span>
        </>
      )}
    </div>
  )
}

export function PrizeBoardContent({ widget }: { widget: CanvasWidget }) {
  const phase = usePressYourLuckStore((s) => s.phase)
  const remainingSpins = usePressYourLuckStore((s) => s.remainingSpins)
  const isActive = phase !== 'idle'
  const phaseLabels: Record<string, string> = {
    idle: 'Ready to spin', ready: 'Ready to spin', spinning: 'Spinning...',
    stopping: 'Final spin...', revealing: 'Revealing prize', celebrating: 'Congrats!', miss: 'Good job!',
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🎁</span>
      <span className="text-[12px] font-semibold text-slate-200 mt-1.5">{widget.label}</span>
      {isActive ? (
        <>
          <span className="text-[11px] font-semibold text-amber-200 mt-1">{phaseLabels[phase] ?? phase}</span>
          <span className="text-[10px] text-slate-400 mt-1">{remainingSpins} spins left</span>
        </>
      ) : (
        <span className="text-[10px] text-slate-400 mt-1">Open Prize Board to start</span>
      )}
    </div>
  )
}

export function PressYourLuckContent({ widget }: { widget: CanvasWidget }) {
  void widget // consumed by stores
  const phase = usePressYourLuckStore((s) => s.phase)
  const isActive = phase !== 'idle'

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-xl">🎰</span>
      {isActive ? (
        <span className="text-[11px] font-semibold text-amber-200 mt-1.5">{phase}</span>
      ) : (
        <span className="text-[10px] text-slate-400 mt-1.5">Open Press Your Luck to start</span>
      )}
    </div>
  )
}
