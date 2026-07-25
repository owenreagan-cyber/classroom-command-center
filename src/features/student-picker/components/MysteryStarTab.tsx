import { useMemo, useState } from 'react'
import type { PickerPoolKey, ReadingSection } from '../../roster/types'
import {
  countEligibleStudents,
  getEligibleStudents,
  pickRandomEligible,
} from '../fairnessEngine'
import { usePickerStore } from '../pickerStore'
import type { PickerClassId } from '../types'
import { MysteryObservationPanel } from './MysteryObservationPanel'

interface MysteryStarTabProps {
  classId: PickerClassId
  poolKey: PickerPoolKey
  readingSection?: ReadingSection
}

export function MysteryStarTab({ classId, poolKey, readingSection }: MysteryStarTabProps) {
  const students = usePickerStore((s) => s.students)
  const history = usePickerStore((s) => s.fairnessHistory)
  const session = usePickerStore((s) => s.activeMysterySessions[poolKey])
  const startMysterySession = usePickerStore((s) => s.startMysterySession)
  const cancelMysterySession = usePickerStore((s) => s.cancelMysterySession)
  const resetPool = usePickerStore((s) => s.resetPool)
  const revealMysteryStep = usePickerStore((s) => s.revealMysteryStep)
  const canStartReveal = usePickerStore((s) => s.canStartReveal)
  const advanceMysteryReveal = usePickerStore((s) => s.advanceMysteryReveal)

  const [warning, setWarning] = useState<string | null>(null)

  const poolStudents = useMemo(
    () => getEligibleStudents(students, poolKey, history),
    [students, poolKey, history],
  )
  const availableCount = useMemo(
    () => countEligibleStudents(students, poolKey, history),
    [students, poolKey, history],
  )

  const handleDraw = () => {
    setWarning(null)
    if (session && session.status !== 'completed') {
      setWarning('An active hidden draw already exists. Cancel or finish it before drawing again.')
      return
    }

    const mysteryHistory = history.filter(
      (h) =>
        (h.poolKey ?? h.classId) === poolKey
        && (h.role === 'mystery-high-flier' || h.role === 'mystery-star'),
    )
    const picked = pickRandomEligible(students, poolKey, mysteryHistory, 3)

    if (picked.length < 3) {
      setWarning(
        `Only ${picked.length} eligible student${picked.length === 1 ? '' : 's'} available. Mark absences, reset the pool, or add roster entries.`,
      )
      return
    }

    startMysterySession(
      poolKey,
      classId,
      new Date().toISOString().split('T')[0],
      picked.map((p) => p.id),
      readingSection,
    )
  }

  const handleResetPool = () => {
    if (confirm('Reset draw history for this class pool? Students become eligible again.')) {
      resetPool(poolKey)
      setWarning(null)
    }
  }

  const sessionStatusLabel = !session
    ? 'No active hidden session'
    : session.status === 'active'
      ? 'Hidden trio ready — outcomes pending'
      : session.status === 'completed'
        ? 'Reveal complete — commit to history'
        : `Reveal step: ${session.status.replace('revealed-', 'High Flier / Star ')}`

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pool Status
          </p>
          <p className="mt-1 text-sm text-slate-200">{availableCount} students available</p>
          <p className="mt-1 text-xs text-slate-500">{sessionStatusLabel}</p>
        </div>

        {warning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            {warning}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDraw}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500"
          >
            Draw Mystery Students
          </button>
          <button
            type="button"
            onClick={handleResetPool}
            className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            Reset Pool
          </button>
        </div>

        {poolStudents.length > 0 && poolStudents.length < 3 && (
          <p className="text-xs text-rose-300">
            Need at least 3 present, active students. Currently {poolStudents.length}.
          </p>
        )}
      </div>
    )
  }

  const readyToReveal = canStartReveal(poolKey)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
            Active Hidden Session
          </span>
          {session.status === 'active' && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Discard this hidden draw without revealing?')) {
                  cancelMysterySession(poolKey)
                }
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400"
            >
              Cancel Session
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-200">{sessionStatusLabel}</p>
        <p className="mt-1 text-xs text-slate-500">{availableCount} students still in pool</p>
      </div>

      {warning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      )}

      <MysteryObservationPanel classId={classId} poolKey={poolKey} />

      <div className="space-y-2 border-t border-slate-700 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Reveal Controls
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={!readyToReveal || session.status !== 'active'}
            onClick={() => revealMysteryStep(poolKey, 'revealed-1')}
            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reveal High Flier #1
          </button>
          <button
            type="button"
            disabled={!['revealed-1', 'revealed-2', 'revealed-3', 'completed'].includes(session.status)}
            onClick={() => revealMysteryStep(poolKey, 'revealed-2')}
            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reveal High Flier #2
          </button>
          <button
            type="button"
            disabled={!['revealed-2', 'revealed-3', 'completed'].includes(session.status)}
            onClick={() => revealMysteryStep(poolKey, 'revealed-3')}
            className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reveal Mystery Star
          </button>
        </div>

        {readyToReveal && session.status === 'active' && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Begin sequential reveal? High Flier #1 first, then #2, then Mystery Star.')) {
                advanceMysteryReveal(poolKey)
              }
            }}
            className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-purple-500"
          >
            Start Full Reveal Sequence
          </button>
        )}

        <button
          type="button"
          onClick={handleResetPool}
          className="w-full rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
        >
          Reset Pool History
        </button>
      </div>
    </div>
  )
}
