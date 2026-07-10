# Command Center Phase 7E — Agent Eyes + Visual QA Foundation

## Purpose

Phase 7E adds a repeatable visual QA system so student-facing screens are checked by rendered screenshots, not just TypeScript and lint.

This phase creates the playbook and prompts needed for Cursor, Codex, Claude Code, or another coding agent to inspect the live app with Playwright MCP or Playwright CLI.

## Why this matters

AI-assisted UI can compile successfully while still looking generic, cramped, unreadable, or dated.

Command Center is projected for students daily. The design standard is:

- premium
- readable
- classroom-safe
- intentional
- visually clear from the back of the room

## What this phase adds

- Agent Eyes Visual QA playbook
- Claude design-reviewer subagent
- Claude visual QA run prompt
- Cursor visual QA prompt
- Codex visual QA prompt
- root design principles
- local screenshot artifact rules
- browser/tool fallback rules

## Browser strategy

Preferred:

- Playwright MCP for interactive browser eyes

Fallback:

- Playwright CLI screenshots or temporary scripts outside committed source

Future:

- screenshot regression baselines after UI stabilizes

## Out of scope

This phase does not add:

- npm dependencies
- committed screenshots
- visual regression baselines
- cloud visual testing services
- microphone/WebRTC work
- UI redesign work
- new app features

## Acceptance criteria

Phase 7E is complete when:

- design principles exist
- Agent Eyes visual QA playbook exists
- Claude design reviewer exists
- Claude prompt exists
- Cursor prompt exists
- Codex prompt exists
- `.local/visual-qa/` artifacts are ignored
- build passes
- lint passes
- no local screenshot artifacts are committed
