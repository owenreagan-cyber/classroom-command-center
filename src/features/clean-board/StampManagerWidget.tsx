import { useMemo, useState } from 'react'
import { useStampStore } from '../../store/stampStore'
import { STAMP_MILESTONE_TIERS } from '../../store/stampLogic'
import type { StampAddAmount, StampMilestoneTier } from '../../store/stampLogic'

const ADD_AMOUNTS: StampAddAmount[] = [1, 5, 10]

function slugifyStudentId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || `student-${Date.now()}`
}

const nameInputCls =
  'min-h-[44px] min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'
const addStudentBtn =
  'min-h-[44px] min-w-[44px] rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40'
const tileBase =
  'min-h-[44px] min-w-[44px] rounded-md border px-3 py-2 text-left text-xs font-semibold transition'
const tileIdle = 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
const tileActive = 'border-cyan-500 bg-cyan-900/40 text-cyan-100'
const addAmountBtn =
  'min-h-[44px] min-w-[44px] rounded-md border border-emerald-600/60 bg-emerald-900/40 px-3 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-40'
const tierBtn =
  'min-h-[44px] rounded-md border border-amber-500/60 bg-amber-900/30 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40'
const castBtn =
  'min-h-[44px] rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
const castBtnIdle = 'border-cyan-600/60 bg-cyan-900/30 text-cyan-200 hover:bg-cyan-900/50'
const castBtnActive = 'border-cyan-400 bg-cyan-800/60 text-cyan-50'

interface StampManagerWidgetProps {
  fullWidth?: boolean
}

/**
 * DB-Dock — Stamp Manager. Lives only inside the Teacher Dock on /board-lab;
 * never rendered on /display. Keeps its own lightweight local roster (name +
 * stamp record) rather than reaching into the legacy /control roster import
 * system, since that carries real student PII this feature doesn't need.
 *
 * Phase 4: milestone sound now plays from `/display` itself (via
 * `ProjectedStampCard`, wired to `redeemMilestone`'s redemption broadcast),
 * not from this teacher-facing panel — the classroom hears it through the
 * projector, not the teacher's laptop. "Cast to Display" is the only thing
 * that writes `activeProjection`; nothing else here does.
 */
export function StampManagerWidget({ fullWidth = false }: StampManagerWidgetProps) {
  const students = useStampStore((s) => s.students)
  const addStudent = useStampStore((s) => s.addStudent)
  const addStamps = useStampStore((s) => s.addStamps)
  const redeemMilestone = useStampStore((s) => s.redeemMilestone)
  const activeProjection = useStampStore((s) => s.activeProjection)
  const setActiveProjection = useStampStore((s) => s.setActiveProjection)

  const roster = useMemo(
    () => Object.values(students).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [students],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const selected = roster.find((r) => r.studentId === selectedId) ?? null

  const handleAddStudent = () => {
    const name = nameInput.trim()
    if (!name) return
    const studentId = slugifyStudentId(name)
    addStudent(studentId, name)
    setSelectedId(studentId)
    setNameInput('')
  }

  const handleAddStamps = (amount: StampAddAmount) => {
    if (!selected) return
    addStamps(selected.studentId, amount)
    setStatus(null)
  }

  const handleRedeem = (tier: StampMilestoneTier) => {
    if (!selected) return
    const result = redeemMilestone(selected.studentId, tier)
    if (!result.ok) {
      setStatus(
        result.error === 'already-redeemed'
          ? `${selected.displayName} already redeemed the ${tier}-stamp milestone.`
          : `${selected.displayName} needs ${tier} stamps to redeem this milestone.`,
      )
      return
    }
    setStatus(`${selected.displayName} redeemed the ${tier}-stamp milestone!`)
  }

  const handleCastToDisplay = () => {
    if (!selected) return
    setActiveProjection({ studentId: selected.studentId, displayName: selected.displayName })
  }

  const handleStopCasting = () => setActiveProjection(null)

  return (
    <div
      className={`flex flex-col gap-4 p-3 ${fullWidth ? 'w-full' : 'w-80 shrink-0'}`}
      data-stamp-manager-widget
    >
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Add Student
        </h3>
        <div className="mt-2 flex gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddStudent()
            }}
            placeholder="Student name"
            className={nameInputCls}
            data-stamp-name-input
          />
          <button
            type="button"
            onClick={handleAddStudent}
            disabled={!nameInput.trim()}
            className={addStudentBtn}
            data-stamp-add-student
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Students</h3>
        {roster.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No students yet — add one above.</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2" data-stamp-student-grid>
            {roster.map((r) => (
              <button
                key={r.studentId}
                type="button"
                onClick={() => setSelectedId(r.studentId)}
                data-stamp-student-tile={r.studentId}
                data-active={r.studentId === selectedId || undefined}
                className={`${tileBase} ${r.studentId === selectedId ? tileActive : tileIdle}`}
              >
                <span className="block truncate">{r.displayName}</span>
                <span className="block text-[10px] font-normal text-slate-400">
                  {r.balance}/100
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Projector
            </h3>
            <div className="mt-2 flex items-center gap-2">
              {activeProjection?.studentId === selected.studentId ? (
                <>
                  <span className={`${castBtn} ${castBtnActive} flex-1 text-center`} data-stamp-cast-active>
                    📽️ Casting {selected.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={handleStopCasting}
                    className={`${castBtn} ${castBtnIdle} min-w-[44px]`}
                    data-stamp-stop-cast
                    title="Stop casting"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCastToDisplay}
                  className={`${castBtn} ${castBtnIdle} flex-1`}
                  data-stamp-cast-to-display
                >
                  📽️ Cast to Display
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Add Stamps — {selected.displayName}
            </h3>
            <div className="mt-2 flex gap-2">
              {ADD_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAddStamps(amount)}
                  disabled={selected.balance >= 100}
                  className={addAmountBtn}
                  data-stamp-add-amount={amount}
                >
                  +{amount}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cash Out Milestone
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STAMP_MILESTONE_TIERS.map((tier) => {
                const alreadyRedeemed = selected.redeemedMilestones.includes(tier)
                const eligible = selected.balance >= tier && !alreadyRedeemed
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handleRedeem(tier)}
                    disabled={!eligible}
                    className={tierBtn}
                    data-stamp-tier-button={tier}
                  >
                    {alreadyRedeemed ? `✓ ${tier}` : `${tier} stamps`}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {status && (
        <p className="text-xs font-medium text-cyan-300" data-stamp-status role="status">
          {status}
        </p>
      )}
    </div>
  )
}

export default StampManagerWidget
