import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type { OmniNoteLessonHandoffPlan } from './types'
import { writeHandoffPackageToDisk } from './localHandoffWriter'
import { buildVisibleSaxonLessonPdf } from './visibleLessonPdf'

export interface OmniLessonExportResult {
  packageDir: string
  omnilessonPath: string
  writtenFiles: string[]
}

/** Write student-safe package directory and portable `.omnilesson` ZIP archive. */
export function writeOmniLessonPackageToDisk(
  plan: OmniNoteLessonHandoffPlan,
  options?: { syntheticPdf?: string | Buffer },
): OmniLessonExportResult {
  const pdfTemplate = options?.syntheticPdf ?? buildVisibleSaxonLessonPdf()
  const written = writeHandoffPackageToDisk(plan, { syntheticPdf: pdfTemplate })
  const packageDir = path.dirname(plan.localPackagePath)
  const omnilessonPath = path.join(packageDir, `${plan.package.id}.omnilesson`)

  createStoreOnlyZip(packageDir, omnilessonPath, plan)
  written.push(omnilessonPath)

  return {
    packageDir,
    omnilessonPath,
    writtenFiles: written,
  }
}

function createStoreOnlyZip(packageDir: string, outputPath: string, plan: OmniNoteLessonHandoffPlan): void {
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnilesson-'))
  try {
    fs.copyFileSync(plan.localPackagePath, path.join(stagingDir, 'package.json'))

    for (const resource of plan.package.resources) {
      if (!resource.file.toLowerCase().endsWith('.pdf')) continue
      const sourcePath = path.join(packageDir, resource.file)
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(stagingDir, resource.file))
      }
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath)
    }

    execFileSync('zip', ['-0', '-j', outputPath, 'package.json', ...listPdfNames(plan)], {
      cwd: stagingDir,
      stdio: 'pipe',
    })
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true })
  }
}

function listPdfNames(plan: OmniNoteLessonHandoffPlan): string[] {
  return plan.package.resources
    .map((resource) => resource.file)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
}
