# DB-4C — Directions / Message Card Widget

> Status: complete. A classroom-safe Directions / Message Card widget for Clean
> Board, built on DB-4B backgrounds/theme picker and DB-4A persistence.

## Purpose

Give teachers a clean, readable instruction card for the board: a card with a
semantic label (Do Now, Objective, Directions, Reminder, Transition, Exit
Ticket, Announcement), a plain-text message, and simple styling. This is the
first general-purpose teacher content widget.

This is a "clean classroom instruction card", not a document editor. There is no
rich text editing, no AI generation, no Google Drive sync, no uploaded images,
no markdown rendering, and no Clean Board redesign.

## Widget model

A message card is a `BoardObject` with `kind: 'messageCard'`, following the
existing discriminated-config pattern (the `type` discriminator from the brief
is expressed as `kind`/`config.kind` for consistency with every other object).

```ts
type MessageCardKind =
  | 'doNow' | 'objective' | 'directions' | 'reminder'
  | 'transition' | 'exitTicket' | 'announcement'

type MessageCardTone = 'neutral' | 'calm' | 'focus' | 'warning' | 'success'
type MessageCardTextSize = 'small' | 'medium' | 'large'

type MessageCardConfig = {
  kind: 'messageCard'
  title: string
  message: string
  cardKind: MessageCardKind
  tone: MessageCardTone
  textSize: MessageCardTextSize
  checklistStyle: boolean
}
```

Plain text only — no HTML, markdown, links, images, or remote content. `title`
and `message` are rendered as text (React escapes by construction), so nothing
can execute.

## Presets

`src/features/clean-board/messageCards.ts` defines seven classroom-safe presets
(`MESSAGE_CARD_PRESETS`), keyed by `MessageCardKind`:

| kind | title | tone | checklist |
| --- | --- | --- | --- |
| `doNow` | Do Now | focus | yes |
| `objective` | Objective | calm | no |
| `directions` | Directions | focus | yes |
| `reminder` | Reminder | neutral | no |
| `transition` | Transition | warning | no |
| `exitTicket` | Exit Ticket | success | no |
| `announcement` | Announcement | calm | no |

`DEFAULT_MESSAGE_CARD_KIND` is `directions`; `defaultMessageCardConfig()` builds
the default card and `getMessageCardPreset(kind)` returns a full preset.

## Edit-mode behavior

- A **Message Card** button in the edit toolbar adds a default card (selected on
  add, mirroring the Spotify add flow).
- Selecting a card opens a compact teacher panel (`MessageCardTeacherPanel`)
  with: card type selector (applies a preset, updating title/message/cardKind/
  tone/textSize/checklistStyle), title field, message textarea, tone selector,
  text size selector, and checklist-style toggle.
- Edit mode clamps/scales long messages (body scrolls in edit mode).

## Present-mode behavior

- Shows only the finished card: title, plain-text message, accent bar, and
  optional checklist markers.
- No edit controls, textarea, buttons, or teacher panel.
- Long messages are clamped (no visible scrollbar) in present mode.

## Rendering

- The card uses the theme's `surface` (`glass` / `solid` / `minimal`) and
  `textTone` (`light` / `dark`) to stay readable on any background.
- A tone accent (`neutral`/`calm`/`focus`/`warning`/`success`) drives a left
  accent bar and checklist markers.
- `textSize` maps to title/body font sizes (logical px on the 1920×1080 canvas).
- Message text uses `white-space: pre-wrap` to preserve line breaks; no HTML is
  rendered.

## Persistence behavior

Message cards persist through the existing `SavedLayout` object list, so they
flow through autosave, saved layouts, scenes, load layout, and refresh with no
new storage surface. Serialization is unchanged apart from a `messageCard` case
in the config whitelist.

## Sanitization / safety rules

- `sanitizeMessageCardConfig` (single source of truth, used by both
  `boardSerialization` on load and `boardSafety` on present projection) rebuilds
  the config from a strict whitelist, dropping unknown/private keys.
- `sanitizePlainText` neutralizes text: strips `<script>` blocks and HTML tags,
  strips remote URLs (`https://…`, `ftp://…`, `file://…`, `www.…`), and strips
  C0/C1 control characters (preserving tab/newline/CR). Plain math like `x < 5`
  is preserved.
- Invalid `cardKind`/`tone`/`textSize` recover to defaults.
- No token-like keys, remote URLs, file paths, or private data enter board
  state; the card model has no `src`/`url`/`path` fields.

## Validation

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | 67 passed, 0 failed |
| `npm run test:clean-board-spotify` | 69 passed, 0 failed |
| `npm run build` | PASS (`tsc -b && vite build`) |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | 124 passed |
| `npm run test:display-composer` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors only |

## PASS / WARN / FAIL

**PASS**

- Teacher can add a message/directions card.
- Teacher can edit title and message.
- Teacher can choose card type, tone, and text size.
- Card renders clearly on the board.
- Card persists in saved layouts/scenes/autosave.
- Present mode shows only the safe card, not edit controls.
- No HTML/script/remote URL/token/private data is stored or projected.
- Existing Spotify, backgrounds, themes, and saved layouts still work.

**WARN**

- Rich text editing deferred.
- Markdown deferred.
- AI-generated directions deferred.
- Multi-card templates deferred.
- Advanced typography polish deferred.

**FAIL**

- None.
