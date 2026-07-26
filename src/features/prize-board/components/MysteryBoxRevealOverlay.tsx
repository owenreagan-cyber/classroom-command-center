import { useEffect } from 'react'
import { RARITY_LABELS } from '../rarityStyles'
import { prizeBoardAudio } from '../pressYourLuck/audioManager'
import { mysteryPhaseDuration } from '../pressYourLuck/mysteryReveal'
import type { MysteryRevealPhase } from '../pressYourLuck/types'
import { usePressYourLuckStore } from '../pressYourLuck/pressYourLuckStore'
import { usePrizeBoardStore } from '../prizeBoardStore'
import { getPrizeById } from '../prizeBank'

export function MysteryBoxRevealOverlay() {
  const mysteryPhase = usePressYourLuckStore((s) => s.mysteryPhase)
  const mysteryInnerPrizeId = usePressYourLuckStore((s) => s.mysteryInnerPrizeId)
  const soundEnabled = usePressYourLuckStore((s) => s.soundEnabled)
  const advanceReveal = usePressYourLuckStore((s) => s.advanceReveal)
  const prizeBank = usePrizeBoardStore((s) => s.prizeBank)
  const prizeOverrides = usePrizeBoardStore((s) => s.prizeOverrides)

  useEffect(() => {
    if (!mysteryPhase) return
    const duration = mysteryPhaseDuration(mysteryPhase)
    const timer = setTimeout(() => advanceReveal(), duration)
    return () => clearTimeout(timer)
  }, [mysteryPhase, advanceReveal])

  useEffect(() => {
    if (mysteryPhase === 'announce' && soundEnabled) {
      prizeBoardAudio.rareWin(soundEnabled)
    }
  }, [mysteryPhase, soundEnabled])

  if (!mysteryPhase) return null

  const inner = mysteryInnerPrizeId
    ? getPrizeById(mysteryInnerPrizeId, prizeBank, prizeOverrides)
    : undefined

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6">
      <MysteryContent phase={mysteryPhase} innerLabel={inner?.label} innerRarity={inner?.rarity} />
    </div>
  )
}

function MysteryContent({
  phase,
  innerLabel,
  innerRarity,
}: {
  phase: MysteryRevealPhase
  innerLabel?: string
  innerRarity?: string
}) {
  if (phase === 'announce') {
    return (
      <div className="animate-pulse text-center">
        <p className="text-3xl font-black uppercase tracking-widest text-purple-300 md:text-5xl">
          Mystery Box Found!
        </p>
      </div>
    )
  }

  if (phase === 'shake') {
    return (
      <div className="text-center">
        <div
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-purple-400 bg-purple-900/60 text-6xl shadow-[0_0_40px_rgba(168,85,247,0.5)]"
          style={{ animation: 'mystery-shake 0.4s ease-in-out infinite' }}
        >
          🎁
        </div>
        <p className="mt-6 text-xl font-bold text-purple-200">Opening…</p>
      </div>
    )
  }

  if (phase === 'select') {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-200">Selecting reward…</p>
        <div className="mt-4 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 animate-pulse rounded-full bg-purple-400"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-lg font-bold uppercase tracking-wider text-emerald-400">You got</p>
      <p className="mt-2 text-4xl font-black text-white md:text-6xl">{innerLabel ?? 'Surprise!'}</p>
      {innerRarity && (
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-amber-300">
          {RARITY_LABELS[innerRarity as keyof typeof RARITY_LABELS] ?? innerRarity}
        </p>
      )}
    </div>
  )
}
