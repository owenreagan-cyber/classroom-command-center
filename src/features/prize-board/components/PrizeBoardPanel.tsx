import { useMemo, useState } from 'react'
import type { ClassGroup, ReadingSection } from '../../roster/types'
import { getAvailableReadingSections } from '../../student-picker/fairnessEngine'
import { usePickerStore } from '../../student-picker/pickerStore'
import { resolvePickerContext } from '../../student-picker/pickerContext'
import { getActivePrizes, getMysteryEligiblePrizes, getPrizeById, isMysteryBoxPrize } from '../prizeBank'
import { generateBoardForPool, usePrizeBoardStore } from '../prizeBoardStore'
import { PRIZE_BOARD_SIZE } from '../types'
import { RarityBadge } from './RarityBadge'
import { PrizeBoardGrid } from './PrizeBoardGrid'

const CLASS_OPTIONS: Array<{ id: ClassGroup; label: string }> = [
  { id: 'homeroom', label: 'Homeroom' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
]

export function PrizeBoardPanel() {
  const [selectedClass, setSelectedClass] = useState<ClassGroup>('homeroom')
  const [readingSection, setReadingSection] = useState<ReadingSection | undefined>(undefined)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [assignStudentId, setAssignStudentId] = useState('')

  const students = usePickerStore((s) => s.students)
  const prizeBank = usePrizeBoardStore((s) => s.prizeBank)
  const prizeOverrides = usePrizeBoardStore((s) => s.prizeOverrides)
  const boards = usePrizeBoardStore((s) => s.boards)
  const setPrizeActive = usePrizeBoardStore((s) => s.setPrizeActive)
  const resetBoard = usePrizeBoardStore((s) => s.resetBoard)
  const assignStudentToTile = usePrizeBoardStore((s) => s.assignStudentToTile)
  const revealTile = usePrizeBoardStore((s) => s.revealTile)
  const openMysteryBox = usePrizeBoardStore((s) => s.openMysteryBox)
  const clearTile = usePrizeBoardStore((s) => s.clearTile)

  const availableSections = useMemo(
    () => getAvailableReadingSections(students),
    [students],
  )

  const effectiveSection = selectedClass === 'reading'
    ? (readingSection ?? availableSections[0])
    : undefined

  const { poolKey } = resolvePickerContext(selectedClass, effectiveSection)
  const board = boards[poolKey]

  const poolStudents = useMemo(
    () => students.filter(
      (s) => s.isActive && !s.isAbsent && s.classes.includes(selectedClass)
        && (selectedClass !== 'reading' || !effectiveSection || s.section === effectiveSection),
    ),
    [students, selectedClass, effectiveSection],
  )

  const activePrizes = useMemo(
    () => getActivePrizes(prizeBank, prizeOverrides),
    [prizeBank, prizeOverrides],
  )

  const mysteryEligible = useMemo(
    () => getMysteryEligiblePrizes(prizeBank, prizeOverrides),
    [prizeBank, prizeOverrides],
  )

  const selectedTileData = selectedTile !== null ? board?.tiles[selectedTile] : undefined
  const selectedPrize = selectedTileData?.prizeId
    ? getPrizeById(selectedTileData.prizeId, prizeBank, prizeOverrides)
    : undefined

  const handleGenerate = () => {
    generateBoardForPool(
      poolKey,
      poolStudents.map((s) => ({ id: s.id, displayName: s.displayName })),
    )
    setSelectedTile(null)
  }

  const handleReset = () => {
    if (confirm('Clear this pool\'s prize board?')) {
      resetBoard(poolKey)
      setSelectedTile(null)
    }
  }

  const prizeTileCount = board?.tiles.filter((t) => t.kind === 'prize' || (t.kind === 'revealed' && t.prizeId)).length ?? 0
  const revealedCount = board?.tiles.filter((t) => t.kind === 'revealed').length ?? 0

  return (
    <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-4 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-400">
          Prize Board
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {PRIZE_BOARD_SIZE} tiles
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CLASS_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelectedClass(option.id)}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
              selectedClass === option.id
                ? 'border border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selectedClass === 'reading' && availableSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section</span>
          {availableSections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setReadingSection(section)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                effectiveSection === section
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500"
        >
          Generate Board
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!board}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Reset Board
        </button>
      </div>

      {board ? (
        <>
          <p className="text-[11px] text-slate-400">
            {prizeTileCount} prize tiles · {revealedCount} revealed · pool: {poolKey}
          </p>
          <PrizeBoardGrid
            tiles={board.tiles}
            prizeBank={prizeBank}
            prizeOverrides={prizeOverrides}
            selectedTile={selectedTile}
            onSelectTile={setSelectedTile}
          />

          {selectedTileData && (
            <div className="space-y-2 rounded-xl border border-slate-600 bg-slate-900/80 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tile #{selectedTile! + 1}
              </p>
              {selectedTileData.studentDisplayName && (
                <p className="text-sm font-semibold text-cyan-200">
                  {selectedTileData.studentDisplayName}
                </p>
              )}
              {selectedPrize && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">{selectedPrize.label}</span>
                  <RarityBadge rarity={selectedPrize.rarity} />
                </div>
              )}
              {selectedTileData.revealedPrizeId && (
                <p className="text-xs text-emerald-300">
                  Opened: {getPrizeById(selectedTileData.revealedPrizeId, prizeBank, prizeOverrides)?.label}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {(selectedTileData.kind === 'prize' || selectedTileData.kind === 'student') && (
                  <button
                    type="button"
                    onClick={() => revealTile(poolKey, selectedTile!)}
                    className="rounded-md bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    Reveal
                  </button>
                )}
                {selectedTileData.prizeId && isMysteryBoxPrize(selectedTileData.prizeId)
                  && selectedTileData.kind !== 'revealed' && (
                  <MysteryBoxOpenButtons
                    eligible={mysteryEligible}
                    onOpen={(id) => openMysteryBox(poolKey, selectedTile!, id)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => clearTile(poolKey, selectedTile!)}
                  className="rounded-md border border-slate-600 px-2 py-1 text-[10px] font-bold text-slate-400"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">Assign student…</option>
                  {poolStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.displayName}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!assignStudentId}
                  onClick={() => {
                    const student = poolStudents.find((s) => s.id === assignStudentId)
                    if (student) {
                      assignStudentToTile(poolKey, selectedTile!, student.id, student.displayName)
                      setAssignStudentId('')
                    }
                  }}
                  className="rounded-md bg-cyan-800 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-40"
                >
                  Assign
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-600 px-3 py-4 text-center text-xs text-slate-500">
          No board for this pool yet. Generate a fresh 100-tile board.
        </p>
      )}

      <details className="group">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-400">
          Prize Settings ({activePrizes.length} active)
        </summary>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {prizeBank.map((prize) => {
            const effective = getPrizeById(prize.id, prizeBank, prizeOverrides)!
            return (
              <li
                key={prize.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/60 px-2 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-semibold ${effective.active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                    {prize.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <RarityBadge rarity={prize.rarity} compact />
                    {prize.mysteryBoxEligible && (
                      <span className="text-[9px] font-bold uppercase text-purple-400">Mystery</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrizeActive(prize.id, !effective.active)}
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                    effective.active
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {effective.active ? 'On' : 'Off'}
                </button>
              </li>
            )
          })}
        </ul>
      </details>
    </section>
  )
}

function MysteryBoxOpenButtons({
  eligible,
  onOpen,
}: {
  eligible: ReturnType<typeof getMysteryEligiblePrizes>
  onOpen: (prizeId: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-purple-700 px-2 py-1 text-[10px] font-bold text-white"
      >
        Open Mystery Box
      </button>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {eligible.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => { onOpen(p.id); setOpen(false) }}
          className="rounded-md border border-purple-500/40 bg-purple-950/50 px-2 py-1 text-[10px] text-purple-200"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
