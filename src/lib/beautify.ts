import type { MaterialsLists, SmartCardModel, TextAlign } from '../data/types'

const TITLE_HINTS = new Set([
  'have out',
  'put away',
  'ready position',
  'do now',
  'reminders',
  'homeroom reminders',
  'materials',
  'arrival materials',
  'routine',
  'cleanup',
  'cleanup reminders',
])

const READY_STEPS = [
  'seated',
  'silent',
  'sitting up',
  'hands on desk',
  'alert',
  'eyes on me',
  'ready to learn',
]

const PHRASE_FORMS: Record<string, string> = {
  'morning folder': 'Morning folder',
  'power up packet': 'Power Up Packet',
  'reading book': 'Reading book',
  'everything else': 'Everything else',
  'ready to learn': 'Ready to learn',
  'hands on desk': 'Hands on desk',
  'eyes on me': 'Eyes on me',
  'sitting up': 'Sitting up',
}

/** Sentence-style capitalization: preserve known classroom phrases. */
export function cleanPhrase(value: string): string {
  const trimmed = value.replace(/^[-•*]\s*/, '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''

  const lower = trimmed.toLowerCase()
  if (PHRASE_FORMS[lower]) return PHRASE_FORMS[lower]

  // Preserve intentional Title Case / mixed case phrases.
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }

  // ALL CAPS or all lower → readable sentence case for short classroom phrases.
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeWhitespace(text: string): string {
  return collapseBlankLines(
    text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n'),
  )
}

function looksLikeTitle(line: string): boolean {
  const normalized = line.toLowerCase().replace(/[:.]+$/, '')
  return TITLE_HINTS.has(normalized) || (line.endsWith(':') && line.length < 36)
}

function uniquePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const key = item.toLowerCase()
    if (!item || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

/**
 * Only split a single line into multiple bullets when separators are explicit.
 * Never token-split phrases like "Morning folder".
 */
function splitExplicitList(line: string): string[] {
  const cleaned = line.replace(/^[-•*]\s*/, '').trim()
  if (!cleaned) return []

  if (/[;|]/.test(cleaned) || cleaned.includes(' • ')) {
    return cleaned
      .split(/\s*(?:[;|]|•)\s*/)
      .map(cleanPhrase)
      .filter(Boolean)
  }

  // Comma lists only when there are 2+ commas or "a, b, and c" pattern.
  const commaParts = cleaned.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean)
  if (commaParts.length >= 3) {
    return commaParts
      .map((part) => part.replace(/^and\s+/i, ''))
      .map(cleanPhrase)
      .filter(Boolean)
  }

  return [cleanPhrase(cleaned)]
}

function extractReadySteps(raw: string): string[] {
  const lower = raw.toLowerCase()
  return READY_STEPS.filter((step) => lower.includes(step)).map((step) =>
    cleanPhrase(step),
  )
}

export function beautifyBulletList(items: string[]): string[] {
  return uniquePreserveOrder(
    items
      .flatMap((item) => {
        const line = item.trim()
        if (!line) return []
        // Keep multi-word classroom phrases intact unless explicit separators.
        if (!/[;|]/.test(line) && !line.includes(' • ') && (line.match(/,/g) ?? []).length < 2) {
          return [cleanPhrase(line)]
        }
        return splitExplicitList(line)
      })
      .filter(Boolean),
  )
}

export function beautifyMaterialsLists(materials: MaterialsLists): MaterialsLists {
  return {
    haveOut: beautifyBulletList(materials.haveOut),
    putAway: beautifyBulletList(materials.putAway),
  }
}

export function beautifySingleInstruction(text: string): string {
  return cleanPhrase(normalizeWhitespace(text).replace(/\n+/g, ' '))
}

export function beautifyTitle(title: string): string {
  const cleaned = cleanPhrase(title.replace(/[:.]+$/, ''))
  return cleaned || title
}

/**
 * Conservative display-text beautify for freeform paste.
 * Prefer line-preserving cleanup over aggressive rewrite.
 */
export function beautifyDisplayText(raw: string): SmartCardModel {
  const text = normalizeWhitespace(raw)
  if (!text) {
    return { title: 'Display Text', blocks: [], align: 'left' }
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  let title = 'Display Text'
  let startIndex = 0

  if (lines.length > 0 && looksLikeTitle(lines[0])) {
    title = beautifyTitle(lines[0])
    startIndex = 1
  }

  const bodyLines = lines.slice(startIndex)
  const lowerAll = text.toLowerCase()

  // Materials-shaped freeform: only when both section headers exist.
  if (lowerAll.includes('have out') && lowerAll.includes('put away')) {
    const haveOut: string[] = []
    const putAway: string[] = []
    let mode: 'have' | 'put' | null = null

    for (const line of bodyLines) {
      const normalized = line.toLowerCase().replace(/[:.]+$/, '')
      if (normalized === 'have out') {
        mode = 'have'
        continue
      }
      if (normalized === 'put away') {
        mode = 'put'
        continue
      }
      if (mode === 'have') haveOut.push(...splitExplicitList(line))
      if (mode === 'put') putAway.push(...splitExplicitList(line))
    }

    if (haveOut.length || putAway.length) {
      return {
        title: title === 'Display Text' ? 'Materials' : title,
        align: 'left',
        blocks: [
          { kind: 'paragraph', text: 'Have Out', emphasis: true },
          { kind: 'bullets', items: uniquePreserveOrder(haveOut) },
          { kind: 'paragraph', text: 'Put Away', emphasis: true },
          { kind: 'bullets', items: uniquePreserveOrder(putAway) },
        ],
      }
    }
  }

  // Ready-position freeform only when the phrase appears and multiple steps match.
  if (lowerAll.includes('ready position')) {
    const steps = extractReadySteps(text)
    if (steps.length >= 2) {
      return {
        title: 'Ready Position',
        blocks: [{ kind: 'bullets', items: steps }],
        align: steps.length > 4 ? 'left' : 'center',
      }
    }
  }

  const bulletish = bodyLines.every(
    (line) =>
      /^[-•*]/.test(line) ||
      (!looksLikeTitle(line) && line.length < 80 && !/[.!?]$/.test(line)),
  )

  if (bulletish && bodyLines.length >= 2) {
    return {
      title,
      blocks: [
        {
          kind: 'bullets',
          items: beautifyBulletList(bodyLines),
        },
      ],
      align: 'left' as TextAlign,
    }
  }

  if (bodyLines.length === 1) {
    return {
      title,
      blocks: [{ kind: 'paragraph', text: beautifySingleInstruction(bodyLines[0]), emphasis: true }],
      align: bodyLines[0].length < 60 ? 'center' : 'left',
    }
  }

  return {
    title,
    blocks: bodyLines.map((line) =>
      looksLikeTitle(line)
        ? { kind: 'paragraph' as const, text: beautifyTitle(line), emphasis: true }
        : { kind: 'paragraph' as const, text: cleanPhrase(line) },
    ),
    align: 'left',
  }
}

export function smartCardToPlainText(model: SmartCardModel): string {
  const lines: string[] = [model.title]
  if (model.subtitle) lines.push(model.subtitle)

  for (const block of model.blocks) {
    if (block.kind === 'paragraph' && block.text) lines.push(block.text)
    if (block.kind === 'note' && block.text) lines.push(block.text)
    if (block.kind === 'bullets' && block.items) {
      for (const item of block.items) lines.push(`• ${item}`)
    }
  }

  if (model.footer) lines.push(model.footer)
  return lines.join('\n')
}
