# Status — Daily Brief Intake & Routine Templates

## Date: Saturday, July 11, 2026

## Summary
In this build phase, we created and integrated a teacher-facing **Daily Brief Intake Panel** accompanied by a reusable **Local Routine Template Library**. This setup workflow empowers teachers to rapidly configure the projected student board for 10 common daily routines (e.g. Morning Arrival, Math Setup, Snack Routine, Ready Position) with a single click. Edits to templates can be fine-tuned locally in a dedicated draft workspace, persist in the browser's `localStorage`, and apply safely to existing student boards in real-time without overwriting unrelated data or active timers.

## Files Changed/Created
- `src/data/types.ts` — Defined the explicit TypeScript interface for `DailyBriefTemplate`.
- `src/data/dailyBriefTemplates.ts` — Added a library of 10 static, classroom-tested routine templates with realistic starting values.
- `src/board/DailyBriefPanel.tsx` — Built the teacher-facing workspace with template pickers, visual form field inputs, a custom voice-level picker, collapsible additional fields, and target-screen action buttons.
- `src/board/TeacherDock.tsx` — Integrated the `DailyBriefPanel` as a first-class citizen in the edit-only cyber-slate.
- `src/app/AppShell.tsx` — Hooked the store's `updateContents` action into the `TeacherDock` prop tree.
- `docs/status/classroom-command-center-current-state.md` — Updated the feature tree, source tree, and recommended next phases.
- `docs/widget-evolution-roadmap.md` — Updated priority roadmap.

## Existing Architecture Reused
- **TeacherDock**: Served as the host for the new collapsible panel under the "Quick Setup" category.
- **Board State Store (Zustand)**: Reused `contents` object and the `updateContents` setter to apply content modifications cleanly across screens.
- **Noise / Voice Level Tracker**: Reused `getNoiseTrackerIdForScreen` and the board store's `onNoiseVoiceLevelChange` to align expectation cues with active screen noise tracking without duplicating state.
- **Screen Structures & Labels**: Utilized `SCREEN_META` directly to display contextual "Apply" actions that map accurately to each screen's specific model (e.g., `HomeroomScreenProps`, `MathScreenProps`).

## Daily Brief Panel Behavior
- **Interactive Workspace**: Selecting a template populates the form inputs instantly, giving the teacher a clear visual preview of the template's parameters before committing them.
- **Collapsible Inputs**: Keeps the sidebar clean. Primary fields (Title, Voice Level, Instruction, Checklist, Materials Out) are shown by default. Advanced fields (Materials Away, Smart TV Banner, Teacher notes) are safely nested under a "Show Additional Fields" dropdown.
- **Real-time Live Edits**: Draft form values can be changed, reset, or fine-tuned directly on the panel.
- **Feedback Alerts**: Emits non-intrusive alert badges (e.g., `"Applied successfully to Homeroom Board!"`) to provide immediate confirmation of successful board updates.

## Routine Template Library Behavior
- **100% Offline**: Templates are locally stored and static. They do not query external APIs, cloud resources, or online lesson generators.
- **Time-Independent**: Avoids brittle hardcoded clock times (e.g., "9:15 AM") in favor of phase-based relative routines (e.g. "Silent Cleanup", "Math Setup"), making them extremely robust across different school year schedules.

## Supported Templates
The library includes 10 comprehensive starter routines:
1. **Morning Routine** (Silent focus, Morning Work checklists, item supplies preparation).
2. **Math Setup** (Supplies preparation, power packets, materials away).
3. **Shurley English Setup** (Silent writing, grammar mode activation).
4. **Reading Class Setup** (Lesson checklist, ready position transition reminders).
5. **Spelling Transition** (Materials swap reading to spelling).
6. **Snack Routine** (Quiet whispering, cleaning crumbs, yellow folder pack-away).
7. **Lunch Routine** (Neat eating, quiet voices, silent cleanup transition).
8. **Ready Position** (Desk clear, sitting tall, eyes on speaker).
9. **Silent Cleanup** (Floor check, trash pickup, area leave-better).
10. **Generic Transition** (Fast quiet swapping of materials, facing the board).

## Supported Fields
- Display Title (Screen headers)
- Voice Level Expectation (Off, Silent, Whisper, Normal)
- Main Instruction / Do Now (Central display prompts)
- Checklist / Agenda Items (Newline-separated lists)
- Materials Out (Newline-separated lists)
- Materials Away (Newline-separated lists for advanced cleanups)
- Smart TV Reminder / Banner Note (Header subtitles or banners)
- Ready Note / Teacher Tips (Private teacher notes or extra Ready position items)

## Update & Persistence Behavior
- **Draft Persistence**: The teacher's edited draft forms are saved automatically to the browser's `localStorage` (`cc_daily_brief_draft`) on every keystroke. Reloading the page or switching tabs will never lose draft progress.
- **Targeted Application**: Clicking "Apply Brief" performs a target-mapped merge with the active screen's existing cards. No other screen is overwritten, active timers remain uninterrupted, and card visibility configurations are perfectly preserved.
- **Instant Save Badges**: Includes visual `"Saved Locally"` badges to reassure teachers of system privacy.

## Screen Mapping
Edits are injected cleanly into active components based on target screen compatibility:
- **Homeroom**: Updates Do Now prompt (with `mainInstruction`), Materials Lists (with `materialsOut`/`materialsAway`), and Reminders list (with `checklist`).
- **Math & Reading**: Safely populates Math Lesson Title, Reading Focus Title, and corresponding Materials lists.
- **Subject Screens** (Writing, Science, Social Studies, assessment, assessment focus, assessment pack-up, centers): Correctly updates Focus Task, Materials lists, and Agenda lists.
- **Snack / Lunch**: Populates Snack Routine details, Rotation list, and Clean Up Reminders.
- **Ready Position & Silent Cleanup**: Correctly populates the Ready Position card steps and Display Title.
- **Voice Level Tracker**: Updates the screen's active voice level expectation.

## Display/Edit Mode Privacy
- **Teacher Workspace**: Intake controls, picker selectors, clear/apply buttons, draft textareas, and template help labels are completely private to Edit mode inside the Sidebar.
- **Student Display (Display Mode)**: Only displays beautiful, projector-friendly, high-contrast typography cards carrying the finalized routine updates. All sidebar clutter is hidden.

## Local-First Safety Statement
- **Zero Network Traffic**: No calls are made to remote databases, external calendar systems, canvas.instructure, Gmail, Google APIs, or OpenAI generators.
- **Sensor Privacy**: Absolutely zero microphone or audio capture occurs.
- **Data Protection**: Existing presets, backups, custom screen options, and state are completely safe. All state operations happen on structured copies.

## Validation Results
- **TypeScript Compilation**: `npm run build` completed successfully.
- **ESLint & Linter checks**: `npm run lint` passes cleanly with zero warnings or errors.
- **Trailing Whitespace hygiene**: `git diff --check` passed cleanly.

## Known Limitations
- Converting checklist lists from multi-line textareas separates strictly by newlines; any leading list markers (like `-` or `*`) entered by the user are preserved literally as text inside the cards.

## Next Recommended Phase
**Lesson Card + Vocabulary Card:** Expand the student-facing board widgets to support lesson learning objectives and vocabulary word lists, aligning them with the subject expansion screens.
