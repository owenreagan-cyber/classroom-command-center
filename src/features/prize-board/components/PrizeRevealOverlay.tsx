import { useEffect } from 'react'
import { RARITY_LABELS } from '../rarityStyles'
import { prizeBoardAudio } from '../pressYourLuck/audioManager'
import type { RevealExperienceLevel, SpinOutcome } from '../pressYourLuck/types'
import { usePressYourLuckStore } from '../pressYourLuck/pressYourLuckStore'

const CELEBRATION_AUTO_DISMISS_MS = 4000

interface PrizeRevealOverlayProps {
  autoAdvance?: boolean
}

export function PrizeRevealOverlay({ autoAdvance = true }: PrizeRevealOverlayProps) {
  const phase = usePressYourLuckStore((s) => s.phase)
  const outcome = usePressYourLuckStore((s) => s.outcome)
  const revealExperience = usePressYourLuckStore((s) => s.revealExperience)
  const soundEnabled = usePressYourLuckStore((s) => s.soundEnabled)
  const advanceReveal = usePressYourLuckStore((s) => s.advanceReveal)
  const testCelebrationRarity = usePressYourLuckStore((s) => s.testCelebrationRarity)

  useEffect(() => {
    if (phase !== 'revealing' || !outcome || outcome.kind === 'mysteryBox' || outcome.kind === 'whammy') {
      return
    }
    if (soundEnabled && revealExperience) {
      playRevealSound(revealExperience, soundEnabled)
    }
    if (!autoAdvance) return
    const timer = setTimeout(() => advanceReveal(), getRevealDuration(revealExperience))
    return () => clearTimeout(timer)
  }, [phase, outcome, revealExperience, soundEnabled, advanceReveal, autoAdvance])

  useEffect(() => {
    if (phase !== 'celebrating') return
    if (soundEnabled && revealExperience) {
      playRevealSound(revealExperience, soundEnabled)
    }
    const timer = setTimeout(() => advanceReveal(), CELEBRATION_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [phase, revealExperience, soundEnabled, advanceReveal])

  if (phase === 'miss') {
    return (
      <MissOverlay autoAdvance={autoAdvance} onDismiss={advanceReveal} />
    )
  }

  if (phase === 'revealing' && outcome?.kind === 'student') {
    return (
      <StudentReveal outcome={outcome} experience={revealExperience ?? 'common'} />
    )
  }

  if (phase === 'celebrating' || (phase === 'revealing' && outcome?.kind === 'prize')) {
    const label = outcome?.prizeLabel ?? 'Prize!'
    const experience = revealExperience ?? 'common'
    return (
      <CelebrationReveal
        label={label}
        experience={experience}
        rarityLabel={outcome?.prizeRarity ? RARITY_LABELS[outcome.prizeRarity] : undefined}
        isTest={testCelebrationRarity !== null}
      />
    )
  }

  return null
}

function StudentReveal({
  outcome,
  experience,
}: {
  outcome: SpinOutcome
  experience: RevealExperienceLevel
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      <div className={`text-center ${experienceStyles(experience)}`}>
        <p className="text-lg font-bold uppercase tracking-wider text-cyan-400">Student Tile!</p>
        <p className="mt-2 text-4xl font-black text-white md:text-6xl">
          {outcome.studentDisplayName ?? 'Student'}
        </p>
      </div>
    </div>
  )
}

function CelebrationReveal({
  label,
  experience,
  rarityLabel,
  isTest,
}: {
  label: string
  experience: RevealExperienceLevel
  rarityLabel?: string
  isTest?: boolean
}) {
  const isPremiumUltraRare = experience === 'premiumUltraRare'
  const isLegendary = experience === 'legendary'
  const isVeryRare = experience === 'veryRare'
  const isHighTier = isPremiumUltraRare || isLegendary

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${
      isHighTier ? 'bg-gradient-to-b from-amber-950/95 to-slate-950/95' : 'bg-slate-950/92'
    }`}
    >
      {isHighTier && <ConfettiLayer />}
      <div
        className={`text-center ${experienceStyles(experience)}`}
        style={{
          animation: experience === 'common'
            ? 'prize-bounce 0.6s ease-out'
            : undefined,
        }}
      >
        {isTest && (
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Test Mode</p>
        )}
        {rarityLabel && (
          <p className={`font-bold uppercase tracking-widest ${
            isPremiumUltraRare ? 'text-rose-300 text-xl' : isLegendary ? 'text-amber-300 text-lg' : isVeryRare ? 'text-purple-300' : 'text-blue-300 text-sm'
          }`}
          >
            {rarityLabel}
          </p>
        )}
        <p className={`mt-2 font-black text-white ${
          isPremiumUltraRare ? 'text-6xl md:text-8xl' : isLegendary ? 'text-5xl md:text-7xl' : isVeryRare ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'
        }`}
        >
          {label}
        </p>
        {isVeryRare && (
          <div className="pointer-events-none absolute inset-0 rounded-full bg-purple-500/10 shadow-[inset_0_0_80px_rgba(168,85,247,0.3)]" />
        )}
      </div>
    </div>
  )
}

function ConfettiLayer() {
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-sm bg-amber-400"
          style={{
            left: `${(i * 17) % 100}%`,
            top: '-4%',
            opacity: 0.8,
            animation: `confetti-fall ${1.2 + (i % 5) * 0.2}s linear infinite`,
            animationDelay: `${(i % 8) * 0.1}s`,
            backgroundColor: ['#fbbf24', '#f472b6', '#34d399', '#60a5fa'][i % 4],
          }}
        />
      ))}
    </div>
  )
}

function experienceStyles(level: RevealExperienceLevel): string {
  switch (level) {
    case 'premiumUltraRare':
      return 'relative rounded-3xl border-4 border-rose-400 px-8 py-6 shadow-[0_0_80px_rgba(244,114,182,0.5)]'
    case 'legendary':
      return 'relative rounded-3xl border-4 border-amber-400 px-8 py-6 shadow-[0_0_60px_rgba(251,191,36,0.4)]'
    case 'veryRare':
      return 'relative rounded-2xl border-2 border-purple-400 px-6 py-4 shadow-[0_0_40px_rgba(168,85,247,0.35)]'
    case 'rare':
      return 'rounded-xl border-2 border-blue-400/60 px-5 py-3 shadow-[0_0_24px_rgba(96,165,250,0.3)]'
    default:
      return ''
  }
}

function playRevealSound(experience: RevealExperienceLevel, enabled: boolean): void {
  if (experience === 'premiumUltraRare' || experience === 'legendary') prizeBoardAudio.legendaryWin(enabled)
  else if (experience === 'veryRare' || experience === 'rare') prizeBoardAudio.rareWin(enabled)
  else prizeBoardAudio.commonWin(enabled)
}

function getRevealDuration(experience: RevealExperienceLevel | null): number {
  if (experience === 'premiumUltraRare') return 4500
  if (experience === 'legendary') return 3500
  if (experience === 'veryRare') return 2800
  if (experience === 'rare') return 2200
  return 1800
}

function MissOverlay({
  autoAdvance,
  onDismiss,
}: {
  autoAdvance: boolean
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!autoAdvance) return
    const timer = setTimeout(() => onDismiss(), 2500)
    return () => clearTimeout(timer)
  }, [autoAdvance, onDismiss])

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      <div className="text-center">
        <p className="text-4xl font-black text-slate-400 md:text-6xl">Empty!</p>
        <p className="mt-3 text-lg text-slate-500">No prize this time</p>
      </div>
    </div>
  )
}
