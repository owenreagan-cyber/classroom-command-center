import fs from 'fs'
import path from 'path'
import type { OmniNoteLessonHandoffPlan } from './types'

const DEFAULT_SYNTHETIC_PDF = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>endobj
trailer<< /Size 4 /Root 1 0 R >>
startxref
149
%%EOF`

/** Write export package JSON + synthetic sibling PDFs for local handoff testing. */
export function writeHandoffPackageToDisk(
  plan: OmniNoteLessonHandoffPlan,
  options?: { syntheticPdf?: string },
): string[] {
  const packageDir = path.dirname(plan.localPackagePath)
  fs.mkdirSync(packageDir, { recursive: true })
  fs.writeFileSync(plan.localPackagePath, plan.packageJson, 'utf8')

  const written = [plan.localPackagePath]
  const pdfTemplate = options?.syntheticPdf ?? DEFAULT_SYNTHETIC_PDF

  for (const resource of plan.package.resources) {
    if (resource.file.toLowerCase().endsWith('.pdf')) {
      const resourcePath = path.join(packageDir, resource.file)
      if (!fs.existsSync(resourcePath)) {
        fs.writeFileSync(resourcePath, pdfTemplate, 'utf8')
        written.push(resourcePath)
      }
    }
  }

  return written
}
