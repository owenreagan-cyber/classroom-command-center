import { useEffect } from 'react'
import { prizeBoardAudio } from '../pressYourLuck/audioManager'
import { whammyPhaseDuration } from '../pressYourLuck/whammyState'
import type { WhammyPhase } from '../pressYourLuck/types'
import { usePressYourLuckStore } from '../pressYourLuck/pressYourLuckStore'

export function WhammyRevealOverlay() {
  const whammyPhase = usePressYourLuckStore((s) => s.whammyPhase)
  const whammyConfig = usePressYourLuckStore((s) => s.whammyConfig)
  const soundEnabled = usePressYourLuckStore((s) => s.soundEnabled)
  const advanceReveal = usePressYourLuckStore((s) => s.advanceReveal)

  useEffect(() => {
    if (!whammyPhase) return
    const duration = whammyPhaseDuration(whammyPhase)
    const timer = setTimeout(() => advanceReveal(), duration)
    return () => clearTimeout(timer)
  }, [whammyPhase, advanceReveal])

  useEffect(() => {
    if (!soundEnabled || !whammyPhase) return
    if (whammyPhase === 'alarm') prizeBoardAudio.whammyAlert(soundEnabled)
    if (whammyPhase === 'whammyAppear') prizeBoardAudio.whammyLaugh(soundEnabled)
  }, [whammyPhase, soundEnabled])

  if (!whammyPhase) return null

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${
      whammyPhase === 'alarm' ? 'animate-pulse bg-red-950/90' : 'bg-slate-950/95'
    }`}
    >
      <WhammyContent phase={whammyPhase} fakeRewardLabel={whammyConfig.fakeRewardLabel} />
    </div>
  )
}

function WhammyContent({ phase, fakeRewardLabel }: { phase: WhammyPhase; fakeRewardLabel: string }) {
  if (phase === 'fakeReward') {
    return (
      <div className="text-center">
        <p className="text-lg font-bold text-emerald-400">You won!</p>
        <p className="mt-2 text-4xl font-black text-white md:text-5xl">{fakeRewardLabel}</p>
      </div>
    )
  }

  if (phase === 'alarm') {
    return (
      <div className="text-center">
        <p className="text-5xl font-black uppercase tracking-widest text-red-400">⚠️ Alert!</p>
      </div>
    )
  }

  if (phase === 'whammyAppear') {
    return (
      <div className="text-center">
        <div
          className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 border-red-500 bg-red-900/80 text-8xl shadow-[0_0_60px_rgba(239,68,68,0.6)]"
          style={{ transform: 'scale(1)', animation: 'whammy-pop 0.6s ease-out' }}
        >
          👹
        </div>
      </div>
    )
  }

  if (phase === 'message') {
    return (
      <div className="text-center">
        <p className="text-5xl font-black uppercase tracking-widest text-red-400 md:text-7xl">Whammy!</p>
        <p className="mt-4 text-xl font-bold text-red-200 md:text-2xl">
          Your prize has been stolen!
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-slate-300">Better luck next spin!</p>
    </div>
  )
}
