# Manual QA — Phase 4D/4E Inline Editing Polish + Classroom Board Usability

Use this checklist after `npm run dev`.

## Edit mode

- [ ] Teacher Dock appears in edit mode.
- [ ] Editable cards show grouped edit panels.
- [ ] Edit panels are visually separate from student-facing display content.
- [ ] Text fields show helper copy.
- [ ] List fields show helper copy.
- [ ] Materials fields show Have Out and Put Away helpers.
- [ ] Blank lines in lists do not appear on the student board.
- [ ] List fields normalize blank lines after blur.
- [ ] Reset warning copy is visible in Teacher Dock.

## Display mode

- [ ] Teacher Dock disappears.
- [ ] Edit panels disappear.
- [ ] Inputs and textareas do not appear.
- [ ] Teacher-only hints do not appear.
- [ ] Hidden cards remain hidden.
- [ ] Student-facing cards remain readable.

## Empty content

- [ ] Empty text cards show a friendly fallback.
- [ ] Empty list cards show a friendly fallback.
- [ ] Empty Have Out materials show a friendly fallback.
- [ ] Empty Put Away materials show a friendly fallback.
- [ ] Empty content does not create silent blank cards.

## Persistence

- [ ] Edit a Homeroom Do Now prompt.
- [ ] Edit a materials list.
- [ ] Refresh the browser.
- [ ] Confirm edits persist.
- [ ] Switch to display mode.
- [ ] Confirm edits appear without edit controls.

## Regression checks

- [ ] Timer still works.
- [ ] Beautify still runs.
- [ ] Undo Beautify still appears after Beautify.
- [ ] Reset to defaults still restores starter content.
- [ ] Subject screens still render.
- [ ] Snack/Lunch still renders.
- [ ] Ready Position still renders.
