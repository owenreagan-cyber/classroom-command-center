export type PacketKind = 'daily-brief' | 'full-backup'

export const CURRENT_PACKET_VERSION = 1
export const MIN_SUPPORTED_PACKET_VERSION = 1
export const MAX_SUPPORTED_PACKET_VERSION = 1

/**
 * Given an older version, return a migration function that transforms
 * the payload to the current version.
 * Returns null if no migration is needed or the version is unsupported.
 */
export function migratePacketPayload(
  kind: PacketKind,
  fromVersion: number,
  payload: unknown,
): unknown {
  if (fromVersion >= CURRENT_PACKET_VERSION) return payload
  if (fromVersion < MIN_SUPPORTED_PACKET_VERSION) {
    throw new Error(
      `Packet version ${fromVersion} is too old and cannot be migrated. ` +
      `Minimum supported version is ${MIN_SUPPORTED_PACKET_VERSION}.`,
    )
  }

  // Future migration chain: fromVersion -> fromVersion+1 -> ... -> CURRENT
  let migrated = payload
  for (let v = fromVersion; v < CURRENT_PACKET_VERSION; v++) {
    migrated = applyMigrationStep(kind, v, migrated)
  }
  return migrated
}

function applyMigrationStep(
  kind: PacketKind,
  fromVersion: number,
  payload: unknown,
): unknown {
  // Currently only version 1 exists, so no migration steps yet.
  // Add `case 1:` when we introduce version 2.
  void kind
  void fromVersion
  return payload
}
