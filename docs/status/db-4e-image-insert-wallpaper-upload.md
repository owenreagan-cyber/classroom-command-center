# DB-4E — Image Insert and Wallpaper Upload

> Status: complete. Teachers can add safe local images as Clean Board objects and
> set a safe local image as the board wallpaper, all local-first, classroom-safe,
> and student-display safe.

## Purpose

Let the teacher add local classroom images (mascot, routine icon, decoration,
screenshot/anchor chart, calm/seasonal background, lesson visual) as board
objects, and optionally set a local image as the board background. Everything is
local-only: no remote URLs, no cloud upload, no Google Drive, no AI generation,
no OCR, no Spotify changes, and no Clean Board redesign.

## Files changed

| File | Change |
| --- | --- |
| `src/features/clean-board/types.ts` | Added `ImageMimeType`, `ImageFit`, `SafeLocalImage`, `ImageObjectConfig`; `image` object config now uses the safe local shape; `BoardBackground` gained a `localImage` variant. |
| `src/features/clean-board/images.ts` | **New.** MIME allowlist, size/dimension caps, magic-byte sniffing, data-URL validation, sanitizers, reject reasons, browser FileReader/canvas read+re-encode, and object builder. |
| `src/features/clean-board/backgrounds.ts` | `effectiveOverlay`/`textToneForBackground` handle `localImage` (default `soft` overlay, `light` text tone). |
| `src/features/clean-board/storage/boardSerialization.ts` | Image configs sanitized via `sanitizeImageObjectConfig`; backgrounds accept a whitelisted `localImage` variant (invalid → default preset). |
| `src/features/clean-board/boardSafety.ts` | Present projection re-whitelists image configs (strips private/unknown keys). |
| `src/features/clean-board/BoardObjectRenderer.tsx` | Image objects render the safe `dataUrl` with `alt`/`fit`/`opacity`. |
| `src/features/clean-board/BoardCanvas.tsx` | `localImage` background renders as a `cover` background image. |
| `src/features/clean-board/BoardToolbar.tsx` | "Image" button opens the local file picker (`onPickImage`) instead of creating a placeholder. |
| `src/features/clean-board/BoardLabPage.tsx` | File picker wiring, async read/validate/add, inline status; image objects built via `createImageObjectFromSafeImage`. |
| `src/features/clean-board/BoardLookPanel.tsx` | "Upload wallpaper" / "Remove" controls with inline safe status. |
| `src/features/clean-board/boardLabTests.ts` | Added DB-4E tests (21 new assertions). |
| `scripts/test-clean-board.sh` | Compile `images.ts`. |

## Accepted file types / limits

- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
- Max file size: 5 MB (`IMAGE_MAX_BYTES`).
- Max dimension: 4096×4096 (`IMAGE_MAX_DIMENSION`).
- Max alt-text length: 160 chars.
- Rejected: SVG, GIF, HTML, PDF, HEIC, unknown/empty MIME, oversized, empty,
  undecodable, and any non-base64 or script/HTML/SVG data-URL payload.

## Image object behavior

- "Add → Image" opens the local file picker (accept `image/png,image/jpeg,image/webp`).
- The file is validated, magic-byte sniffed (a lying/empty `File.type` cannot
  smuggle SVG/HTML/PDF through), decoded for dimensions, and re-encoded through
  a canvas so EXIF/private metadata is never stored.
- A new `image` object is created, centered on the 1920×1080 canvas and sized to
  its aspect ratio (`createImageObjectFromSafeImage`).
- Objects select/move/resize with existing board behavior; render with `alt`,
  `fit` (contain/cover/fill, default `contain`), and `opacity`.
- The original file name is intentionally dropped (never persisted).

## Wallpaper behavior

- "Board Look → Wallpaper → Upload wallpaper" opens the local file picker.
- Validated the same way, then applied as `{ type: 'localImage', image }`.
- The DB-4B readability overlay controls still apply (`soft` default for
  wallpapers); text tone defaults to `light` (dark scrim) for photo backgrounds.
- "Remove" resets back to the default preset background.

## Persistence behavior

- Image objects and local wallpaper flow through the existing `SavedLayout`
  object/background fields, so they survive autosave, saved layouts, scenes,
  load layout, and refresh with no new storage surface.
- Serialization re-whitelists image payloads: `dataUrl` must be a
  `data:image/(png|jpeg|webp);base64,...` URL, `mimeType` is derived from the
  data URL, `byteSize` is capped, `width`/`height` are sanity-checked, `altText`
  is sanitized/capped, and unknown/token/secret-like keys are dropped.
- Corrupt image payloads are dropped (object removed / background falls back to
  the default preset); old preset backgrounds still load.

## Present-mode safety

- Present projection re-whitelists image configs through
  `sanitizeImageObjectConfig`, dropping private/unknown keys.
- Safe image objects and local wallpaper render as content.
- No file inputs, upload controls, edit controls, or teacher-only fields are
  rendered in present mode (all upload UI is edit-only).
- No file names or private metadata are projected.

## iPad behavior

- Image upload lives in the edit toolbar; wallpaper upload lives in the Board
  Look drawer tab. Both are inside the existing `responsivePanels` drawer at
  iPad portrait (820×1180) and landscape (1180×820), so the board remains
  full-width above the drawer and is not crushed.

## Validation

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | 106 passed, 0 failed |
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

- Teacher can add a safe local image object.
- Teacher can set a safe local image wallpaper.
- Image object and wallpaper persist through autosave/saved layouts/scenes.
- Invalid/remote/script/SVG/oversized inputs are rejected or sanitized.
- Present mode renders safe images but exposes no upload/edit controls.
- Existing Spotify, saved layouts, backgrounds, themes, message cards, timers,
  and present safety remain intact.
- Automated validation passes.

**WARN**

- Browser localStorage can still be a storage limit for many images (documented;
  future Drive/native storage will be better).
- True physical iPad automation remains blocked until Web Inspector is enabled.
- Advanced crop/position/sticker library/Drive/native storage deferred.

**FAIL**

- None.

## Deferred items

- Google Drive asset library.
- Native/Tauri file storage.
- Image cropping editor.
- EXIF-aware stripping beyond the browser canvas re-encode (the re-encode is
  implemented and strips EXIF; more advanced orientation/thumbnailing is not).
- Drag-and-drop uploads.
- Remote URLs.
- AI-generated images.
- Image packs / sticker library.
- Advanced wallpaper positioning.
- Physical iPad automation until Web Inspector is enabled.
