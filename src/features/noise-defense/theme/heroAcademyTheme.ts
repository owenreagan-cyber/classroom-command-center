import type { NoiseGameTheme } from './types'

/**
 * "Hero Academy" — the single built-in theme (design-doc §9, confirmed §0b
 * #4: no in-app theme picker in this build). Original geometric/abstract
 * shapes only, no official artwork/likenesses/logos anywhere (§9's
 * visual-originality constraint) -- names/roles/lines sourced verbatim from
 * `docs/design/noise-game/hero-academy-theme-pack.md`.
 *
 * Guardians (towers, spelling N-O-I-S-E front to back): Deku, Uraraka,
 * Todoroki, Iida, Bakugo. Villain: Shigaraki. Narrators: All Might (booming,
 * big triumphant beats), Aizawa (dry, administrative beats).
 */
export const HERO_ACADEMY_THEME: NoiseGameTheme = {
  id: 'hero-academy',
  displayName: 'Hero Academy Defense System',
  tagline: 'Five Guardians. One Line. Hold It Together.',
  towerNames: {
    N: 'Deku',
    O: 'Uraraka',
    I: 'Todoroki',
    S: 'Iida',
    E: 'Bakugo',
  },
  towerConditionLabel: {
    intact: 'Holding',
    damaged: 'Under Strain',
    fallen: 'Fallen',
  },
  protocolNames: {
    stealth: 'Stealth',
    patrol: 'Patrol',
    combat: 'Combat',
  },
  protocolTagline: {
    stealth: 'Silent — independent work',
    patrol: 'Whisper — partner work',
    combat: 'Discussion volume — active class work',
  },
  villainName: 'Shigaraki',
  pressureBand: {
    calm: {
      label: 'Holding Steady',
      textClass: 'text-emerald-50',
      bgClass:
        'bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.35),transparent_60%),linear-gradient(180deg,rgba(6,78,59,0.92),rgba(15,23,42,0.92))]',
      borderClass: 'border-emerald-300/55',
      glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.22)]',
    },
    building: {
      label: 'Building',
      textClass: 'text-amber-50',
      bgClass:
        'bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.35),transparent_60%),linear-gradient(180deg,rgba(120,53,15,0.92),rgba(15,23,42,0.92))]',
      borderClass: 'border-amber-300/55',
      glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    },
    warning: {
      label: 'Warning',
      textClass: 'text-orange-50',
      bgClass:
        'bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.4),transparent_60%),linear-gradient(180deg,rgba(124,45,18,0.94),rgba(15,23,42,0.94))]',
      borderClass: 'border-orange-300/60',
      glowClass: 'shadow-[0_0_28px_rgba(249,115,22,0.28)]',
    },
    critical: {
      label: 'Critical',
      textClass: 'text-rose-50',
      bgClass:
        'bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.45),transparent_60%),linear-gradient(180deg,rgba(127,29,29,0.96),rgba(15,23,42,0.96))]',
      borderClass: 'border-rose-300/65',
      glowClass: 'shadow-[0_0_32px_rgba(244,63,94,0.35)]',
    },
  },
  micNotStartedLabel: 'Start Noise Defense (enable microphone)',
  micDeniedTitle: 'Microphone unavailable',
  micDeniedBody: 'Noise Defense is paused — towers are frozen. Grant microphone access to resume.',
  jammerBadgeLabel: 'Comms Jammer Engaged',
  regroupTitle: 'Regroup',
  regroupBody: 'Every Guardian is down. Repair at least one tower to get back in the fight.',
  quotes: {
    protocolChange: {
      stealth: [
        { speaker: 'Iida', text: 'Protocol shift: Stealth. Full silence, effective immediately.' },
        { speaker: 'Aizawa', text: 'New protocol logged. Adjust accordingly.' },
        { speaker: 'Todoroki', text: "Quiet mode. Let's keep it steady." },
      ],
      patrol: [
        { speaker: 'Iida', text: 'Protocol shift: Patrol. Whisper volume only — hold the line.' },
        { speaker: 'Aizawa', text: 'New protocol logged. Adjust accordingly.' },
      ],
      combat: [
        { speaker: 'Iida', text: 'Protocol shift: Combat. Discussion volume authorized. Stay sharp.' },
        { speaker: 'Aizawa', text: 'New protocol logged. Adjust accordingly.' },
        { speaker: 'Uraraka', text: "Discussion time — let's make it count, not just make noise." },
      ],
    },
    warning: [
      { speaker: 'Shigaraki', text: "Mmm... it's building nicely..." },
      { speaker: 'Deku', text: "Pressure's climbing — we can still bring it back down." },
      { speaker: 'Bakugo', text: "Heads up! It's creeping toward the red!" },
      { speaker: 'Todoroki', text: "We're drifting off balance. A little quieter brings us back." },
    ],
    strike: [
      { speaker: 'Shigaraki', text: 'There it is. One line, weaker.' },
      { speaker: 'Iida', text: 'Impact registered. Formation holds — barely.' },
      { speaker: 'Bakugo', text: 'Tch — took a hit. Shake it off!' },
      { speaker: 'Deku', text: "That one landed... but we're still standing." },
    ],
    towerFall: [
      { speaker: 'Shigaraki', text: 'Crumble, crumble... one down.' },
      { speaker: 'Uraraka', text: "Oh no — we lost one. Let's not lose another." },
      { speaker: 'Todoroki', text: 'One post is down. The rest of us hold steady.' },
      { speaker: 'All Might', text: 'A setback, not the end! The next line stands ready!' },
      { speaker: 'Iida', text: 'Tower offline. Passing the front line forward.' },
    ],
    allTowersDown: [
      { speaker: 'Shigaraki', text: 'All of them... down. Was that so hard?' },
      { speaker: 'All Might', text: "Every line has fallen — but a hero academy doesn't stay down!" },
      { speaker: 'Deku', text: 'Okay. Deep breath. We rebuild from here.' },
      { speaker: 'Iida', text: 'All towers offline. Awaiting repair before we can hold again.' },
    ],
    recoveryBegin: [
      { speaker: 'Todoroki', text: "It's quiet now. Good. Let it heal." },
      { speaker: 'Uraraka', text: 'Ooh, I can feel it lightening up already!' },
      { speaker: 'Deku', text: 'This is working — keep it right here.' },
      { speaker: 'Aizawa', text: 'Quiet sustained. Recovery started.' },
    ],
    recoveryComplete: [
      { speaker: 'All Might', text: "Fully restored! That's what real teamwork sounds like — quiet, focused teamwork!" },
      { speaker: 'Bakugo', text: "Back to full. Don't get comfortable, though." },
      { speaker: 'Uraraka', text: 'Yes! Good as new!' },
      { speaker: 'Iida', text: 'Structural integrity: one hundred percent. Well executed.' },
    ],
    missionComplete: [
      { speaker: 'All Might', text: 'Mission complete! Every Guardian is proud of this room today!' },
      { speaker: 'Deku', text: "We did it — not by being perfect, just by looking out for each other." },
      { speaker: 'Iida', text: 'Mission log closed. A disciplined, well-run session.' },
      { speaker: 'Uraraka', text: 'That was a great one! See you next mission!' },
      { speaker: 'Bakugo', text: 'Not bad. Seriously — not bad.' },
    ],
    idle: [
      { speaker: 'Aizawa', text: 'Calibrating. Stay quiet a moment longer.' },
      { speaker: 'Aizawa', text: 'Baseline set. Standing by.' },
      { speaker: 'Todoroki', text: 'Reading the room before we begin.' },
      { speaker: 'Deku', text: 'Give us just a few seconds — figuring out what quiet sounds like in here today.' },
      { speaker: 'Iida', text: 'Systems idle. Awaiting mission start.' },
    ],
    jammerEngage: [
      { speaker: 'Iida', text: 'Comms Jammer active. Listening paused — as ordered.' },
      { speaker: 'Aizawa', text: 'Analysis paused. Nothing lost. Carry on.' },
    ],
    jammerDisengage: [
      { speaker: 'Iida', text: 'Comms restored. Resuming exactly where we left off.' },
      { speaker: 'Todoroki', text: "We're back. Same pressure, same line, same plan." },
    ],
  },
}
