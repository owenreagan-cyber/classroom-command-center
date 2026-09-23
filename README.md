# Classroom Command Center

A locally-run, single-teacher classroom app: build and run daily classroom
screens, timers, and tools, and project them safely to students. Local-first
— no cloud, no accounts, state lives in the browser.

- **`/control`** — the teacher-facing surface: build screens, run timers, the
  student picker, noise tracking, and more.
- **`/display`** — the student-facing projector/TV view. Renders only a
  filtered, student-safe projection of what the teacher sends to it; teacher
  chrome, notes, tokens, and roster data never reach this route.

**Run it:** `npm run dev` (local, single machine). For testing across two
devices on the same network, see the LAN section below — it's dev-only, not
the real classroom setup.

Deeper design docs live in [`docs/architecture/`](docs/architecture/),
including the overall
[product direction](docs/architecture/command-center-product-direction.md),
the [cross-device control design](docs/architecture/cross-device-control.md),
and the
[target data model](docs/architecture/board-scene-widget-target-model.md).

## LAN / Projector Access (development convenience only)

`npm run dev:lan` runs Vite's dev server exposed to the network (bound to
`0.0.0.0:5173` instead of just `localhost`), so another device on the same
Wi-Fi can load `/control` or `/display` in a browser. This is **for testing
only, not classroom use** — it makes the app reachable from a second device,
nothing more.

**LAN reachability alone does not sync `/control` and `/display` across
devices.** Each device's browser has its own separate local storage, so two
devices loading these routes over `dev:lan` will not stay in sync the way two
tabs in the same browser do today — a change made on one won't appear on the
other without a manual refresh, if at all.

The real classroom setup (M1 running the display, iPad as a walk-around
remote over Wi-Fi) needs a dedicated sync server, not just network
reachability. That's designed, not yet built — see
[`docs/architecture/cross-device-control.md`](docs/architecture/cross-device-control.md).

To try `dev:lan` during development:

1. On the host Mac: `npm run dev:lan`
2. Find its LAN IP (System Settings → Network, or `ipconfig getifaddr en0`)
3. On another device: `http://<HOST-IP>:5173/control` or `.../display`

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
