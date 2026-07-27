# Curriculum Library — Drive Folder Template

This template describes the recommended Google Drive structure. Create these folders in Drive; do not commit actual curriculum files to GitHub.

## Scaffold

```
Teacher AI Workstation/
├── Curriculum/
│   ├── Math/Saxon Math/Lesson 01/
│   ├── Math/Saxon Math/Lesson 02/
│   ├── Math/Saxon Math/Lesson 03/
│   ├── Reading/Reading Mastery/
│   ├── Spelling/
│   ├── Shurley/
│   ├── History/
│   └── Science/
├── Lesson Packages/
├── Teacher Scripts/
├── Student Resources/
├── Assessments/
└── Classroom Assets/
    ├── Images/
    ├── Audio/
    ├── Backgrounds/
    └── Templates/
```

## Per-lesson file naming

Place these files inside each `Lesson NN/` folder:

| File pattern | Resource type |
|--------------|---------------|
| `*-slides.pdf` or `*-presentation.pdf` | presentation |
| `*-script.pdf` or `*-teacher-notes.pdf` | teacher-notes |
| `*-practice.pdf` or `*-worksheet.pdf` | worksheet |
| `*-answer-key.pdf` | answer-key |

Command Center classifies files automatically via `resourceClassifier.ts`.
