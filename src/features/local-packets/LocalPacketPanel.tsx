import { useRef, useState } from 'react'
import type { DailyBriefPacketPayload, FullBackupPacketPayload, LocalPacketEnvelope } from './types'
import { parsePacketFile } from './packetImport'
import { createDailyBriefPayload, createBackupPayload, downloadPacket, generateDailyBriefFilename, generateBackupFilename, createEnvelope, type ExportSource } from './packetExport'
import { createDailyBriefPlan, createBackupPlan, type ApplyPlan } from './packetApplyPlan'
import { LIMITS } from './packetValidation'
import { applyDailyBriefToStores, restoreBackupToStores, applyUndo, getUndoSlot, clearUndoSlot } from './packetStoreAdapter'

type TabId = 'export-brief' | 'import-brief' | 'backup' | 'restore' | 'result'

interface LocalPacketPanelProps {
  // Board content for export
  boardContents: Record<string, unknown>
  boardActiveScreen?: string
  boardMode?: string
  boardBackgroundId?: string
  boardTeacherNotes?: unknown[]
  boardCardVisibility?: unknown
  boardCustomPresets?: unknown[]
  boardNoiseTrackers?: unknown
  boardClassWorkspaces?: unknown
  boardActivePageId?: string | null
  boardTodayPrep?: unknown
  boardMorningMessage?: unknown
  // Timer state
  timerSimpleTimers?: Record<string, { status: string }>
  timerPhaseTimer?: { status: string }
  timerConfig?: unknown
  // Picker state
  pickerStudents?: unknown[]
  pickerHistory?: unknown[]
  pickerArchivedStudents?: unknown[]
  pickerCoachingConfig?: unknown
  pickerSettings?: unknown
  pickerActiveMysterySessions?: unknown
}

export function LocalPacketPanel(props: LocalPacketPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('export-brief')
  const [status, setStatus] = useState('')
  const [showDetail, setShowDetail] = useState(false)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Local Packets
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Export or import local JSON files. All data stays on this device.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-700 pb-2">
        {(['export-brief', 'import-brief', 'backup', 'restore', 'result'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setShowDetail(false) }}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {activeTab === 'export-brief' && <ExportBriefTab {...props} onStatus={setStatus} />}
        {activeTab === 'import-brief' && <ImportBriefTab {...props} onStatus={setStatus} />}
        {activeTab === 'backup' && <BackupTab {...props} onStatus={setStatus} />}
        {activeTab === 'restore' && <RestoreTab {...props} onStatus={setStatus} />}
        {activeTab === 'result' && <ResultTab status={status} showDetail={showDetail} onShowDetail={setShowDetail} />}
      </div>
    </section>
  )
}

// ── Export Daily Brief Tab ────────────────────────────────────────────

function ExportBriefTab({ boardContents, boardActiveScreen, onStatus }: LocalPacketPanelProps & { onStatus: (s: string) => void }) {
  const handleExportAll = () => {
    const source: ExportSource = {
      title: 'Full Board Export',
      targetScreens: Object.keys(boardContents || {}),
      screenContents: boardContents as Partial<Record<string, unknown>> as ExportSource['screenContents'],
    }
    const packet = createDailyBriefPayload(source)
    const envelope = createEnvelope('daily-brief', packet)
    const filename = generateDailyBriefFilename(packet)
    downloadPacket(envelope, filename)
    onStatus(`Daily Brief exported as "${filename}". No student data or private tracking info is included.`)
  }

  const handleExportCurrent = () => {
    if (!boardActiveScreen) { onStatus('No active screen to export.'); return }
    const source: ExportSource = {
      title: `${boardActiveScreen} Export`,
      targetScreens: [boardActiveScreen],
      screenContents: boardContents as Partial<Record<string, unknown>> as ExportSource['screenContents'],
    }
    const packet = createDailyBriefPayload(source)
    const envelope = createEnvelope('daily-brief', packet)
    const filename = generateDailyBriefFilename(packet)
    downloadPacket(envelope, filename)
    onStatus(`"${boardActiveScreen}" exported as "${filename}". Private data was excluded.`)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-slate-500">
        Export a Daily Brief packet containing only instructional content and visible display fields.
        <strong className="text-slate-400"> Roster, history, and private observations are never included.</strong>
      </p>
      <button
        type="button"
        onClick={handleExportAll}
        className="w-full rounded-xl border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
      >
        Export all screens
      </button>
      <button
        type="button"
        onClick={handleExportCurrent}
        className="w-full rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
      >
        Export current screen
      </button>
    </div>
  )
}

