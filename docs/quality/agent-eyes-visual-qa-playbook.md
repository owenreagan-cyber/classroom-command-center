# Agent Eyes Visual QA Playbook

Command Center should not approve student-facing UI from build/lint alone.

The app can compile and still look cramped, generic, unreadable, or template-like. This playbook defines the visual QA loop for Cursor, Codex, Claude Code, or any future coding agent.

## Goal

Give agents "eyes" so they can:

- open the local app
- inspect rendered screens
- capture screenshots
- compare against display standards
- check for console errors
- identify clipping, overlap, tiny text, and weak hierarchy
- report concrete visual findings before code is approved

## Core rule

Student-facing display work requires:

- build PASS
- lint PASS
- rendered screenshot proof
- console health check
- clipping/overlap check
- projector readability check
- premium display checklist review

Build/lint proves code health. It does not prove classroom display quality.

## Recommended stack

### Layer 1 — Written display standards

Use:

- `DESIGN_PRINCIPLES.md`
- `docs/quality/premium-display-standards.md`
- `docs/quality/agent-eyes-visual-qa-playbook.md`

These documents define what "good" means before an agent starts editing.

### Layer 2 — Agent visual-review prompts

Use committed prompts in:

- `docs/prompts/visual-qa/cursor-agent-eyes-review.md`
- `docs/prompts/visual-qa/codex-agent-eyes-review.md`
- `docs/prompts/visual-qa/claude-design-reviewer-run.md`

These prompts tell agents exactly what to inspect and how to report findings.

### Layer 3 — Browser eyes

Preferred:

- Playwright MCP for Cursor/Codex/Claude when available
- Playwright CLI screenshots when MCP is not available or token cost is too high

Do not add Playwright MCP as an app dependency. Configure it in the coding tool outside this repo.

### Layer 4 — Visual regression later

Later, after stable approved screenshots exist, consider:

- Playwright screenshot snapshots
- BackstopJS
- Chromatic/Percy only if a cloud/component workflow becomes worth it

Do not add visual regression tooling until the UI stabilizes.

## Tool setup notes

These commands configure developer tools, not this app.

Cursor:

```text
Cursor Settings -> MCP -> Add new MCP Server
Name: playwright
Command: npx @playwright/mcp@latest
```

Codex CLI:

```bash
codex mcp add playwright npx "@playwright/mcp@latest"
```

Claude Code:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

## Screenshot artifact rule

Screenshots, traces, and temporary Playwright scripts should stay out of git unless explicitly approved.

Use ignored local paths:

```text
.local/visual-qa/
.local/screenshots/
.local/playwright/
```

## What agents must check visually

For student-facing screens:

- does it look premium, not generic?
- is it readable from the back of the room?
- are critical numbers and labels large enough?
- does anything clip?
- does anything overlap?
- does anything wrap awkwardly?
- does the card cover essential lesson content?
- is hierarchy clear?
- do warning/critical states remain readable?
- are teacher-only controls hidden in display mode?
- does the design fit the current classroom display style?

## Noise Tower Defense specific checklist

Check these states:

- all towers intact
- N damaged
- N destroyed
- multiple towers destroyed
- all towers destroyed
- repair tick state
- meter low
- meter warning at 65+
- meter critical at 85+
- voice levels: Silent, Whisper, Normal, Off
- Homeroom display
- Math display
- Reading display
- edit mode
- display mode

## Viewports

Minimum review:

- classroom/projector desktop: 1440x900
- widescreen classroom/projector: 1920x1080
- tablet-ish: 1024x768

Optional:

- iPad landscape
- small laptop
- browser zoom 90% and 110%

## Report format

Agent reports should include:

- Summary
- Environment
- Screens reviewed
- Viewports reviewed
- Screenshots captured
- Findings
- Fixes made
- Remaining risks
- Validation results
- Git status

For each finding:

- what the user sees
- where it appears
- why it matters
- likely file/component
- fix made or recommended next action
