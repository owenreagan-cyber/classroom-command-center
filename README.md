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

## Classroom display setup

The real daily setup: M1 MacBook shows `/display` full screen on the
classroom TV; `/control` runs separately (on the M1 or, once
[cross-device control](docs/architecture/cross-device-control.md) is built,
on an iPad).

**On the Mac:**

1. **System Settings → Displays → arrangement:** set the TV to **Extend**,
   not Mirror (Mirror duplicates the Mac's own screen instead of giving
   `/display` a dedicated one, and won't let it use the TV's full
   resolution).
2. Pick a **16:9 resolution** for the TV in Displays settings (1920×1080,
   2560×1440, or 3840×2160 — whichever the TV and connection support
   cleanly). 16:9 is the case that's guaranteed pixel-perfect edge to edge;
   anything else still fills the screen with no black bars, but 16:9 is the
   one to aim for.
3. **Launch the display:** `npm run display:launch` (see below for making
   this a double-click icon).
4. **Keep the M1 awake:** `/display` already requests a screen wake lock on
   its own, but the Mac itself can still sleep. In System Settings → Lock
   Screen (or Energy Saver on older macOS), disable "Turn display off" /
   set "Prevent automatic sleeping" while plugged in, since this machine is
   meant to stay on and projecting all day.

**On the Samsung TV (AirPlay or HDMI):** set **Picture Size → 16:9
Standard**, and **Fit to Screen** (not "Fit to Screen" disabled / not a
zoom/overscan mode) — some Samsung models scale or crop an incoming 16:9
signal by default, which reintroduces exactly the bars/cropping the app
itself works to avoid. Match the TV's Picture Size setting to whatever
resolution you picked in step 2 above.

**Chrome kiosk vs. Safari fullscreen — Chrome is used, here's why:**
Chrome's `--kiosk --app=<url>` combination is fully scriptable end to end —
no window chrome (no title bar, address bar, or tabs), and both the
starting window position (which display it lands on) and the fullscreen
state are set via command-line flags, so it comes up correctly with zero
manual clicks or gestures every time. Safari has no CLI equivalent: getting
it into a truly chromeless fullscreen state non-interactively would need
AppleScript UI-automation to simulate the fullscreen keystroke, which is
less reliable for something meant to "just work" every morning. The
trade-off is a one-time Chrome install, and quitting kiosk mode is Cmd+Q
rather than clicking a visible close button (there is no window chrome to
click).

**Making `npm run display:launch` double-clickable:** the simplest option is
a `.command` file, which Finder runs in Terminal when double-clicked:

```bash
cat > ~/Desktop/"Launch Classroom Display.command" <<'EOF'
#!/usr/bin/env bash
cd /path/to/classroom-command-center
npm run display:launch
EOF
chmod +x ~/Desktop/"Launch Classroom Display.command"
```

Replace `/path/to/classroom-command-center` with this repo's actual path on
the M1. (An Automator "Application" wrapping the same `npm run
display:launch` command works too, and gives a normal-looking app icon
instead of a `.command` file, if preferred.)

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
