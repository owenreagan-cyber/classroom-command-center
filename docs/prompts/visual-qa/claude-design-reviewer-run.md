# Claude Prompt — Run Design Reviewer Agent

Use this prompt after Playwright MCP is configured in Claude Code or when Claude Code can use browser tooling.

```text
Use the design-reviewer subagent.

Mission:
Run visual QA for Classroom Command Center Noise Tower Defense.

Repo:
~/Projects/classroom-command-center

Branch:
command-center-noise-visual-qa

Use:
- DESIGN_PRINCIPLES.md
- docs/quality/premium-display-standards.md
- docs/quality/agent-eyes-visual-qa-playbook.md
- docs/qa/phase-7e-noise-visual-qa.md

Review:
- Homeroom
- Math
- Reading
- Noise Tower Defense intact/damaged/destroyed/repair states
- low/warning/critical meter states
- display mode with teacher controls hidden

Viewports:
- 1440x900
- 1920x1080
- 1024x768 if practical

Use Playwright MCP if available.
If unavailable, use Playwright CLI or a temporary script outside committed source.
Do not add dependencies.
Do not commit screenshots.
Do not commit temporary scripts.
Keep artifacts under .local/visual-qa/.

Only make narrow fixes for obvious visual bugs:
- clipping
- overlap
- unreadable text
- z-index problems
- display-mode teacher controls showing
- overlay covering essential content too aggressively

Do not redesign broadly.

Validate:
- npm run build
- npm run lint
- git diff --check
- git status --short --untracked-files=all
- git diff --stat

Final report:
Use the report format in .claude/agents/design-reviewer.md.
Do not commit, merge, push, or delete branches.
```
