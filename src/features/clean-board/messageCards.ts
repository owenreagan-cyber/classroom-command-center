import type {
  MessageCardConfig,
  MessageCardKind,
  MessageCardTextSize,
  MessageCardTone,
} from './types'

/**
 * DB-4C — Directions / Message Card widget presets + sanitization.
 *
 * A small, fixed set of classroom-safe presets. Each is pure data (a semantic
 * kind, a title, a plain-text message, a tone, a text size, and a checklist
 * flag). Message text is plain text only: no HTML, markdown, links, images, or
 * remote content.
 */

export const MESSAGE_CARD_KINDS: readonly MessageCardKind[] = [
  'doNow',
  'objective',
  'directions',
  'reminder',
  'transition',
  'exitTicket',
  'announcement',
]

export const MESSAGE_CARD_TONES: readonly MessageCardTone[] = [
  'neutral',
  'calm',
  'focus',
  'warning',
  'success',
]

export const MESSAGE_CARD_TEXT_SIZES: readonly MessageCardTextSize[] = [
  'small',
  'medium',
  'large',
]

export const MESSAGE_CARD_KIND_LABELS: Record<MessageCardKind, string> = {
  doNow: 'Do Now',
  objective: 'Objective',
  directions: 'Directions',
  reminder: 'Reminder',
  transition: 'Transition',
  exitTicket: 'Exit Ticket',
  announcement: 'Announcement',
}

export interface MessageCardPreset {
  cardKind: MessageCardKind
  title: string
  message: string
  tone: MessageCardTone
  textSize: MessageCardTextSize
  checklistStyle: boolean
}

export const MESSAGE_CARD_PRESETS: Record<MessageCardKind, MessageCardPreset> = {
  doNow: {
    cardKind: 'doNow',
    title: 'Do Now',
    message: '1. Take out your materials.\n2. Begin the first task.\n3. Work quietly.',
    tone: 'focus',
    textSize: 'medium',
    checklistStyle: true,
  },
  objective: {
    cardKind: 'objective',
    title: 'Objective',
    message: 'I can explain my thinking clearly and use evidence.',
    tone: 'calm',
    textSize: 'medium',
    checklistStyle: false,
  },
  directions: {
    cardKind: 'directions',
    title: 'Directions',
    message: 'Follow each step carefully. Raise your hand if you need help.',
    tone: 'focus',
    textSize: 'medium',
    checklistStyle: true,
  },
  reminder: {
    cardKind: 'reminder',
    title: 'Reminder',
    message: 'Use a quiet voice and stay focused.',
    tone: 'neutral',
    textSize: 'medium',
    checklistStyle: false,
  },
  transition: {
    cardKind: 'transition',
    title: 'Transition',
    message: 'Finish your sentence, put materials away, and wait for the next direction.',
    tone: 'warning',
    textSize: 'medium',
    checklistStyle: false,
  },
  exitTicket: {
    cardKind: 'exitTicket',
    title: 'Exit Ticket',
    message: 'Answer the question before you leave.',
    tone: 'success',
    textSize: 'medium',
    checklistStyle: false,
  },
  announcement: {
    cardKind: 'announcement',
    title: 'Announcement',
    message: "Check the board for today's important update.",
    tone: 'calm',
    textSize: 'large',
    checklistStyle: false,
  },
}

export const DEFAULT_MESSAGE_CARD_KIND: MessageCardKind = 'directions'

export function isMessageCardKind(v: unknown): v is MessageCardKind {
  return typeof v === 'string' && (MESSAGE_CARD_KINDS as readonly string[]).includes(v)
}

export function isMessageCardTone(v: unknown): v is MessageCardTone {
  return typeof v === 'string' && (MESSAGE_CARD_TONES as readonly string[]).includes(v)
}

export function isMessageCardTextSize(v: unknown): v is MessageCardTextSize {
  return typeof v === 'string' && (MESSAGE_CARD_TEXT_SIZES as readonly string[]).includes(v)
}

export function getMessageCardPreset(kind: MessageCardKind): MessageCardPreset {
  return MESSAGE_CARD_PRESETS[kind]
}

/** Build a default card config from the default preset. */
export function defaultMessageCardConfig(): MessageCardConfig {
  return { kind: 'messageCard', ...MESSAGE_CARD_PRESETS[DEFAULT_MESSAGE_CARD_KIND] }
}

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g
const SCRIPT_BLOCK_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi
const URL_RE = /\b(?:https?|ftp|file):\/\/[^\s]*/gi
const BARE_WWW_RE = /\bwww\.[^\s]*/gi

/** Strip C0/C1 control characters, keeping tab, newline, and carriage return. */
function stripControlChars(input: string): string {
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    if (c < 0x20 && c !== 9 && c !== 10 && c !== 13) continue
    if (c === 0x7f) continue
    if (c >= 0x80 && c <= 0x9f) continue
    out += input[i]
  }
  return out
}

/**
 * Neutralize message text to plain, student-safe prose.
 *
 * We render text via React (which escapes by construction), so nothing here can
 * execute. This strips obvious HTML/script markup, remote URLs, and control
 * characters so stored text stays clean and predictable. Ordinary math like
 * "x < 5" is preserved (only `<` immediately followed by a letter is treated as
 * a tag).
 */
export function sanitizePlainText(input: string, maxLength = 2000): string {
  const stripped = stripControlChars(input)
  return stripped
    .replace(SCRIPT_BLOCK_RE, '')
    .replace(HTML_TAG_RE, '')
    .replace(URL_RE, '')
    .replace(BARE_WWW_RE, '')
    .trim()
    .slice(0, maxLength)
}

/**
 * Whitelist-validate a message card config. Always recovers to a valid card
 * (unknown/private keys are dropped, invalid enums fall back to defaults), so a
 * single bad record can never reject a layout or leak private data.
 */
export function sanitizeMessageCardConfig(raw: unknown): MessageCardConfig {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const cardKind = isMessageCardKind(r.cardKind) ? r.cardKind : DEFAULT_MESSAGE_CARD_KIND
  return {
    kind: 'messageCard',
    title: sanitizePlainText(typeof r.title === 'string' ? r.title : '', 160),
    message: sanitizePlainText(typeof r.message === 'string' ? r.message : ''),
    cardKind,
    tone: isMessageCardTone(r.tone) ? r.tone : 'neutral',
    textSize: isMessageCardTextSize(r.textSize) ? r.textSize : 'medium',
    checklistStyle: r.checklistStyle === true,
  }
}
