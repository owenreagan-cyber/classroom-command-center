# Device Role Contract

Status: hardened contract (Phase 13.3)  
Purpose: define how Classroom Command Center models classroom devices before OmniNote integration.

## DeviceProfile

Every device in the local registry conforms to `DeviceProfile`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable local identifier (e.g. `teacher-mac`, `school-ipad`) |
| `name` | `string` | Human-readable label shown in teacher UI |
| `type` | `DeviceType` | Hardware form factor: `mac`, `ipad`, `apple-tv`, `display`, `unknown` |
| `role` | `DeviceRole` | Classroom operating role (see below) |
| `capabilities` | `DeviceCapability[]` | Capability tokens the device exposes |
| `status` | `DeviceStatus` | `online`, `offline`, or `unknown` |
| `lastSeen` | `string \| null` | Optional ISO timestamp for future sync layers |

Persistence is **not** stored on the profile itself. Device preferences and overrides persist through `DevicePersistedState` (`classroom-device-manager-v1`):

- `preferredDeviceRoles` — map a role to a preferred device id
- `deviceOverrides` — per-device name/status patches

Implementation: `src/features/device-manager/types.ts`, `devicePersistence.ts`, `deviceStore.ts`.

## Required roles

| Role | Purpose |
|------|---------|
| `teacher-command-center` | Teacher Mac — planning, curriculum, launch |
| `omninote-controller` | iPad — Apple Pencil annotation surface |
| `student-display` | Apple TV / projector — student-safe output |
| `audio-device` | Reserved — classroom audio output |
| `development-device` | Unknown or dev hardware placeholder |

## Classroom device assignments

### MacBook — `teacher-command-center`

**Default profile:** `teacher-mac` (Teacher MacBook)

**Responsibilities:**

- Command Center hub
- Curriculum and planning
- Tool launch and classroom flow
- Teacher-only controls (dock, registry, device settings)

**Capabilities:** `planning`, `lesson-launch`, `ai-tools`

**Must never:** route private registry or dock state to student display.

---

### iPad A16 — `omninote-controller`

**Default profile:** `school-ipad` (School iPad A16)

**Responsibilities:**

- Apple Pencil annotation
- OmniNote teaching surface (future app)
- Touch-first instruction UI

**Capabilities:** `apple-pencil`, `touch`, `annotation`, `presentation`

**Launch rule:** Tools requiring `omninote-controller` (e.g. OmniNote) resolve control to this device. If offline, launch fails with: *"OmniNote controller unavailable"*.

---

### Apple TV + Samsung — `student-display`

**Default profile:** `classroom-display` (Apple TV / Samsung Display)

**Responsibilities:**

- Student-safe visual output
- Projector / classroom display experience
- Approved lesson visuals, animations, and games only

**Capabilities:** `projector-output`, `student-safe`

**Must never receive:**

- Teacher dock or tool registry
- Device registry / settings
- Private roster or teacher settings
- Raw student identifiers in display payloads

Enforced by `DISPLAY_FORBIDDEN_KEYS` and `resolveDisplayTarget()` in `displayTargetService.ts`.

## Routing contract

```
Teacher tap → resolveToolLaunch(toolId, devices)
           → control device (by required role)
           → display device (when displayTarget === 'student-display')

Display payload → sanitizeForDisplayRoute()
               → resolveDisplayTarget()
               → student-display device id or blocked
```

## Intentional limits

- No hardware discovery, Bluetooth, or AirPlay automation in this phase
- No authentication or cloud device accounts
- Devices are configured profiles, not live network endpoints
