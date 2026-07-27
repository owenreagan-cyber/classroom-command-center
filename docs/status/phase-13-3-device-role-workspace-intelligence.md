# Phase 13.3 — Device Role Manager + Workspace Intelligence

**Branch:** `phase-13-3-device-role-workspace-intelligence`  
**Status:** Validated — architecture layer ready for OmniNote integration

## Summary

Introduced the **device-awareness and workspace orchestration layer** that answers: *"What should run where?"* Classroom Command Center now models device roles, tool capability requirements, teaching workspaces, device-aware launching, and student display routing — without building OmniNote, Bluetooth discovery, or cloud sync.

## Architecture

```
Classroom Command Center (OS)
├── Device Role Manager     → What devices exist and what roles they play
├── Tool Capability System  → What each tool requires (role + display target)
├── Workspace Intelligence  → Which tools combine for each teaching mode
├── Launch Resolver         → Where to open a tool when teacher taps it
└── Display Target Service  → Student-safe routing with privacy boundaries
```

| Module | Path | Role |
|--------|------|------|
| Device types | `src/features/device-manager/types.ts` | DeviceProfile, roles, capabilities |
| Device registry | `src/features/device-manager/deviceRegistry.ts` | Default Mac / iPad / display profiles |
| Capabilities | `src/features/device-manager/capabilities.ts` | Role and capability checks |
| Device store | `src/features/device-manager/deviceStore.ts` | Preferred roles, status overrides |
| Launch resolver | `src/features/device-manager/launchResolver.ts` | Device-aware tool launch |
| Display routing | `src/features/device-manager/displayTargetService.ts` | Student display privacy |
| Tool capabilities | `src/features/teacher-dock/toolCapabilities.ts` | Per-tool device/display requirements |
| Workspace types | `src/features/workspace/types.ts` | TeachingWorkspace model |
| Workspace registry | `src/features/workspace/workspaceRegistry.ts` | Morning, Math, Reading, Reward, Transition |
| Workspace resolver | `src/features/workspace/workspaceResolver.ts` | Priority ordering, promoted tools |
| Workspace store | `src/features/workspace/workspaceStore.ts` | Active/favorite workspace persistence |

## Device roles

| Device | Type | Role | Capabilities |
|--------|------|------|--------------|
| Teacher MacBook | `mac` | `teacher-command-center` | planning, lesson-launch, ai-tools |
| School iPad A16 | `ipad` | `omninote-controller` | apple-pencil, touch, annotation, presentation |
| Apple TV / Samsung | `display` | `student-display` | projector-output, student-safe |

Additional roles reserved for future use: `audio-device`, `development-device`.

## Workspace model

| Workspace | Active tools | Promoted (edge launcher) |
|-----------|--------------|--------------------------|
| **Morning Mode** | Dashboard, Morning Message, Atmosphere, Timers | Same |
| **Math Mode** | Timers, Materials, OmniNote, Display | OmniNote, Timers, Materials, Display |
| **Reading Mode** | Materials, Atmosphere, OmniNote, Mystery Star | Same |
| **Reward Mode** | Prize Board, Atmosphere, Display | Same |
| **Transition Mode** | Timers, Atmosphere, Noise | Same |

Workspaces **promote** tools in the launcher and edge strip. Low-priority tools are visually deprioritized but **never removed** — all tools remain accessible.

## Tool routing

| Tool | Required role | Display target |
|------|---------------|------------------|
| OmniNote | `omninote-controller` | `student-display` |
| Prize Board | `teacher-command-center` | `student-display` |
| Timers | `teacher-command-center` | `student-display` |
| Music / Atmosphere | `teacher-command-center` | `optional` |
| Dashboard, Jobs, Board Control | `teacher-command-center` | `none` |

**Launch flow (example — Open OmniNote):**

1. Teacher taps OmniNote in dock
2. `resolveToolLaunch('omninote', devices)` checks for iPad role
3. If iPad online → control target = iPad, display target = classroom display
4. If iPad offline → `"OmniNote controller unavailable"` with fallback to manual handoff

## Privacy boundaries

Student display (`/display`) must **never** receive:

- Teacher dock state
- Tool registry
- Device registry / store
- Teacher settings
- Private registry fields (`studentId`, `prizeId`, etc.)

Enforced by:

- `DISPLAY_FORBIDDEN_KEYS` in `displayTargetService.ts`
- `sanitizeForDisplayRoute()` strips forbidden keys before routing
- `shouldExposeOnDisplayRoute()` always returns `false`
- Existing route guards: `shouldMountTeacherDock('display')` → `false`

## Persistence

| Key | Version | Fields |
|-----|---------|--------|
| `classroom-device-manager-v1` | 1 | `preferredDeviceRoles`, `deviceOverrides` |
| `classroom-workspace-v1` | 1 | `activeWorkspaceId`, `favoriteWorkspaceId`, `lastActiveWorkspaceId` |

Teacher dock persistence unchanged (`teacher-command-dock-v1`).

## Teacher Dock changes

- **Workspace selector** in expanded launcher (`data-workspace-select`)
- **Workspace-aware ordering** via `getWorkspaceAwareLauncherTools()`
- **Promoted tools** in edge launcher from active workspace
- **Deprioritized styling** for non-workspace tools (opacity, still clickable)

## OmniNote readiness

| Ready | Not built (by design) |
|-------|----------------------|
| iPad role declared (`omninote-controller`) | OmniNote app |
| Tool capability maps OmniNote → iPad + display | Bluetooth discovery |
| Launch resolver with fallback message | AirPlay automation |
| Math/Reading workspaces promote OmniNote | Backend device sync |
| Existing `omninote-bridge` handoff unchanged | Cloud device accounts |

Phase 13.3 provides the **routing contract** OmniNote will plug into: when OmniNote ships, `resolveToolLaunch('omninote')` already knows the control device (iPad) and display target (classroom display).

## Validation

```bash
npm run build
npm run lint
npm run test:device-manager
npm run test:workspace
npm run test:teacher-dock
npm run test:teacher-workstation
npm run test:e2e
```

## Limits (intentional)

- No hardware detection — devices are configured profiles, not discovered
- No backend sync — local storage only
- No authentication or cloud accounts
- Architecture layer only — UI integration limited to workspace selector and priority ordering
