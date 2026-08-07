import type { PickerPoolKey } from '../../roster/types'
import type { PrizeRarity } from '../types'
import { unlockAudio } from '../pressYourLuck/audioManager'
import { usePressYourLuckStore } from '../pressYourLuck/pressYourLuckStore'
import { SecretStopZone } from './SecretStopZone'

interface PressYourLuckControlsProps {
  poolKey: PickerPoolKey
  hasBoard: boolean
}

const TEST_RARITIES: PrizeRarity[] = ['common', 'rare', 'veryRare', 'legendary', 'premiumUltraRare']

export function PressYourLuckControls({ poolKey, hasBoard }: PressYourLuckControlsProps) {
  const phase = usePressYourLuckStore((s) => s.phase)
  const remainingSpins = usePressYourLuckStore((s) => s.remainingSpins)
  const maxSpins = usePressYourLuckStore((s) => s.maxSpins)
  const soundEnabled = usePressYourLuckStore((s) => s.soundEnabled)
  const prepareSpin = usePressYourLuckStore((s) => s.prepareSpin)
  const startSpin = usePressYourLuckStore((s) => s.startSpin)
  const requestStop = usePressYourLuckStore((s) => s.requestStop)
  const resetSpin = usePressYourLuckStore((s) => s.resetSpin)
  const skipReveal = usePressYourLuckStore((s) => s.skipReveal)
  const testCelebration = usePressYourLuckStore((s) => s.testCelebration)
  const setSoundEnabled = usePressYourLuckStore((s) => s.setSoundEnabled)
  const setRemainingSpins = usePressYourLuckStore((s) => s.setRemainingSpins)

  const isSpinning = phase === 'spinning' || phase === 'stopping'
  const isActive = phase !== 'idle'
  const canStart = hasBoard && !isSpinning && remainingSpins > 0
    && (phase === 'idle' || phase === 'ready' || phase === 'miss' || phase === 'celebrating')

  const handleStartSpin = () => {
    unlockAudio()
    prepareSpin(poolKey)
    startSpin(poolKey)
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-600/30 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Press Your Luck
        </p>
        <span className="text-[10px] font-bold text-slate-400">
          {remainingSpins}/{maxSpins} spins
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-control-id="start-spin"
          disabled={!canStart}
          onClick={handleStartSpin}
          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 hover:bg-amber-400 disabled:opacity-40"
        >
          Start Spin
        </button>

        <button
          type="button"
          data-control-id="reset-spin"
          disabled={!isActive && remainingSpins === maxSpins}
          onClick={() => {
            resetSpin()
            setRemainingSpins(maxSpins)
          }}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Reset Spin
        </button>

        <button
          type="button"
          data-control-id="skip-reveal"
          disabled={phase !== 'revealing' && phase !== 'celebrating' && phase !== 'miss'}
          onClick={skipReveal}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Skip Reveal
        </button>

        <button
          type="button"
          data-control-id="sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${
            soundEnabled
              ? 'bg-emerald-900/50 text-emerald-300'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          Sound {soundEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Remaining
        </label>
        <input
          type="number"
          min={0}
          max={99}
          value={remainingSpins}
          onChange={(e) => setRemainingSpins(Number(e.target.value) || 0)}
          className="w-16 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200"
        />
      </div>

      <details className="group">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Teacher Test Tools
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {TEST_RARITIES.map((rarity) => (
            <button
              key={rarity}
              type="button"
              data-control-id="test-celebration"
              onClick={() => testCelebration(rarity)}
              className="rounded-md border border-slate-700 px-2 py-1 text-[9px] font-bold uppercase text-slate-400 hover:bg-slate-800"
            >
              Test {rarity}
            </button>
          ))}
        </div>
      </details>

      {isSpinning && (
        <p className="text-[10px] text-slate-500">
          Tap bottom-right corner to stop early (invisible zone)
        </p>
      )}

      {isSpinning && <SecretStopZone onStop={requestStop} />}
    </div>
  )
}
