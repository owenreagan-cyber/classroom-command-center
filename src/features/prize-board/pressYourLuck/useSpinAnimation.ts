import { useEffect, useRef } from 'react'
import { prizeBoardAudio } from './audioManager'
import { getActiveSpinPath, setActiveSpinPath } from './pressYourLuckLogic'
import { highlightAtElapsed } from './spinEngine'
import { usePressYourLuckStore } from './pressYourLuckStore'

/** rAF-driven board scan — updates highlight via store, minimal re-renders. */
export function useSpinAnimation(): void {
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)

  const phase = usePressYourLuckStore((s) => s.phase)
  const spinStartTime = usePressYourLuckStore((s) => s.spinStartTime)
  const spinDurationMs = usePressYourLuckStore((s) => s.spinDurationMs)
  const finalTileId = usePressYourLuckStore((s) => s.finalTileId)
  const syncHighlight = usePressYourLuckStore((s) => s.syncHighlight)
  const completeSpin = usePressYourLuckStore((s) => s.completeSpin)
  const soundEnabled = usePressYourLuckStore((s) => s.soundEnabled)

  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'stopping') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    if (spinStartTime === null || finalTileId === null) return

    let path = getActiveSpinPath()
    if (path.length === 0) {
      path = [finalTileId]
      setActiveSpinPath(path)
    }

    const stoppingDuration = 800
    const effectiveDuration = phase === 'stopping' ? stoppingDuration : spinDurationMs

    const tick = (now: number) => {
      const elapsed = now - spinStartTime
      const highlight = highlightAtElapsed(path, elapsed, effectiveDuration)
      syncHighlight(highlight)

      if (soundEnabled && now - lastTickRef.current > 90) {
        prizeBoardAudio.spinTick(soundEnabled)
        lastTickRef.current = now
      }

      if (elapsed >= effectiveDuration) {
        syncHighlight(finalTileId)
        completeSpin()
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    if (soundEnabled && phase === 'spinning') {
      prizeBoardAudio.spinStart(soundEnabled)
    }

    rafRef.current = requestAnimationFrame(tick)

    const backupMs = (phase === 'stopping' ? 850 : spinDurationMs) + 100
    const backupTimer = setTimeout(() => {
      const currentPhase = usePressYourLuckStore.getState().phase
      if (currentPhase === 'spinning' || currentPhase === 'stopping') {
        syncHighlight(finalTileId)
        completeSpin()
      }
    }, backupMs)

    return () => {
      clearTimeout(backupTimer)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [phase, spinStartTime, spinDurationMs, finalTileId, syncHighlight, completeSpin, soundEnabled])
}
