import type { TeacherResourcePackTree } from '../types'

/**
 * Metadata-only fixture mirroring Shurley Chapter 1 Teacher Resource Pack layout.
 * Filenames only — no copyrighted curriculum content in the repository.
 */
export const SHURLEY_CHAPTER_1_PACK_FIXTURE: TeacherResourcePackTree = {
  rootName: 'Shurley_Chapter_1_Teacher_Resource_Pack',
  packPath: 'exports/teacher-resource-packs/Shurley_Chapter_1_Teacher_Resource_Pack',
  sections: [
    {
      section: '00_Teacher_Start_Here',
      folderName: '00_Teacher_Start_Here',
      files: [
        'Chapter_1_Lesson_3_Start_Here.md',
        'README.md',
        'MISSING_RESOURCES.md',
      ],
    },
    {
      section: '01_Lesson_Plans',
      folderName: '01_Lesson_Plans',
      files: ['lesson-01-02-planning.md', 'phase-2-plan.md'],
    },
    {
      section: '02_Teacher_Scripts',
      folderName: '02_Teacher_Scripts',
      files: ['chapter-01-teacher-scripts.md'],
    },
    {
      section: '03_Student_Resources',
      folderName: '03_Student_Resources',
      files: [
        'chapter-01-shurley-packet.docx',
        'chapter-01-shurley-packet.pdf',
        'shurley-capitalization-punctuation-reference.pdf',
      ],
    },
    {
      section: '04_Teacher_Keys',
      folderName: '04_Teacher_Keys',
      files: [
        'chapter-01-shurley-packet-teacher-edition.docx',
        'chapter-01-shurley-packet-teacher-edition.pdf',
        'chapter-01-in-class-chapter-review.docx',
        'chapter-01-in-class-chapter-review-key.docx',
      ],
    },
    {
      section: '05_Presentations',
      folderName: '05_Presentations',
      files: [
        'Ch.1_Lesson_3_Complete_Sentences.pptx',
        'Ch.1_Lesson_3_Complete_Sentences.pdf',
        'Ch.1_Lesson_4_Analogies.pptx',
        'Ch.1_Lesson_4_Analogies.pdf',
        'Ch.1_Lesson_5_Capitalization_Editing.pptx',
        'Ch.1_Lesson_5_Capitalization_Editing.pdf',
        'Ch.1_Lesson_6_Mixed_Editing.pptx',
        'Ch.1_Lesson_6_Mixed_Editing.pdf',
        'Ch.1_Chapter_Review.pptx',
        'Ch.1_Chapter_Review.pdf',
        'README.md',
      ],
    },
    {
      section: '06_Visual_References',
      folderName: '06_Visual_References',
      files: [
        'shurley-capitalization-punctuation-reference.pdf',
        'shurley-capitalization-punctuation-reference-transcription.md',
      ],
    },
    {
      section: '07_Assessments',
      folderName: '07_Assessments',
      files: [
        'chapter-01-in-class-chapter-review.docx',
        'chapter-01-in-class-chapter-review.pdf',
        'chapter-01-in-class-chapter-review-key.docx',
        'chapter-01-in-class-chapter-review-key.pdf',
      ],
    },
    {
      section: '08_Teacher_Planning',
      folderName: '08_Teacher_Planning',
      files: ['slideshow-audit.md', 'phase-2-build-report.md'],
    },
  ],
}
