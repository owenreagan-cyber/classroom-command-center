# Status — Lesson Card + Vocabulary Card

## Date: Saturday, July 11, 2026

## Summary
In this build phase, we created and integrated two new student-facing instructional widgets: the **Lesson Card** and the **Vocabulary Card**. These widgets strengthen the academic display layer by allowing teachers to prominently project the lesson objective, success criteria, and key terms in high-contrast, scalable formats. Both cards integrate directly into the math, reading, and generic subject screens, complete with local-first editing, safe layout adjustments, and Daily Brief template integration.

## Files Changed/Created
- `src/data/types.ts` — Added types for `LessonContent` and `VocabularyContent`.
- `src/data/defaults.ts` — Defined generic, safe defaults for the Math, Reading, and Subject screens containing placeholder academic content.
- `src/widgets/LessonCard.tsx` — Built the new Lesson Card component with direct Edit mode inputs for Title, Objective, Success Criteria, and Reminders.
- `src/widgets/VocabularyCard.tsx` — Built the new Vocabulary Card component with simple `term: definition` text-area parsing that translates into robust visual chips.
- `src/screens/MathScreen.tsx` — Integrated the two new cards into the Math screen, complete with `HiddenCardPlaceholder` support and dynamic grid layout recalculations (`--math-cols`, `--math-rows`).
- `src/screens/ReadingScreen.tsx` — Integrated the two new cards into the Reading screen, supporting grid recalculations.
- `src/screens/SubjectScreen.tsx` — Added the new cards into the generic subject screen layout structure.
- `src/store/boardStore.ts` — Added `beautify` parsing for the new lesson and vocabulary payload shapes.
- `src/board/DailyBriefPanel.tsx` — Added advanced toggle fields for Lesson Objective, Success Criteria, and Vocabulary Terms so templates can pre-populate instructional content.
- `src/lib/displayLayout.ts` and `src/styles/index.css` — Updated grid variables to support dynamic stacking of the new instructional widgets alongside timers and materials.
- `docs/status/classroom-command-center-current-state.md` — Updated the feature tree and source files.
- `docs/widget-evolution-roadmap.md` — Logged the completed phase and updated priorities.

## Existing Architecture Reused
- **SmartTextCard**: Leveraged for the internal rendering of the `LessonCard` content, guaranteeing consistent projector typography and emphasis.
- **EditableText / EditableList**: Provided the UI for local editing inside the cards without needing new components.
- **HiddenCardPlaceholder**: Extended directly to the new widgets, enabling teachers to hide/show them in Edit mode effortlessly.
- **CardVisibilityPanel**: Used the existing `isOptional` defaults infrastructure.
- **DailyBriefPanel**: Extended the existing local setup form without needing a new route.

## Lesson Card Behavior
- **Visual Structure**: Shows the Lesson Title prominently, the learning objective with a heavy emphasis styling, optional bulleted success criteria ("I can..."), and an optional reminder.
- **Student Safe**: Clean projector view with no teacher editing clutter.

## Vocabulary Card Behavior
- **Visual Structure**: Displays a dedicated scrolling list of keywords.
- **Parsing**: In Edit mode, teachers type `term: definition` per line. The component gracefully splits the string and bolds the term while fading the definition. Words without a colon are simply rendered as bold terms.

## Data Model & Persistence
- Expanded `MathContent`, `ReadingContent`, and `SubjectContent` with optional `lesson` and `vocabulary` nodes.
- Preserved existing localStorage keys. If an older local state is loaded, the cards default safely to missing/hidden, avoiding destructive crashes or migration logic.

## Screen Integration & Visibility Behavior
- Added explicitly to: Math, Reading, Writing, Science, Social Studies, Intervention, Assessment, Flexible Groups, Centers, and Homework/Pack-up.
- They are turned off by default (`isOptional: false` in `DEFAULT_CARD_VISIBILITY`) to ensure existing board presets are not suddenly overcrowded for returning users.
- When activated, `MathScreen` and `ReadingScreen` use CSS variables (`--math-cols`) to safely split layout space between the lesson tools and materials tools.

## Daily Brief Integration
- Added text inputs for **Lesson Objective**, **Success Criteria**, and **Vocabulary Terms** into the `DailyBriefPanel`'s "Show Additional Fields" section.
- Selecting a Daily Brief Template correctly merges these values straight into the active screen's lesson/vocab cards.

## Display/Edit Privacy Statement
- **Display Mode**: Strictly limited to high-contrast student-facing words. All input fields, placeholders, and labels are absent.
- **Edit Mode**: Features editable textboxes, "Saved Locally" verification tags, and hidden placeholders.

## Local-First Safety Statement
- **100% Offline**: No curriculum was imported from Canvas. No external web scraping is occurring to generate definitions. No cloud databases are in use.
- **Sensor Privacy**: Absolutely zero microphone or audio capture occurs.
- **Data Protection**: Existing presets and local data are fully preserved.

## Validation Results
- **TypeScript Compilation**: `npm run build` completed successfully.
- **ESLint & Linter checks**: `npm run lint` passes cleanly with zero warnings or errors.
- **Trailing Whitespace hygiene**: `git diff --check` passed cleanly.

## Known Limitations
- The `VocabularyCard` handles text overflow cleanly via standard CSS scrolling, but very large lists (>10 words) might become difficult to read from the back of the classroom. Teachers are advised to curate terms.

## Next Recommended Phase
**Local Daily Brief Packet import/export:** With the core board layout fully equipped with instructional and management tools, building a local JSON file import/export system will allow teachers to save and share their "Daily Brief" setups out of the browser without relying on cloud servers.
