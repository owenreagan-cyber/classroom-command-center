import type { Page } from '@playwright/test'

export const NOISE_GAME_STORAGE_KEY = 'classroom-command-center-noise-defense'

interface PersistedNoiseGameState {
  state?: {
    engine?: {
      status?: string
      baselineDb?: number | null
      missionStats?: { startedAtMs?: number | null }
    }
  }
}

/** Reads the engine's live state directly out of `noiseGameStore`'s
 * persisted localStorage. */
export async function readEngine(page: Page): Promise<{
  status: string | undefined
  baselineDb: number | null | undefined
  startedAtMs: number | null | undefined
}> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return { status: undefined, baselineDb: undefined, startedAtMs: undefined }
    const parsed = JSON.parse(raw) as PersistedNoiseGameState
    return {
      status: parsed.state?.engine?.status,
      baselineDb: parsed.state?.engine?.baselineDb,
      startedAtMs: parsed.state?.engine?.missionStats?.startedAtMs,
    }
  }, NOISE_GAME_STORAGE_KEY)
}