// ── Import Daily Brief Tab ────────────────────────────────────────────

function ImportBriefTab(props: LocalPacketPanelProps & { onStatus: (s: string) => void }) {
  const { onStatus } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ envelope: LocalPacketEnvelope; payload: DailyBriefPacketPayload; plan: ApplyPlan } | null>(null)
  const [error, setError] = useState('')

  const importCurrentTimers = {
    simpleTimers: props.timerSimpleTimers || {},
    phaseTimer: props.timerPhaseTimer || { status: 'idle' },
    routineControls: {},
  }
  const importCurrentMystery = (props.pickerActiveMysterySessions || {}) as Record<string, { status: string } | null | undefined>

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')

    try {
      if (file.size > LIMITS.maxFileSizeBytes) {
        setError(`File exceeds the ${LIMITS.maxFileSizeBytes / 1024 / 1024} MB size limit.`)
        return
      }

      const raw = await file.text()
      const parsed = parsePacketFile(raw)
      if (!parsed.success || !parsed.migratedPayload) {
        setError(parsed.errors.join('\n'))
        return
      }

      if (parsed.envelope?.kind !== 'daily-brief') {
        setError('This is a full backup file, not a Daily Brief packet. Use the Restore tab instead.')
        return
      }

      const payload = parsed.migratedPayload as DailyBriefPacketPayload
      const plan = createDailyBriefPlan(payload, importCurrentTimers, importCurrentMystery)

      setPending({ envelope: parsed.envelope, payload, plan })
      onStatus('Review the import summary below, then confirm to apply.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  const clearPending = () => {
    setPending(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleApply = () => {
    if (!pending) return
    const { payload, plan } = pending

    // Build selected field groups from checkboxes
    const selectedFieldGroups = plan.fieldGroups
      .filter(f => f.selected && f.included)
      .map(f => ({ screenId: f.screenId, groupId: f.groupId }))

    if (selectedFieldGroups.length === 0) {
      onStatus('No field groups selected. Nothing to apply.')
      return
    }

    // Use the store adapter to apply directly to Zustand stores
    const result = applyDailyBriefToStores({
      packet: payload,
      selectedFieldGroups,
    })

    if (result.success) {
      onStatus(`Daily Brief "${payload.metadata.title}" applied to ${selectedFieldGroups.length} field group(s) from ${new Set(selectedFieldGroups.map(g => g.screenId)).size} screen(s). Undo available.`)
    } else {
      onStatus(`Apply completed with ${result.errors.length} error(s): ${result.errors.join('; ')}`)
    }
    clearPending()
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-slate-500">
        Import a Daily Brief JSON file. File contents are never sent over the network.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
      />

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-3">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-300">Error</h3>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-rose-200/80">{error}</pre>
        </div>
      )}

      {pending && (
        <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-950/20 p-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
            Import Preview: {pending.payload.metadata.title}
          </h3>
          <p className="text-[10px] text-amber-100/70">
            Created: {pending.payload.metadata.createdAt.slice(0, 10)}
            {pending.payload.metadata.intendedDate ? ` | Intended: ${pending.payload.metadata.intendedDate}` : ''}
          </p>

          <div className="max-h-32 space-y-1 overflow-y-auto">
            {pending.plan.fieldGroups.filter(f => f.included).map((fg) => (
              <div key={`${fg.screenId}-${fg.groupId}`} className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2 py-1">
                <input
                  type="checkbox"
                  checked={fg.selected}
                  onChange={() => { fg.selected = !fg.selected; setPending({ ...pending }) }}
                  className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-[10px] text-slate-300">{fg.label}</span>
              </div>
            ))}
          </div>

          {pending.plan.activeStateConflicts.activeTimers.length > 0 && (
            <p className="text-[10px] leading-relaxed text-amber-400/80">
              Active timer detected on: {pending.plan.activeStateConflicts.activeTimers.join(', ')}.
              Timer runtime state is preserved.
            </p>
          )}

          {pending.plan.activeStateConflicts.activeMysterySessions.length > 0 && (
            <p className="text-[10px] leading-relaxed text-amber-400/80">
              Active Mystery Star session detected. Session state is preserved.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg border border-amber-300/50 bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Apply Selected
            </button>
            <button
              type="button"
              onClick={clearPending}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Full Backup Tab ──────────────────────────────────────────────────

function BackupTab(props: LocalPacketPanelProps & { onStatus: (s: string) => void }) {
  const { onStatus } = props
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(['board', 'timers', 'coachingConfig', 'pickerSettings']))

  const allCategories = [
    { id: 'board', label: 'Board Content', defaultSelected: true },
    { id: 'timers', label: 'Timer Preferences', defaultSelected: true },
    { id: 'rosters', label: 'Student Rosters', defaultSelected: false },
    { id: 'pickerHistory', label: 'Picker History', defaultSelected: false },
    { id: 'archivedStudents', label: 'Archived Students', defaultSelected: false },
    { id: 'coachingConfig', label: 'Coaching Configuration', defaultSelected: true },
    { id: 'pickerSettings', label: 'Picker Settings', defaultSelected: true },
    { id: 'activeMysterySessions', label: 'Active Mystery Sessions', defaultSelected: false },
  ]

  const toggle = (id: string) => {
    const next = new Set(selectedCats)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedCats(next)
  }

  const handleBackup = () => {
    if (selectedCats.size === 0) { onStatus('Select at least one category to back up.'); return }

    const payload = createBackupPayload(
      {
        board: {
          mode: props.boardMode,
          activeScreen: props.boardActiveScreen,
          activePageId: props.boardActivePageId,
          classWorkspaces: props.boardClassWorkspaces,
          backgroundId: props.boardBackgroundId,
          contents: props.boardContents,
          teacherNotes: props.boardTeacherNotes,
          todayPrep: props.boardTodayPrep,
          morningMessage: props.boardMorningMessage,
          cardVisibility: props.boardCardVisibility,
          customPresets: props.boardCustomPresets,
          noiseTrackers: props.boardNoiseTrackers,
        },
        timers: {
          simpleTimers: props.timerSimpleTimers,
          phaseTimer: props.timerPhaseTimer,
          routineControls: {},
          config: props.timerConfig,
        },
        rosters: props.pickerStudents,
        pickerHistory: props.pickerHistory,
        archivedStudents: props.pickerArchivedStudents,
        coachingConfig: props.pickerCoachingConfig,
        pickerSettings: props.pickerSettings,
        activeMysterySessions: props.pickerActiveMysterySessions,
      },
      Array.from(selectedCats),
    )
    const envelope = createEnvelope('full-backup', payload)
    const filename = generateBackupFilename()
    downloadPacket(envelope, filename)
    onStatus(`Full backup downloaded as "${filename}" with ${selectedCats.size} category/categories.`)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-slate-500">
        Create a full local backup of selected Command Center categories.
      </p>

      <div className="space-y-1">
        {allCategories.map((cat) => {
          const isHighRisk = ['activeMysterySessions', 'pickerHistory', 'archivedStudents', 'rosters'].includes(cat.id)
          return (
            <label key={cat.id} className="flex items-center gap-2 rounded-lg bg-slate-950/40 px-2 py-1.5 cursor-pointer hover:bg-slate-950/60">
              <input
                type="checkbox"
                checked={selectedCats.has(cat.id)}
                onChange={() => toggle(cat.id)}
                className={`w-3 h-3 rounded border-slate-700 bg-slate-800 focus:ring-cyan-500 ${isHighRisk ? 'text-amber-500' : 'text-cyan-500'}`}
              />
              <span className={`text-[10px] ${isHighRisk ? 'text-amber-300/80' : 'text-slate-300'}`}>
                {cat.label}
              </span>
            </label>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleBackup}
        className="w-full rounded-xl border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
      >
        Download backup ({selectedCats.size} categories)
      </button>
    </div>
  )
}

// ── Restore Tab ───────────────────────────────────────────────────────

function RestoreTab(props: LocalPacketPanelProps & { onStatus: (s: string) => void }) {
  const { onStatus } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<{ envelope: LocalPacketEnvelope; payload: FullBackupPacketPayload; categories: { id: string; label: string; present: boolean; selected: boolean; highRisk: boolean }[]; activeTimers: string[]; activeMystery: string[] } | null>(null)
  const [replaceTimerRuntime, setReplaceTimerRuntime] = useState(false)
  const [replaceActiveMystery, setReplaceActiveMystery] = useState(false)

  const importCurrentTimers = {
    simpleTimers: props.timerSimpleTimers || {},
    phaseTimer: props.timerPhaseTimer || { status: 'idle' },
    routineControls: {},
  }
  const importCurrentMystery = (props.pickerActiveMysterySessions || {}) as Record<string, { status: string } | null | undefined>

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')

    try {
      if (file.size > LIMITS.maxFileSizeBytes) {
        setError(`File exceeds the ${LIMITS.maxFileSizeBytes / 1024 / 1024} MB size limit.`)
        return
      }

      const raw = await file.text()
      const parsed = parsePacketFile(raw)
      if (!parsed.success || !parsed.migratedPayload) {
        setError(parsed.errors.join('\n'))
        return
      }

      if (parsed.envelope?.kind !== 'full-backup') {
        setError('This is a Daily Brief file, not a full backup. Use the Import Daily Brief tab instead.')
        return
      }

      const payload = parsed.migratedPayload as FullBackupPacketPayload
      const backupPlan = createBackupPlan(payload, importCurrentTimers, importCurrentMystery)

      setPending({
        envelope: parsed.envelope,
        payload,
        categories: backupPlan.categories,
        activeTimers: backupPlan.activeStateConflicts.activeTimers,
        activeMystery: backupPlan.activeStateConflicts.activeMysterySessions,
      })
      setReplaceTimerRuntime(false)
      setReplaceActiveMystery(false)
      onStatus('Review the restore summary below, then confirm.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed.')
    }
  }

  const clearPending = () => {
    setPending(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const toggleCategory = (id: string) => {
    if (!pending) return
    const updated = pending.categories.map((c) => c.id === id ? { ...c, selected: !c.selected } : c)
    setPending({ ...pending, categories: updated })
  }

  const handleRestore = () => {
    if (!pending) return
    const selected = pending.categories.filter(c => c.selected).map(c => c.id)
    if (selected.length === 0) { onStatus('Select at least one category to restore.'); return }

    // Use the store adapter to apply directly to Zustand stores
    const result = restoreBackupToStores({
      packet: pending.payload,
      selectedCategories: selected,
      replaceTimerRuntime,
      replaceActiveMystery,
    })

    if (result.success) {
      onStatus(`Restored ${selected.length} category/categories. Undo is available for the most recent restore.`)
    } else {
      onStatus(`Restore completed with ${result.errors.length} error(s): ${result.errors.join('; ')}`)
    }
    clearPending()
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-slate-500">
        Restore from a full backup JSON file.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
      />

      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-3">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-300">Error</h3>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-rose-200/80">{error}</pre>
        </div>
      )}

      {pending && (
        <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-950/20 p-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
            Restore Preview
          </h3>

          <div className="space-y-1">
            {pending.categories.filter(c => c.present).map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2 py-1.5 cursor-pointer hover:bg-slate-950/80">
                <input
                  type="checkbox"
                  checked={cat.selected}
                  onChange={() => toggleCategory(cat.id)}
                  className={`w-3 h-3 rounded border-slate-700 bg-slate-800 focus:ring-cyan-500 ${cat.highRisk ? 'text-amber-500' : 'text-cyan-500'}`}
                />
                <span className={`text-[10px] ${cat.highRisk ? 'text-amber-300/80' : 'text-slate-300'}`}>
                  {cat.label}
                </span>
              </label>
            ))}
          </div>

          {pending.activeTimers.length > 0 && (
            <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2 py-1.5 cursor-pointer hover:bg-slate-950/80">
              <input
                type="checkbox"
                checked={replaceTimerRuntime}
                onChange={() => setReplaceTimerRuntime(!replaceTimerRuntime)}
                className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-[10px] text-rose-300/80">
                Replace active timer runtime on: {pending.activeTimers.join(', ')}
              </span>
            </label>
          )}

          {pending.activeMystery.length > 0 && (
            <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2 py-1.5 cursor-pointer hover:bg-slate-950/80">
              <input
                type="checkbox"
                checked={replaceActiveMystery}
                onChange={() => setReplaceActiveMystery(!replaceActiveMystery)}
                className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-[10px] text-rose-300/80">
                Replace active Mystery session on: {pending.activeMystery.join(', ')}
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleRestore}
              className="rounded-lg border border-amber-300/50 bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Restore Selected
            </button>
            <button
              type="button"
              onClick={clearPending}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <UndoSection onStatus={onStatus} />
    </div>
  )
}

// ── Undo Section ──────────────────────────────────────────────────────

function UndoSection({ onStatus }: { onStatus: (s: string) => void }) {
  const slot = getUndoSlot()

  const handleUndo = () => {
    const result = applyUndo()
    if (result.restored.length > 0) {
      onStatus(`Undo restored ${result.restored.join(', ')}.`)
    }
    if (result.errors.length > 0) {
      onStatus(`Undo errors: ${result.errors.join('; ')}`)
    }
  }

  if (!slot) return null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Undo Available</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">{slot.label} ({slot.categories.length} categories)</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-lg border border-amber-500/60 bg-amber-950/60 px-2.5 py-1 text-[10px] font-bold text-amber-200 transition hover:bg-amber-900/70"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => { clearUndoSlot(); onStatus('Undo snapshot cleared.') }}
            className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-200 transition hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Result Tab ────────────────────────────────────────────────────────

function ResultTab({ status, showDetail, onShowDetail }: { status: string; showDetail: boolean; onShowDetail: (v: boolean) => void }) {
  return (
    <div className="space-y-2">
      {status ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
          <p className="text-[10px] leading-relaxed text-slate-300">{status}</p>
        </div>
      ) : (
        <p className="text-[10px] text-slate-500 italic">No recent operations.</p>
      )}

      <button
        type="button"
        onClick={() => onShowDetail(!showDetail)}
        className="text-[10px] text-slate-500 hover:text-slate-300 underline"
      >
        {showDetail ? 'Hide' : 'Show'} technical details
      </button>

      {showDetail && <StorageDetail />}
    </div>
  )
}

// ── Storage Detail ────────────────────────────────────────────────────

function StorageDetail() {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const storageEntries: { key: string; bytes: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const val = localStorage.getItem(key)
      if (val) storageEntries.push({ key, bytes: val.length })
    }
  }

  return (
    <div className="space-y-1 rounded-xl border border-slate-700 bg-slate-950/30 p-2">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Local Storage</h4>
      {storageEntries.length === 0 ? (
        <p className="text-[10px] text-slate-600">No local storage entries found.</p>
      ) : (
        storageEntries.map((entry) => (
          <div key={entry.key} className="flex justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[200px]">{entry.key}</span>
            <span>{formatBytes(entry.bytes)}</span>
          </div>
        ))
      )}
      <p className="text-[10px] text-slate-600 pt-1">
        All data is stored locally in your browser. No network transfers occur.
      </p>
    </div>
  )
}
