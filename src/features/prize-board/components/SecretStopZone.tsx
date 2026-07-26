/** Invisible teacher-only tap zone for secret stop — never visible on display/projector. */
interface SecretStopZoneProps {
  onStop: () => void
  disabled?: boolean
}

export function SecretStopZone({ onStop, disabled = false }: SecretStopZoneProps) {
  return (
    <button
      type="button"
      data-control-id="secret-stop"
      aria-label="Stop spin"
      disabled={disabled}
      onClick={onStop}
      className="fixed bottom-0 right-0 z-[100] h-20 w-20 cursor-default opacity-0"
      style={{ touchAction: 'manipulation' }}
    />
  )
}
