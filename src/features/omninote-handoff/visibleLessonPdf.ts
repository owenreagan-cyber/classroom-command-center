/** Visible letter-size PDF fixture for Saxon Math Lesson 2 package export (>5 KB). */

export const VISIBLE_SAXON_PDF_MARKERS = [
  'SAXON MATH LESSON 2',
  'VISIBLE OMNILESSON TEST',
  'If you can read this, PDF import is working.',
] as const

export const MIN_VISIBLE_LESSON_PDF_BYTES = 5120

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildContentStream(): string {
  const lines: Array<[string, number, number]> = [
    ['SAXON MATH LESSON 2', 36, 700],
    ['VISIBLE OMNILESSON TEST', 28, 640],
    ['If you can read this, PDF import is working.', 20, 590],
  ]

  const parts: string[] = [
    'q',
    '0.90 0.93 0.98 rg',
    '36 72 540 648 re',
    'f',
    'Q',
    '0.78 0.82 0.92 RG',
    '2 w',
    '40 76 532 640 re',
    'S',
    'BT',
  ]

  for (const [text, size, y] of lines) {
    parts.push(`/F1 ${size} Tf`, `72 ${y} Td`, `(${pdfEscape(text)}) Tj`, 'ET', 'BT')
  }
  parts.pop()
  parts.push(
    '% OmniNote visible Saxon fixture — classroom smoke-test padding below.',
  )
  while (parts.join('\n').length < 4800) {
    parts.push(
      '% Padding ensures this PDF exceeds 5 KB for validation and iPad rendering proof.',
    )
  }
  return parts.join('\n')
}

/** Build a visible Saxon lesson PDF suitable for iPad smoke testing. */
export function buildVisibleSaxonLessonPdf(): Buffer {
  const content = buildContentStream()
  const contentBytes = Buffer.from(content, 'utf8')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = Buffer.from('%PDF-1.4\n', 'ascii')
  const offsets: number[] = [0]

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length)
    pdf = Buffer.concat([
      pdf,
      Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, 'ascii'),
    ])
  }

  const xrefStart = pdf.length
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  pdf = Buffer.concat([pdf, Buffer.from(xref, 'ascii')])

  if (pdf.length < MIN_VISIBLE_LESSON_PDF_BYTES) {
    throw new Error(
      `Visible Saxon PDF too small: ${pdf.length} bytes (< ${MIN_VISIBLE_LESSON_PDF_BYTES})`,
    )
  }
  return pdf
}

/** @deprecated Use buildVisibleSaxonLessonPdf() — kept for callers expecting a string. */
export function visibleLessonPdf(): string {
  return buildVisibleSaxonLessonPdf().toString('binary')
}

export const VISIBLE_SAXON_LESSON_PDF = visibleLessonPdf()
