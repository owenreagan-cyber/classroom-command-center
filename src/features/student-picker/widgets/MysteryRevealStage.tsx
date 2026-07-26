import { useEffect, useReducer } from 'react'
import type { ScreenId } from '../../../data/types'
import type { PickerPoolKey } from '../../roster/types'
import { usePickerStore } from '../pickerStore'
import type { MysterySession } from '../types'

type RevealPose = 'hidden' | 'animating' | 'revealed'

interface PoseState {
  pose: RevealPose
}

type PoseAction =
  | { type: 'SET_POSE'; pose: RevealPose }
  | { type: 'TIMER_FIRED' }

function poseReducer(state: PoseState, action: PoseAction): PoseState {
  switch (action.type) {
    case 'SET_POSE':
      return { pose: action.pose }
    case 'TIMER_FIRED':
      return { pose: 'revealed' }
    default:
      return state
  }
}

interface MysteryRevealStageProps {
  screenId: ScreenId
}

function poolKeysForScreen(screenId: ScreenId): PickerPoolKey[] {
  if (screenId === 'homeroom') return ['homeroom']
  if (screenId === 'math') return ['math']
  if (screenId === 'reading') return ['reading:RM4', 'reading:SM5', 'reading']
  return ['homeroom']
}

function findRevealSession(
  sessions: Record<string, MysterySession | null>,
  screenId: ScreenId,
): { poolKey: PickerPoolKey; session: MysterySession } | null {
  for (const poolKey of poolKeysForScreen(screenId)) {
    const session = sessions[poolKey]
    if (session && session.status.startsWith('revealed-')) {
      return { poolKey, session }
    }
  }
  return null
}

export function MysteryRevealStage({ screenId }: MysteryRevealStageProps) {
  const sessions = usePickerStore((s) => s.activeMysterySessions)
  const students = usePickerStore((s) => s.students)
  const settings = usePickerStore((s) => s.settings)
  const advanceReveal = usePickerStore((s) => s.advanceMysteryReveal)

  const match = findRevealSession(sessions, screenId)
  const session = match?.session
  const poolKey = match?.poolKey
  const status = session?.status

  const [state, dispatch] = useReducer(poseReducer, { pose: 'hidden' })

  useEffect(() => {
    if (!status || !status.startsWith('revealed-')) {
      dispatch({ type: 'SET_POSE', pose: 'hidden' })
    } else if (settings.skipAnimation) {
      dispatch({ type: 'SET_POSE', pose: 'revealed' })
    } else {
      dispatch({ type: 'SET_POSE', pose: 'animating' })
    }
  }, [status, settings.skipAnimation])

  useEffect(() => {
    if (state.pose !== 'animating') return
    const duration = settings.reducedMotion ? 200 : 1500
    const timer = setTimeout(() => dispatch({ type: 'TIMER_FIRED' }), duration)
    return () => clearTimeout(timer)
  }, [state.pose, settings.reducedMotion])

  if (!session || !poolKey || session.status === 'active' || session.status === 'completed') {
    return null
  }

  const getStudentDetails = (slotId: 'high-flier-1' | 'high-flier-2' | 'star') => {
    const slot = session.slots[slotId]
    if (!slot || slot.status !== 'earned') return null
    const student = students.find((s) => s.id === slot.studentId)
    return {
      name: student?.displayName || 'Unknown',
      reason: slot.reason,
      title: slot.assignedTitle,
    }
  }

  let activeRoleTitle = ''
  let activeDetails = null
  let isStar = false

  if (session.status === 'revealed-1') {
    activeRoleTitle = 'High Flier #1'
    activeDetails = getStudentDetails('high-flier-1')
  } else if (session.status === 'revealed-2') {
    activeRoleTitle = 'High Flier #2'
    activeDetails = getStudentDetails('high-flier-2')
  } else if (session.status === 'revealed-3') {
    activeRoleTitle = 'Mystery Star'
    activeDetails = getStudentDetails('star')
    isStar = true
  }

  const handleNext = () => {
    advanceReveal(poolKey)
  }

  const showConfetti = isStar && !settings.reducedMotion && state.pose === 'revealed'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/98 p-8 backdrop-blur-xl">
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="animate-spin-slow h-[200%] w-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <h2
          className={`mb-8 text-2xl font-black uppercase tracking-[0.4em] transition-all duration-700 ${
            state.pose === 'animating' ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
          } ${isStar ? 'text-amber-400' : 'text-cyan-400'}`}
        >
          {activeRoleTitle}
        </h2>

        <div
          className={`transition-all duration-1000 ${
            state.pose === 'revealed' ? 'scale-100 opacity-100' : 'scale-50 opacity-0 blur-2xl'
          }`}
        >
          {activeDetails ? (
            <>
              <h1 className="mb-6 text-8xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                {activeDetails.name}
              </h1>
              {activeDetails.title && (
                <p className="mb-4 text-2xl font-bold uppercase tracking-[0.3em] text-amber-300">
                  {activeDetails.title}
                </p>
              )}
              {activeDetails.reason && (
                <p className="mt-6 max-w-2xl text-3xl font-medium italic leading-relaxed text-slate-300">
                  "{activeDetails.reason}"
                </p>
              )}
            </>
          ) : (
            <h1 className="mb-6 text-6xl font-black text-slate-600">
              No student earned this spot today.
            </h1>
          )}
        </div>

        <div
          className={`mt-20 transition-all delay-500 duration-500 ${
            state.pose === 'revealed' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={handleNext}
            className={`rounded-full px-12 py-4 text-xl font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isStar
                ? 'bg-amber-600 shadow-amber-900/40 hover:bg-amber-500'
                : 'bg-cyan-600 shadow-cyan-900/40 hover:bg-cyan-500'
            }`}
          >
            {session.status === 'revealed-3' ? 'Finish' : 'Next Reveal'}
          </button>
        </div>
      </div>
    </div>
  )
}
