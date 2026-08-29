import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  useActiveStampProjection,
  useStampRedemptionBroadcast,
} from '../store/stampProjectionChannel'
import { STAMP_BALANCE_MAX, STAMP_TIER_TO_SYNTH_LEVEL } from '../store/stampLogic'
import type { StampMilestoneTier } from '../store/stampLogic'
import { playTierUnlock, playVictoryFanfare } from '../lib/audio/synthesizer'

const CELEBRATION_DURATION_MS: Record<StampMilestoneTier, number> = {
  25: 1400,
  50: 1400,
  75: 1400,
  100: 2600,
}

interface Celebration {
  tier: StampMilestoneTier
  /** The redemption event's own timestamp — used as the AnimatePresence key
   * so back-to-back redemptions of different tiers always re-trigger the
   * enter animation, even if React would otherwise treat it as an update. */
  key: number
}

/**
 * DB-Milestones — `/display`-only. Shows a live progress bar for whichever
 * single student is currently cast (via `useActiveStampProjection`), and —
 * the instant a redemption broadcast arrives for that exact student — plays
 * the Web Audio synthesizer fanfare and runs the celebration animation, both
 * from this page's own DOM/AudioContext so they come out of the projector's
 * speakers, not the teacher's laptop (Phase 4's "Audio Execution" invariant).
 * Renders nothing until a teacher explicitly casts a student.
 */
export function ProjectedStampCard() {
  const projection = useActiveStampProjection()
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  useStampRedemptionBroadcast((event) => {
    if (!projection || event.studentId !== projection.studentId) return
    if (event.tier === 100) {
      playVictoryFanfare()
    } else {
      playTierUnlock(STAMP_TIER_TO_SYNTH_LEVEL[event.tier])
    }
    setCelebration({ tier: event.tier, key: event.at })
  })

  useEffect(() => {
    if (!celebration) return
    const timer = setTimeout(() => setCelebration(null), CELEBRATION_DURATION_MS[celebration.tier])
    return () => clearTimeout(timer)
  }, [celebration])

  if (!projection) return null

  const pct = projection.nextTier
    ? Math.min(100, (projection.balance / projection.nextTier) * 100)
    : 100
  const isBigTier = celebration?.tier === 100

  return (
    <div className="absolute inset-x-0 top-8 z-40 flex justify-center" data-projected-stamp-card>
      <motion.div
        animate={
          celebration
            ? isBigTier
              ? { x: [0, -18, 16, -12, 10, -6, 4, 0], y: [0, 10, -8, 6, -4, 2, 0] }
              : { scale: [1, 1.12, 1, 1.1, 1] }
            : { scale: 1, x: 0, y: 0 }
        }
        transition={{ duration: isBigTier ? 0.6 : 1.1 }}
        className="relative w-[420px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/90 p-5 shadow-2xl"
        data-projected-stamp-card-tier={celebration?.tier}
      >
        {celebration && !isBigTier && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.8, 1.3, 1.5] }}
            transition={{ duration: 1.1 }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: '0 0 60px 20px rgba(34,211,238,0.55)' }}
            data-glow-aura
          />
        )}

        <div className="relative flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-slate-200">
            {projection.displayName}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {projection.balance}/{STAMP_BALANCE_MAX}
          </span>
        </div>

        <div className="relative mt-3 h-5 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>

        <p className="relative mt-1.5 text-right text-[11px] font-medium text-slate-500">
          {projection.nextTier
            ? `${projection.balance} / ${projection.nextTier} to next milestone`
            : 'Card complete!'}
        </p>

        <AnimatePresence>
          {isBigTier && (
            <motion.div
              key={celebration?.key}
              initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl"
              data-manga-impact-frame
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background:
                    'repeating-conic-gradient(from 0deg, rgba(250,204,21,0.9) 0deg 4deg, rgba(15,23,42,0) 4deg 12deg)',
                }}
              />
              <motion.span
                initial={{ scale: 0.4 }}
                animate={{ scale: [0.4, 1.3, 1] }}
                transition={{ duration: 0.5 }}
                className="relative text-6xl font-black italic text-amber-300 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
              >
                💥 100!
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ProjectedStampCard
