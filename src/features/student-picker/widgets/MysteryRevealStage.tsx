import { useEffect, useReducer } from 'react'
import type { ScreenId } from '../../../data/types'
import { usePickerStore } from '../pickerStore'

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

export function MysteryRevealStage({ screenId }: MysteryRevealStageProps) {
  const classId = ['homeroom', 'math', 'reading'].includes(screenId) ? screenId : 'homeroom'
  const session = usePickerStore((s) => s.activeMysterySessions[classId])
  const students = usePickerStore((s) => s.students)
  const settings = usePickerStore((s) => s.settings)
  const advanceReveal = usePickerStore((s) => s.advanceMysteryReveal)
  const commitSession = usePickerStore((s) => s.commitMysterySession)

  const status = session?.status

  const [state, dispatch] = useReducer(poseReducer, { pose: 'hidden' })

  // Effect 1: Sync initial pose based on props (hidden, skip-animation -> revealed)
  useEffect(() => {
    if (!status || !status.startsWith('revealed-')) {
      dispatch({ type: 'SET_POSE', pose: 'hidden' })
    } else if (settings.skipAnimation) {
      dispatch({ type: 'SET_POSE', pose: 'revealed' })
    } else {
      dispatch({ type: 'SET_POSE', pose: 'animating' })
    }
  }, [status, settings.skipAnimation])

  // Effect 2: Manage the animation timer when in animating pose
  useEffect(() => {
    if (state.pose !== 'animating') return
    const duration = settings.reducedMotion ? 200 : 1500
    const timer = setTimeout(() => dispatch({ type: 'TIMER_FIRED' }), duration)
    return () => clearTimeout(timer)
  }, [state.pose, settings.reducedMotion])

  if (!session || session.status === 'active' || session.status === 'completed') {
    return null
  }

  const getStudentDetails = (slotId: 'high-flier-1' | 'high-flier-2' | 'star') => {
    const slot = session.slots[slotId]
    if (!slot || slot.status !== 'earned') return null
    const student = students.find((s) => s.id === slot.studentId)
    return { name: student?.displayName || 'Unknown', reason: slot.reason }
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
    activeRoleTitle = 'Star Student'
    activeDetails = getStudentDetails('star')
    isStar = true
  }

  const handleNext = () => {
    if (session.status === 'revealed-3') {
      commitSession(classId)
    } else {
      advanceReveal(classId)
    }
  }

  const showConfetti = isStar && !settings.reducedMotion && state.pose === 'revealed'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/98 backdrop-blur-xl p-8">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-spin-slow" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className={`mb-8 text-2xl font-black uppercase tracking-[0.4em] transition-all duration-700 ${
          state.pose === 'animating' ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        } ${isStar ? 'text-amber-400' : 'text-cyan-400'}`}>
          {activeRoleTitle}
        </h2>

        <div className={`transition-all duration-1000 ${
          state.pose === 'revealed' ? 'scale-100 opacity-100' : 'scale-50 opacity-0 blur-2xl'
        }`}>
          {activeDetails ? (
            <>
              <h1 className="mb-6 text-8xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                {activeDetails.name}
              </h1>
              {activeDetails.reason && (
                <p className="max-w-2xl text-3xl font-medium text-slate-300 italic mt-6 leading-relaxed">
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

        <div className={`mt-20 transition-all duration-500 delay-500 ${
          state.pose === 'revealed' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <button
            onClick={handleNext}
            className={`rounded-full px-12 py-4 text-xl font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isStar ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40'
            }`}
          >
            {session.status === 'revealed-3' ? 'Finish' : 'Next Reveal'}
          </button>
        </div>
      </div>
    </div>
  )
}
