# Command Center Phase 3A — Student/Teacher Visibility Model

Status: ready  
App: Classroom Command Center

## Goal

Build the privacy and presentation foundation for the Command Center.

Students should only see student-safe board content.

Teacher-only content should remain private:
- teacher notes
- resource launcher
- prep checklist
- missing-file warnings
- answer keys
- private links
- controls

## Core Model

Visibility values:

```ts
type Visibility = "student" | "teacherOnly" | "hidden";
```

Meaning:

- `student`: visible on the student display and teacher side
- `teacherOnly`: visible only in edit/control/teacher context
- `hidden`: not visible until re-enabled

## Phase Scope

This phase should add the foundation for:

- student / teacherOnly / hidden visibility
- teacher-only notes
- teacher-only resource areas
- display mode filtering
- safer student-facing mode
- future `/display` and `/control` split

## In Scope

- Define visibility types if needed
- Add helper functions for filtering visible content
- Update existing display/edit behavior to respect student-facing mode
- Make teacher-only notes impossible to show in display mode
- Add documentation/status proof
- Preserve current display layout polish
- Preserve all current widgets
- Preserve build/lint

## Out of Scope

Do not add:
- Today Prep
- Teacher Material Launcher UI
- Spotify widget
- YouTube media page
- PDF viewer
- new subject screens
- OmniNote integration
- backend/cloud/API
- MongoDB
- Firebase/Supabase
- Google Drive API
- Canvas API

## Definition of Done

- Build passes
- Lint passes
- Student display does not show teacher-only items
- Existing screens still work
- Existing widgets still work
- No new heavy dependencies
