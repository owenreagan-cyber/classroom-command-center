# Daily Brief Packet Intake Plan

## Purpose

Daily Brief Intake now supports local routine templates inside Classroom Command Center.

Eventually, many Daily Brief fields should be prepared from Canvas files/modules, uploaded files, email, calendar notes, or Teacher AI Workstation outputs. That future work should not turn Classroom Command Center into a heavy integration app.

This plan defines the safe architecture boundary.

## Core Architecture Decision

Classroom Command Center should remain the clean, fast, local-first classroom display and control app.

Teacher AI Workstation / Chief of Staff should eventually do the heavy intake work:
- Canvas files/modules review
- uploaded file parsing
- email/calendar intake
- lesson packet extraction
- AI-assisted summarization
- source tracing
- approval preparation

Command Center should receive a simple reviewed Daily Brief Packet and apply it only after teacher approval.

## Level 1 — Local Routine Templates

Status: implemented.

Command Center includes local static routine templates for common daily routines:
- Morning Routine
- Math Setup
- Shurley English Setup
- Reading Class Setup
- Spelling Transition
- Snack Routine
- Lunch Routine
- Ready Position
- Silent Cleanup
- Generic Transition

These templates are offline, time-independent, and editable by the teacher through the Daily Brief Intake panel.

## Level 2 — Local Daily Brief Packet Import

Future phase.

Command Center can support a local paste/import workflow where the teacher provides a prepared Daily Brief Packet.

The packet should be plain JSON or structured text generated elsewhere, pasted locally, previewed, and approved before applying.

No Canvas, Google, email, AI, or network connection should be required inside Command Center for Level 2.

## Level 3 — Teacher AI Workstation / Chief of Staff Packet Generator

Future phase outside Command Center.

Teacher AI Workstation / Chief of Staff can prepare Daily Brief Packets from sources such as:
- Canvas files/modules
- uploaded files
- copied email text
- local curriculum notes
- calendar notes
- teacher-provided weekly plans

This upstream system can do the heavier extraction, summarization, validation, and source-tracing work.

Command Center should not directly own those integrations.

## Level 4 — Approval-Gated Daily Setup

Future phase.

The teacher reviews the generated packet before applying it to Command Center.

A safe approval flow should show:
- source summary
- target screen
- fields to update
- fields that will not be touched
- warnings for missing or uncertain content
- teacher-editable final text

Applying a packet should not reset timers, visibility, backups, presets, or unrelated screen content.

## Suggested Daily Brief Packet Shape

```json
{
  "version": 1,
  "date": "YYYY-MM-DD",
  "source": "teacher-ai-workstation",
  "sourceSummary": "Prepared from Canvas module notes and teacher-provided schedule text.",
  "targetScreen": "reading",
  "templateId": "reading-class-setup",
  "displayTitle": "Reading Class",
  "mainInstruction": "Open to today's story and prepare for homework check.",
  "checklist": [
    "Homework Check",
    "Reading Lesson",
    "Spelling",
    "Homework Time"
  ],
  "materialsOut": [
    "Reading book",
    "Pen/Pencil"
  ],
  "materialsAway": [
    "Math materials"
  ],
  "smartTvReminder": "No hands today. Be ready — names will be called at random.",
  "voiceLevel": "silent",
  "teacherNote": "Verify lesson title before displaying.",
  "warnings": [
    "Lesson title was not found in the source packet."
  ]
}
```

## Safety Rules

Command Center packet intake should:
- stay local-first
- require teacher approval
- preserve Display/Edit separation
- avoid direct Canvas, Google, email, or AI integrations
- avoid network calls
- avoid hidden automatic overwrites
- preserve timers
- preserve card visibility
- preserve backups and presets
- preserve existing local state
- show warnings before applying uncertain content

## Recommended Implementation Order

1. Lesson Card + Vocabulary Card
2. Daily Brief polish and template editing
3. Local Daily Brief Packet import/export
4. Teacher AI Workstation / Chief of Staff packet generator
5. Approval gate into Command Center
