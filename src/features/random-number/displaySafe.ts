/** Student-safe snapshot for the random number display overlay. */
export interface RandomNumberDisplaySnapshot {
  value: number
}

export function toDisplaySafeRandomNumberSnapshot(
  lastResult: number | null,
  showOnDisplay: boolean,
): RandomNumberDisplaySnapshot | null {
  if (!showOnDisplay || lastResult === null) return null
  return { value: lastResult }
}

export function shouldShowRandomNumberDisplay(
  lastResult: number | null,
  showOnDisplay: boolean,
): boolean {
  return showOnDisplay && lastResult !== null
}
