import type { TowerCondition, TowerId, VoiceProtocol } from '../types'

/**
 * A theme is pure presentation data -- names, colors, flavor quotes. The
 * engine (`engine.ts`) never imports from here and knows nothing about
 * "Hero Academy" or any other skin; HUD/control components read a theme
 * object and render with it. Single built-in theme, no in-app picker, for
 * this build (design-doc §0b #4/§9) -- this interface stays picker-ready for
 * later without building that UI now.
 */
export interface BandVisual {
  label: string
  textClass: string
  bgClass: string
  borderClass: string
  glowClass: string
}

/** A speaker + line from the theme pack's line bank (fresh, original
 * writing -- never a source-material quote). */
export interface ThemeQuote {
  speaker: string
  text: string
}

/** Every narrative moment the engine can fire a speech-bubble line for
 * (design-doc §9 revision: more event categories than Stage 1's plain
 * hero/villain pool, including the recovery-begin/complete split, protocol
 * changes, mission complete, idle/calibrating, and the jammer). */
export interface ThemeQuoteBank {
  protocolChange: Record<VoiceProtocol, ThemeQuote[]>
  warning: ThemeQuote[]
  strike: ThemeQuote[]
  towerFall: ThemeQuote[]
  allTowersDown: ThemeQuote[]
  recoveryBegin: ThemeQuote[]
  recoveryComplete: ThemeQuote[]
  missionComplete: ThemeQuote[]
  idle: ThemeQuote[]
  jammerEngage: ThemeQuote[]
  jammerDisengage: ThemeQuote[]
}

export interface NoiseGameTheme {
  id: string
  displayName: string
  /** One-line label under the HUD title, e.g. "HERO ACADEMY DEFENSE SYSTEM". */
  tagline: string
  towerNames: Record<TowerId, string>
  towerConditionLabel: Record<TowerCondition, string>
  protocolNames: Record<VoiceProtocol, string>
  protocolTagline: Record<VoiceProtocol, string>
  villainName: string
  /** Visual treatment keyed by pressure band, for the meter/HUD chrome --
   * "calm" (low pressure) through "critical" (pressure approaching a strike). */
  pressureBand: Record<'calm' | 'building' | 'warning' | 'critical', BandVisual>
  micDeniedTitle: string
  micDeniedBody: string
  micNotStartedLabel: string
  jammerBadgeLabel: string
  regroupTitle: string
  regroupBody: string
  quotes: ThemeQuoteBank
}
