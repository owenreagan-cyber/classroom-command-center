# Codex Prompt — Agent Eyes Visual QA Review

Use this prompt when running a Codex visual QA pass.

```text
Mission:
Run a visual QA review for Classroom Command Center using agent eyes.

Repo:
~/Projects/classroom-command-center

Goal:
Verify the Noise Tower Defense display is not merely functional, but visually strong, readable, and classroom-projector safe.

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

Browser/tooling:
Use Playwright MCP if configured.
If MCP is unavailable, use Playwright CLI or a temporary script outside committed source.
Record which path you used.

Do not:
- add dependencies
- commit screenshots
- commit temporary scripts
- use cloud/API services
- add microphone/WebRTC code
- use direct anime IP names/logos/quotes
- commit, merge, push, or delete branches

Artifact rules:
- screenshots/traces go under .local/visual-qa/ only
- no screenshot artifacts should be staged
- no local metadata should be committed

Target flow:
app loads -> display screens render -> teacher controls create noise states -> display mode is visually inspected -> report findings.

Required screens:
- Homeroom
- Math
- Reading

Required states:
- all towers intact
- tower damaged
- tower destroyed
- multiple towers damaged/destroyed if practical
- repair tick
- low meter
- 65+ warning
- 85+ critical
- voice level Off
- display mode with controls hidden

Required viewports:
- 1440x900
- 1920x1080
- 1024x768 if practical

Visual QA rubric:
- premium classroom display quality
- readable from back of room
- clear hierarchy
- large student-critical labels and numbers
- no clipping
- no overlap
- no cramped tower cards
- no awkward text wrapping
- no cheap/template dashboard feel
- warning/critical effects remain readable
- overlay does not cover essential content too aggressively

Allowed changes:
Make only narrow fixes for obvious issues:
- clipping
- overlap
- z-index problems
- too-small critical text
- bad overlay placement
- display-mode teacher control leakage
- unreadable warning/critical state

Do not perform a broad redesign unless explicitly requested.

Validation:
Run:
- npm run build
- npm run lint
- git diff --check
- git status --short --untracked-files=all
- git diff --stat

Final report:
Use this format:

Summary:
- what was reviewed
- whether it passed

Environment:
- browser/tool path used
- URL
- viewports

Screens reviewed:
- list screens and states

Findings:
- numbered list
- include what user sees, why it matters, likely file, and fix/recommendation

Fixes made:
- list files changed, or "none"

Validation:
- build result
- lint result
- diff check result

Remaining risks:
- what still needs human/projector review

Git status:
- exact short status
```
