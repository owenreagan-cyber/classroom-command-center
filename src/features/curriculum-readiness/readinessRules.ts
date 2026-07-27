import type { CurriculumSubjectId } from '../curriculum/types'
import type { ReadinessResourceSlot, SubjectReadinessRule } from './types'

const MATH_RULE: SubjectReadinessRule = {
  subject: 'math',
  required: [
    { oneOf: ['presentation'], label: 'Presentation' },
    { oneOf: ['student-resource'], label: 'Student Resource' },
  ],
  recommended: ['teacher-notes', 'practice'],
}

const SHURLEY_RULE: SubjectReadinessRule = {
  subject: 'shurley',
  required: [
    { oneOf: ['presentation'], label: 'Presentation' },
    { oneOf: ['student-resource'], label: 'Student Resource' },
  ],
  recommended: ['teacher-script', 'teacher-key'],
}

const READING_RULE: SubjectReadinessRule = {
  subject: 'reading',
  required: [
    { oneOf: ['presentation', 'lesson-resource'], label: 'Lesson Resource' },
    { oneOf: ['student-resource'], label: 'Student Resource' },
  ],
  recommended: ['teacher-notes'],
}

const HISTORY_SCIENCE_RULE: SubjectReadinessRule = {
  subject: 'history',
  required: [
    { oneOf: ['presentation', 'pdf'], label: 'Presentation or PDF' },
    { oneOf: ['student-resource'], label: 'Student Resource' },
  ],
  recommended: ['teacher-notes'],
}

const DEFAULT_RULE: SubjectReadinessRule = {
  subject: 'spelling',
  required: [
    { oneOf: ['presentation', 'lesson-resource', 'pdf'], label: 'Lesson Resource' },
    { oneOf: ['student-resource'], label: 'Student Resource' },
  ],
  recommended: ['teacher-notes'],
}

const RULES: Record<CurriculumSubjectId, SubjectReadinessRule> = {
  math: MATH_RULE,
  shurley: SHURLEY_RULE,
  reading: READING_RULE,
  spelling: DEFAULT_RULE,
  history: HISTORY_SCIENCE_RULE,
  science: { ...HISTORY_SCIENCE_RULE, subject: 'science' },
}

export function getSubjectReadinessRule(subject: CurriculumSubjectId): SubjectReadinessRule {
  return RULES[subject] ?? DEFAULT_RULE
}

export function slotDisplayLabel(slot: ReadinessResourceSlot): string {
  switch (slot) {
    case 'presentation':
      return 'Presentation'
    case 'student-resource':
      return 'Student Resource'
    case 'teacher-notes':
      return 'Teacher Notes'
    case 'teacher-script':
      return 'Teacher Script'
    case 'teacher-key':
      return 'Teacher Key'
    case 'practice':
      return 'Practice'
    case 'pdf':
      return 'PDF'
    case 'lesson-resource':
      return 'Lesson Resource'
  }
}

export function recommendedDisplayLabel(slot: ReadinessResourceSlot): string {
  return slotDisplayLabel(slot)
}
