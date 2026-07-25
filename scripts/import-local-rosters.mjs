#!/usr/bin/env node
/**
 * Dev-only helper: reads .local/rosters/2026-class-rosters.local.json and writes
 * a normalized picker-ready JSON to stdout or a chosen output path.
 *
 * Usage:
 *   node scripts/import-local-rosters.mjs
 *   node scripts/import-local-rosters.mjs --out .local/rosters/picker-import.json
 *
 * The real roster file stays in .local/ and is never committed.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const defaultInput = join(root, '.local/rosters/2026-class-rosters.local.json')

const outFlag = process.argv.indexOf('--out')
const outputPath = outFlag >= 0 ? process.argv[outFlag + 1] : null

function computeDisplayName(firstName, preferredName) {
  const preferred = preferredName?.trim()
  if (preferred) return preferred
  return firstName.trim()
}

function generateStableStudentId(firstName, lastName, classGroup, section) {
  const seed = `${firstName}|${lastName}|${classGroup}|${section ?? ''}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return `stu-${Math.abs(hash).toString(36)}`
}

function normalize(input, classGroup, section) {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const preferredName = input.preferredName?.trim() || undefined
  return {
    id: generateStableStudentId(firstName, lastName, classGroup, section),
    firstName,
    lastName,
    preferredName,
    displayName: computeDisplayName(firstName, preferredName),
    isActive: true,
    classes: [classGroup],
    section,
    isAbsent: false,
  }
}

const raw = readFileSync(defaultInput, 'utf8')
const file = JSON.parse(raw)
const students = []

for (const input of file.classes.homeroom?.students ?? []) {
  students.push(normalize(input, 'homeroom'))
}
for (const input of file.classes.math?.students ?? []) {
  students.push(normalize(input, 'math'))
}
for (const section of ['RM4', 'SM5']) {
  for (const input of file.classes.reading?.sections?.[section] ?? []) {
    students.push(normalize(input, 'reading', section))
  }
}

const payload = {
  importedAt: new Date().toISOString(),
  source: '.local/rosters/2026-class-rosters.local.json',
  studentCount: students.length,
  students,
}

const json = `${JSON.stringify(payload, null, 2)}\n`

if (outputPath) {
  writeFileSync(outputPath, json)
  console.log(`Wrote ${students.length} students to ${outputPath}`)
} else {
  process.stdout.write(json)
}
