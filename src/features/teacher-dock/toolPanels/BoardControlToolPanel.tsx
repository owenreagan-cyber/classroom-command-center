import { memo } from 'react'
import { BACKGROUND_ASSETS } from '../../../data/backgroundAssets'
import { SCREEN_META } from '../../../data/defaults'
import { BoardBackupPanel } from '../../../board/BoardBackupPanel'
import { BoardPresetPanel } from '../../../board/BoardPresetPanel'
import { CardVisibilityPanel } from '../../../board/CardVisibilityPanel'
import { LocalPacketPanel } from '../../local-packets/LocalPacketPanel'
import { TeacherNotesPanel } from '../../../board/TeacherNotesPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

function DockButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-left text-base font-semibold transition ${
        active
          ? 'bg-cyan-500 text-slate-950'
          : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

export const BoardControlToolPanel = memo(function BoardControlToolPanel() {
  const {
    mode,
    activeScreen,
    backgroundId,
    teacherNotes,
    boardState,
    cardVisibility,
    canUndoBeautify,
    onModeChange,
    onScreenChange,
    onBackgroundChange,
    onApplyPreset,
    onSaveCustomPreset,
    onApplyCustomPreset,
    onDeleteCustomPreset,
    onCardVisibleChange,
    onBeautify,
    onUndoBeautify,
    onReset,
    timerSimpleTimers,
    timerPhaseTimer,
    pickerStudents,
    pickerHistoryEntries,
    pickerCoachingConfig,
    pickerSettings,
    pickerActiveMysterySessions,
  } = useTeacherDockContext()

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-bold text-white">Board Control</h2>
        <p className="mt-1 text-sm text-slate-400">
          Screens, background, presets, backup, and board maintenance.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</h3>
        <div className="grid grid-cols-2 gap-2">
          <DockButton active={mode === 'edit'} onClick={() => onModeChange('edit')} label="Edit" />
          <DockButton
            active={false}
            onClick={() => onModeChange('display')}
            label="Display"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Screens</h3>
        <nav className="flex flex-col gap-2" aria-label="Screen navigation">
          {SCREEN_META.map((screen) => (
            <DockButton
              key={screen.id}
              active={activeScreen === screen.id}
              onClick={() => onScreenChange(screen.id)}
              label={screen.navLabel ?? screen.label}
            />
          ))}
        </nav>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Background
        </h3>
        <div className="flex flex-col gap-2">
          {BACKGROUND_ASSETS.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onBackgroundChange(asset.id)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                backgroundId === asset.id
                  ? 'border-cyan-400 bg-slate-800 text-white'
                  : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-lg border border-white/30"
                style={{ background: asset.fallbackGradient }}
                aria-hidden="true"
              />
              <span>
                <span className="block">{asset.label}</span>
                <span className="block text-xs text-slate-400">{asset.mood}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <BoardPresetPanel
        activeScreen={activeScreen}
        customPresets={boardState.customPresets}
        onApplyPreset={onApplyPreset}
        onSaveCustomPreset={onSaveCustomPreset}
        onApplyCustomPreset={onApplyCustomPreset}
        onDeleteCustomPreset={onDeleteCustomPreset}
      />

      <LocalPacketPanel
        boardContents={boardState.contents as unknown as Record<string, unknown>}
        boardActiveScreen={boardState.activeScreen}
        boardActivePageId={boardState.activePageId}
        boardTodayPrep={boardState.todayPrep}
        boardMorningMessage={boardState.morningMessage}
        boardMode={boardState.mode}
        boardBackgroundId={boardState.backgroundId}
        boardTeacherNotes={boardState.teacherNotes}
        boardCardVisibility={boardState.cardVisibility}
        boardCustomPresets={boardState.customPresets}
        boardNoiseTrackers={boardState.noiseTrackers}
        boardClassWorkspaces={boardState.classWorkspaces as unknown as Record<string, unknown>}
        timerSimpleTimers={timerSimpleTimers}
        timerPhaseTimer={timerPhaseTimer}
        pickerStudents={pickerStudents.filter((s) => s.isActive)}
        pickerArchivedStudents={pickerStudents.filter((s) => !s.isActive)}
        pickerHistory={pickerHistoryEntries}
        pickerCoachingConfig={pickerCoachingConfig}
        pickerSettings={pickerSettings}
        pickerActiveMysterySessions={pickerActiveMysterySessions}
      />

      <BoardBackupPanel boardState={boardState} />

      <CardVisibilityPanel
        activeScreen={activeScreen}
        cardVisibility={cardVisibility}
        onCardVisibleChange={onCardVisibleChange}
      />

      <TeacherNotesPanel mode={mode} activeScreen={activeScreen} notes={teacherNotes} />

      <section className="space-y-2">
        <button
          type="button"
          onClick={onBeautify}
          className="w-full rounded-xl border border-cyan-400/50 bg-cyan-950/40 px-3 py-3 text-base font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
        >
          Beautify active screen
        </button>
        {canUndoBeautify && (
          <button
            type="button"
            onClick={onUndoBeautify}
            className="w-full rounded-xl border border-amber-400/50 bg-amber-950/40 px-3 py-3 text-base font-semibold text-amber-100 transition hover:bg-amber-900/50"
          >
            Undo Beautify
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-rose-400/60 bg-rose-950/40 px-3 py-3 text-base font-semibold text-rose-100 transition hover:bg-rose-900/50"
        >
          Reset to defaults
        </button>
      </section>
    </div>
  )
})
