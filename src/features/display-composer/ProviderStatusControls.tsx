import { useAiProviderSettingsStore } from './aiProviderSettingsStore'
import { providerStatusLabel, type LessonMessageProviderKind, type LessonMessageProviderMode } from './aiProviderConfig'
import { draftsUsedToday } from './aiProviderUsage'

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500'
const labelClass = 'block text-[10px] font-semibold uppercase tracking-wide text-slate-400'
const secondaryBtn =
  'rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800'

/**
 * Compact provider status/control area (Phase 14E). Lives only inside the
 * Teacher Dock's Display Composer panel — never mounted on /display (the
 * student route never mounts the dock at all). Deterministic Local is the
 * default and the only mode with no further configuration; Provider If
 * Available requires the teacher to explicitly pick a kind, supply their own
 * endpoint, and enable it — there is no key/token field anywhere here.
 */
export function ProviderStatusControls() {
  const settings = useAiProviderSettingsStore((s) => s.settings)
  const draftCounter = useAiProviderSettingsStore((s) => s.draftCounter)
  const updateSettings = useAiProviderSettingsStore((s) => s.updateSettings)
  const resetToDeterministicOnly = useAiProviderSettingsStore((s) => s.resetToDeterministicOnly)

  const usedToday = draftsUsedToday(draftCounter)
  const showsEndpointFields = settings.provider === 'localOllama' || settings.provider === 'customEndpoint'

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3" data-provider-status-controls>
      <p className={labelClass}>Generator Mode</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Local deterministic drafts are always available. Provider drafts are optional and may use an external
        model if configured. Generated text never sends directly to display.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className={inputClass}
          style={{ width: 'auto' }}
          aria-label="Generator mode"
          value={settings.mode}
          onChange={(e) => updateSettings({ mode: e.target.value as LessonMessageProviderMode })}
        >
          <option value="deterministicOnly">Deterministic Local</option>
          <option value="providerIfAvailable">Provider If Available</option>
        </select>

        <span className="text-[11px] font-semibold text-slate-300" data-provider-status>
          Status: {providerStatusLabel(settings.lastProviderStatus)}
        </span>

        {settings.mode !== 'deterministicOnly' && (
          <button type="button" className={secondaryBtn} onClick={resetToDeterministicOnly}>
            Use Deterministic Mode
          </button>
        )}
      </div>

      {settings.mode === 'providerIfAvailable' && (
        <div className="mt-2 flex flex-col gap-2 border-t border-slate-800 pt-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Provider</span>
            <select
              className={inputClass}
              value={settings.provider}
              onChange={(e) => updateSettings({ provider: e.target.value as LessonMessageProviderKind })}
            >
              <option value="none">None</option>
              <option value="openaiCompatible">Hosted (OpenAI-compatible) — unavailable</option>
              <option value="localOllama">Local Ollama</option>
              <option value="customEndpoint">Custom Endpoint</option>
            </select>
          </label>

          {settings.provider === 'openaiCompatible' && (
            <p className="text-[11px] text-amber-300/80">
              Hosted providers need an API key. This app has no safe place to store one, so this option always
              falls back to deterministic mode.
            </p>
          )}

          {showsEndpointFields && (
            <>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Endpoint URL (your own local server)</span>
                <input
                  className={inputClass}
                  placeholder="e.g. http://localhost:11434/api/generate"
                  value={settings.endpoint ?? ''}
                  onChange={(e) => updateSettings({ endpoint: e.target.value || undefined })}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Model Name (optional)</span>
                <input
                  className={inputClass}
                  value={settings.modelName ?? ''}
                  onChange={(e) => updateSettings({ modelName: e.target.value || undefined })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.providerEnabled}
                  onChange={(e) => updateSettings({ providerEnabled: e.target.checked })}
                />
                Enable provider for draft generation
              </label>
              {!settings.providerEnabled && (
                <p className="text-[11px] text-slate-500">
                  Provider is configured but not enabled — Generate Draft will use deterministic mode.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] text-slate-500">
        Drafts used today: {usedToday}
        {settings.dailyDraftLimit ? ` / ${settings.dailyDraftLimit}` : ''}
      </p>
    </div>
  )
}
