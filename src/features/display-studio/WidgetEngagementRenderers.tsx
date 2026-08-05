import { useMemo } from 'react'
import type { CanvasWidget } from '../display-composer/types'
import { usePickerStore } from '../student-picker/pickerStore'
import { getMysteryDisplayStatus } from '../roster/displaySafe'
import { useRandomNumberStore } from '../random-number/randomNumberStore'
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
    <div className="flex h-full flex-col items-center justify-center p-2 text-center">
      <span className="text-lg">🌟</span>
      {status.isActive ? (
        <>
          <span className="text-[10px] font-semibold text-amber-200 mt-1">{status.statusLabel}</span>
          {status.hasHiddenDraw && <span className="text-[8px] text-slate-400 mt-0.5">Keep showing expectations</span>}
          {status.celebratingWin && <span className="text-[8px] text-amber-300 mt-0.5">Great job!</span>}
        </>
      ) : (
        <span className="text-[9px] text-slate-400 mt-1">No active Mystery Star</span>
      )}
    </div>
  )
}

export function RandomPickerContent({ widget }: { widget: CanvasWidget }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-2 text-center">
      <span className="text-lg">🎯</span>
      <span className="text-[10px] font-semibold text-slate-200 mt-1">{widget.label}</span>
      <span className="text-[8px] text-slate-400 mt-0.5">Ready to pick</span>
    </div>
  )
}

export function HundredBoardContent({ widget }: { widget: CanvasWidget }) {
  const lastResult = useRandomNumberStore((s) => s.lastResult)
  const showOnDisplay = useRandomNumberStore((s) => s.showOnDisplay)

  return (
    <div className="flex h-full flex-col items-center justify-center p-2 text-center">
      <span className="text-lg">🔢</span>
      {lastResult !== null && showOnDisplay ? (
        <>
          <span className="text-2xl font-black text-cyan-300">{lastResult}</span>
          <span className="text-[8px] text-slate-400 mt-0.5">Current number</span>
        </>
      ) : (
        <>
          <span className="text-[10px] font-semibold text-slate-200">{widget.label}</span>
          <span className="text-[8px] text-slate-400 mt-0.5">Draw a number to show it here</span>
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
    <div className="flex h-full flex-col items-center justify-center p-2 text-center">
      <span className="text-lg">🎁</span>
      <span className="text-[10px] font-semibold text-slate-200 mt-1">{widget.label}</span>
      {isActive ? (
        <>
          <span className="text-[9px] font-semibold text-amber-200 mt-0.5">{phaseLabels[phase] ?? phase}</span>
          <span className="text-[8px] text-slate-400 mt-0.5">{remainingSpins} spins left</span>
        </>
      ) : (
        <span className="text-[8px] text-slate-400 mt-0.5">Open Prize Board to start</span>
      )}
    </div>
  )
}

export function PressYourLuckContent({ widget }: { widget: CanvasWidget }) {
  void widget // consumed by stores
  const phase = usePressYourLuckStore((s) => s.phase)
  const isActive = phase !== 'idle'

  return (
    <div className="flex h-full flex-col items-center justify-center p-2 text-center">
      <span className="text-lg">🎰</span>
      {isActive ? (
        <span className="text-[9px] font-semibold text-amber-200 mt-1">{phase}</span>
      ) : (
        <span className="text-[8px] text-slate-400 mt-1">Open Press Your Luck to start</span>
      )}
    </div>
  )
}
