import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEVICE_STORAGE_KEY,
  DEVICE_STORAGE_VERSION,
  type DevicePersistedState,
  type DeviceProfile,
  type DeviceRole,
} from './types'
import {
  DEFAULT_DEVICE_STATE,
  hydrateDeviceState,
} from './devicePersistence'
import { hydrateDeviceRegistry } from './deviceRegistry'

interface DeviceStore extends DevicePersistedState {
  getDevices: () => DeviceProfile[]
  getPreferredDeviceForRole: (role: DeviceRole) => DeviceProfile | undefined
  setPreferredDeviceForRole: (role: DeviceRole, deviceId: string) => void
  updateDeviceStatus: (deviceId: string, status: DeviceProfile['status']) => void
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DEVICE_STATE,

      getDevices: () => hydrateDeviceRegistry(get().deviceOverrides),

      getPreferredDeviceForRole: (role) => {
        const devices = get().getDevices()
        const preferredId = get().preferredDeviceRoles[role]
        if (preferredId) {
          const preferred = devices.find((device) => device.id === preferredId)
          if (preferred) return preferred
        }
        return devices.find((device) => device.role === role)
      },

      setPreferredDeviceForRole: (role, deviceId) => {
        const device = hydrateDeviceRegistry(get().deviceOverrides).find(
          (entry) => entry.id === deviceId && entry.role === role,
        )
        if (!device) return
        set((state) => ({
          preferredDeviceRoles: { ...state.preferredDeviceRoles, [role]: deviceId },
        }))
      },

      updateDeviceStatus: (deviceId, status) => {
        set((state) => ({
          deviceOverrides: {
            ...state.deviceOverrides,
            [deviceId]: { ...state.deviceOverrides[deviceId], status },
          },
        }))
      },
    }),
    {
      name: DEVICE_STORAGE_KEY,
      version: DEVICE_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        preferredDeviceRoles: state.preferredDeviceRoles,
        deviceOverrides: state.deviceOverrides,
      }),
      migrate: (persisted) => hydrateDeviceState(persisted),
    },
  ),
)

export const selectPreferredDeviceRoles = (state: DeviceStore) =>
  state.preferredDeviceRoles
