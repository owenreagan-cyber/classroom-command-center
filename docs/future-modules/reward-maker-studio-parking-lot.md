# Reward Maker Studio — Parked Future Module

Status: PARKED / DO NOT BUILD NOW

## Why this is parked

The existing reward/coupon/pass generator idea is valuable, but it should not consume Cursor credits during the current July 20 Classroom Command Center MVP push.

Current priority:
1. Canvas LLM app work
2. Classroom Command Center display board
3. Smart text boxes / auto-fit text
4. Canva background asset pipeline
5. Timer and classroom routine cards

Reward Maker Studio should remain a future standalone app or future module.

## Future app goal

Reward Maker Studio should become a local-first classroom reward, coupon, sticker, pass, and badge generator.

It should support:
- homework passes
- class coupons
- reward cards
- printable stickers
- student job badges
- QR-enabled job check-in badges
- printable 8.5x11 sheets
- anime / TCG / hero-academy inspired designs
- local save/load
- JSON import/export
- print-safe layouts

## Existing app source

There is an uploaded Reward Maker Studio zip that can be used later as a starting point.

Future local folder recommendation:

~/Projects/reward-maker-studio

Keep it separate from:

~/Projects/classroom-command-center

## Do not build now

Do not spend Cursor credits on this app until the Classroom Command Center MVP is stable.

Do not merge this into the Classroom Command Center display board yet.

## Future integration idea

Classroom Command Center may eventually link to or embed Reward Maker Studio as:

- Rewards module
- Coupon/pass generator
- Printable job badge generator
- QR job check-in generator
- Glow/Grow reward output
- ClassPass reward/pass source
- Canva asset pipeline consumer

## Future preset pass library

Academic:
- Homework Pass
- Morning Work Pass
- Math Homework Pass
- Reading Homework Pass
- Half-Off / Halfies
- No Comp

Leadership:
- Word Attack Leader
- Power Up Leader
- Teacher Chair
- Line Leader
- Choose Next Theme

Comfort:
- Shoes Off
- Comfy Chair
- Teacher Chair
- Desk Pet

Social:
- Lunch with a Friend
- Math Seat Swap
- Reading Seat Swap
- General Seat Swap

Items:
- Water Bottle Sticker
- Toy at Recess
- Small Stuffed Animal
- Show & Tell
- Treasure Box

3D Print:
- Small 3D Print
- Medium 3D Print
- Large 3D Print

Badges/Stickers:
- Ready Position
- Power Up
- Silent Work
- Cleanup Crew
- Plus Ultra Helper
- Classroom Job Badge

## QR job badge future concept

Future flow:

Student has classroom job badge
→ badge has QR code
→ student scans when completing job
→ app records job check-in
→ teacher sees job completed
→ optional Glow/Grow or reward event

Do not build the scan workflow now.

Possible future data model:

type JobBadge = {
  id: string;
  jobId: string;
  studentId?: string;
  title: string;
  qrPayload: string;
  badgeTheme: string;
  printable: boolean;
};

Possible QR payloads:
- local app route
- Google Form
- future Command Center check-in page
- future Chief of Staff endpoint
- plain text job check-in token

## Schedule rule

Do not hardcode school schedule times.

Any snack, lunch, dismissal, transition, ClassPass, or job-check timing must be editable configuration or placeholder-only until the current school year schedule is provided.

Future schedule model:

type RoutineScheduleBlock = {
  id: string;
  label: string;
  startTime?: string;
  endTime?: string;
  screenId: string;
  routinePresetId?: string;
  enabled: boolean;
};

## Future build prompt

When ready, use a focused prompt to repair and upgrade Reward Maker Studio as a separate local-first Vite React app.

Hard constraints for future build:
- no Firebase
- no authentication
- no Gemini / Imagen / OpenAI API
- no backend service
- no real student data
- no hardcoded schedule times
- local-first only
- print-safe
- QR generation local only
