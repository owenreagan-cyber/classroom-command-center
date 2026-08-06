# Display Studio Wallpapers and Themes

## Wallpaper Metadata Model

Wallpapers are described by the `WallpaperMetadata` interface in `src/lib/wallpaperRegistry.ts`:

```typescript
export interface WallpaperMetadata {
  id: string           // kebab-case unique id
  label: string        // Human-readable display name
  category: WallpaperCategory  // 'seasonal' | 'anime' | 'sports' | 'nature' | 'winter' | 'calm' | 'holiday' | 'classroom'
  source: WallpaperSource     // 'builtIn' | 'teacherProvided' | 'localImport' | 'placeholder'
  tags: string[]       // Mood/descriptor tags for search
  assetPath: string | null    // Path relative to public/ for image wallpapers; null for builtIn gradients
  backgroundToken: string | null  // Gradient/solid token for builtIn wallpapers
  dominantColor: string       // Hex color for preview thumbnails
  overlayStrength: 'light' | 'medium' | 'strong'
  recommendedThemes: string[]
  recommendedCategories: string[]
  studentSafe: boolean  // Must be true for /display
  notes?: string       // Teacher tooltip — never shown on /display
}
```

### Built-in Wallpapers (12 entries)

All built-in wallpapers use gradient tokens (no external image files needed):

| ID | Label | Category | Background Token |
|---|---|---|---|
| wp-calm-focus | Calm Focus Blue | calm | calm-focus |
| wp-bright-classroom | Bright Classroom Sky | classroom | bright-classroom |
| wp-soft-pastel | Soft Pastel Purple | calm | soft-pastel |
| wp-game-day | Game Day Red | sports | game-day |
| wp-minimal-projector | Minimal Projector Slate | calm | minimal-projector |
| wp-anime-energy | Anime Energy Purple | anime | anime-energy |
| wp-cozy-seasonal | Cozy Seasonal Amber | seasonal | cozy-seasonal |
| wp-winter-focus | Winter Focus Blue | winter | winter-focus |
| wp-outdoor-nature | Outdoor Nature Green | nature | outdoor-nature |
| wp-sunny-specials | Sunny Specials Orange | classroom | sunny-specials |
| wp-rise-and-shine | Rise and Shine | classroom | rise-and-shine |
| wp-deep-focus | Deep Focus Indigo | calm | deep-focus |

## Asset Placement Rules

### What goes in `public/assets/backgrounds/`
- **Built-in gradients/solids**: No files needed. Tokens resolve via `backgroundStyles.ts` CSS.
- **Canva exports**: Placed in `public/assets/backgrounds/` (managed via `.gitignore` — PNG files not committed, fallback gradients used instead).
- **Teacher-provided images**: Placed in `public/assets/backgrounds/teacher-provided/`. Teacher copies files manually. Entries in wallpaper registry reference these paths.

### What NOT to commit
- Copyrighted/trademarked character assets (e.g., anime characters, brand logos)
- School-specific URLs or photos
- Token/secrets
- Large image files (>1MB — optimize first)
- User-uploaded content without approval

## Safe Wallpaper Import Guidance

For teacher-provided wallpapers:
1. Place image in `public/assets/backgrounds/teacher-provided/`
2. Create a wallpaper metadata entry in the registry with `source: 'teacherProvided'`
3. Set `studentSafe: true` (teacher confirms content is appropriate)
4. Set `assetPath` to the correct public path
5. Provide `dominantColor` for preview thumbnails
6. Tag and categorize appropriately
7. Do NOT commit the image file unless explicitly approved

## Readability Rules for Image Backgrounds

1. **Always use card containers** for text on image backgrounds (`useTextBackground: true` in theme)
2. **Apply overlay/scrim** — theme provides `overlayStrength` CSS gradient
3. **Avoid placing text over complex parts** of the image (character faces, bright effects)
4. **Widgets must have readable surfaces** — widget background class from theme
5. **Text contrast warnings** are teacher-only and shown in the inspector
6. **High-contrast theme** is always available as a fallback for projectors

## Theme System

### Theme Properties (`DisplayStudioTheme`)

Each of the 10 themes defines:
- `backgroundToken` + `backgroundType`: Default background for the theme
- `titleColor`, `messageColor`: Text colors
- `cardHeadingColor`, `cardBodyColor`: Card text colors
- `cardBorderColor`: Card border
- `cardBgClass`, `widgetBgClass`: Tailwind background classes with opacity
- `accentColor`: Highlight/badge color
- `overlayStrength`: Scrim CSS for image backgrounds
- `useTextBackground`: Whether text needs a background container
- `categories`: Which template categories this theme is recommended for

### Theme List

| Theme ID | Label | Best For |
|---|---|---|
| calm-focus | Calm Focus | Instruction, independent work |
| bright-classroom | Bright Classroom | Morning work, arrival |
| soft-pastel | Soft Pastel | Writing, reading, creative work |
| high-contrast | High Contrast | Maximum projector readability |
| game-day | Game Day | Review games, prizes |
| minimal-projector | Minimal Projector | Tests, assessments, quiet work |
| anime-energy | Anime Energy | Special activities, celebrations |
| cozy-seasonal | Cozy Seasonal | Fall, holidays, warm vibes |
| winter-focus | Winter Focus | Winter classroom days |
| outdoor-nature | Outdoor Nature | Science, reading, calm work |

## Wallpaper Grabber Integration (Future Work)

No wallpaper grabber exists in this repository. The only references found are in:
- `docs/architecture/visual-design-and-background-plan.md` (placeholder mention)
- `docs/widget-evolution-roadmap.md` (Seasonal wallpaper factory, Level 3 aspirational)

Integration recommendations:
1. Keep it local-only — no internet dependency during teaching
2. Write to `public/assets/backgrounds/teacher-provided/` (ignored by git)
3. Register entries in wallpaper registry with `source: 'teacherProvided'`
4. Provide dominant color detection
5. Support basic metadata (tags, categories, themes)
6. Do not scrape or auto-download from the web
7. Do not build the grabber in Phase 15 — document for Phase 16+

## Display Studio Background Architecture

```
Screen Template
  └─ background: { type: 'gradient'|'solid'|'image', token: <id> }
       └─ resolveDisplayBackground() in backgroundStyles.ts
            ├─ gradient → DISPLAY_BACKGROUND_GRADIENTS (14 entries)
            ├─ solid → DISPLAY_BACKGROUND_SOLIDS (7 entries)
            └─ image → BACKGROUND_ASSETS (14 entries, Canva-based)

Theme
  └─ Provides coordinated colors, card styles, overlay, readability
  └─ Maps to a background token via resolveThemeBackground()

Wallpaper
  └─ Metadata layer for categorization, search, preview
  └─ Points to background token (builtIn) or assetPath (teacherProvided)
```
