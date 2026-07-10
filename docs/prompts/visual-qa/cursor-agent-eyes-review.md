# Cursor Prompt — Agent Eyes Visual QA Review

Use this prompt when Cursor has access to the repo and Playwright MCP or browser tooling.

```text
Mission:
Run an Agent Eyes visual QA review for Classroom Command Center.

Repo:
~/Projects/classroom-command-center

Current focus:
Noise Tower Defense / student-facing classroom display quality.

Read first:
- DESIGN_PRINCIPLES.md
- docs/quality/premium-display-standards.md
- docs/quality/agent-eyes-visual-qa-playbook.md
- docs/qa/phase-7e-noise-visual-qa.md
- src/widgets/NoiseStatusCard.tsx
- src/board/NoiseControlPanel.tsx
- src/lib/displayLayout.ts
- src/screens/HomeroomScreen.tsx
- src/screens/MathScreen.tsx
- src/screens/ReadingScreen.tsx
- src/lib/noiseTowers.ts

Use Playwright MCP if available.
If Playwright MCP is unavailable, use Playwright CLI or a temporary local script outside committed source.
Do not add dependencies.
Do not commit screenshots.
Do not commit temporary scripts.
Keep artifacts in .local/visual-qa/ if screenshots are saved.

Target flow:
Local Vite app loads -> Homeroom / Math / Reading display screens render -> Noise Tower Defense states are visually reviewed -> findings are reported.

Start the app:
- use the repo's existing dev script
- keep the host local
- do not introduce network/cloud/API dependencies

Required checks:
1. Page identity:
   - app loads at local dev URL
   - page title/content matches Command Center
2. Not blank:
   - meaningful app content renders
3. Framework overlay:
   - no Vite/React error overlay
4. Console health:
   - no relevant console errors/warnings
5. Screenshot evidence:
   - capture at least desktop/projector screenshots
6. Interaction proof:
   - use teacher controls to create at least:
     - intact tower state
     - damaged tower state
     - destroyed tower state
     - repair tick state
     - meter warning state
     - meter critical state
7. Display mode proof:
   - Teacher Dock/controls hidden
   - student-facing display remains readable

Viewports:
- 1440x900
- 1920x1080
- 1024x768 if practical

Visual quality criteria:
- premium, not generic
- projector-readable
- no cramped widgets
- no clipped critical text
- no awkward wrapping
- no tiny student-critical text
- no cheap/default dashboard look
- no overdone effects that reduce readability
- no direct anime IP names/logos/quotes
- teacher-only controls hidden in display mode

Screens to review:
- Homeroom
- Math
- Reading

Important states:
- all NOISE towers intact
- first tower damaged
- first tower destroyed
- multiple towers destroyed
- all towers destroyed if practical
- repair tick
- voice level Off
- meter 65+
- meter 85+

Allowed edits:
Only make small targeted edits if you find clear visual bugs:
- clipping
- overlap
- unreadable text
- bad z-index
- broken responsive sizing
- display mode showing controls
- obvious spacing problems

Do not do a broad redesign in this review unless explicitly asked.

Validation:
Run:
- npm run build
- npm run lint
- git diff --check
- git status --short --untracked-files=all
- git diff --stat

Final report:
Return:
- Summary
- Environment
- Screens/viewports reviewed
- Screenshot evidence captured
- Findings
- Fixes made, if any
- Remaining risks
- Validation results
- Git status

Do not commit, merge, push, or delete branches.
```
