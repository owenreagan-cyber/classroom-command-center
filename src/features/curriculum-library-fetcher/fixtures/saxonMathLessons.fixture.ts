import type { DriveFolderTree } from '../types'

/**
 * Local fixture representing Google Drive folder structure.
 * Pilot scope: Saxon Math Lessons 2–6 only. No copyrighted file content.
 */
export const SAXON_MATH_DRIVE_FIXTURE: DriveFolderTree = {
  root: 'Teacher AI Workstation',
  folders: [
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 02',
      files: [
        'lesson2-slides.pdf',
        'lesson2-script.pdf',
        'lesson2-practice.pdf',
      ],
    },
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 03',
      files: [
        'lesson3-presentation.pdf',
        'lesson3-teacher-notes.pdf',
        'lesson3-worksheet.pdf',
        'lesson3-assessment.pdf',
      ],
    },
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 04',
      files: [
        'lesson4-slideshow.pdf',
        'lesson4-script.pdf',
        'lesson4-practice.pdf',
      ],
    },
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 05',
      files: [
        'lesson5-slides.pdf',
        'lesson5-teacher-script.pdf',
        'lesson5-worksheet.pdf',
      ],
    },
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 06',
      files: [
        'lesson6-presentation.pdf',
        'lesson6-notes.pdf',
        'lesson6-practice.pdf',
        'lesson6-quiz.pdf',
      ],
    },
    // Out of pilot scope — should be ignored by scanner
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 01',
      files: ['lesson1-slides.pdf'],
    },
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 07',
      files: ['lesson7-slides.pdf'],
    },
    {
      path: 'Curriculum/Reading/Reading Mastery/Lesson 02',
      files: ['lesson2-story.pdf'],
    },
  ],
}
