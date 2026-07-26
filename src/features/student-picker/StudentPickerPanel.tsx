import { useMemo, useState } from 'react'
import type { ClassGroup, ReadingSection } from '../roster/types'
import { getAvailableReadingSections } from './fairnessEngine'
import { resolvePickerContext } from './pickerContext'
import { usePickerStore } from './pickerStore'
import type { PickerClassId } from './types'
import { CoachingTab } from './components/CoachingTab'
import { HistoryTab } from './components/HistoryTab'
import { MysteryStarTab } from './components/MysteryStarTab'
import { QuickPickerTab } from './components/QuickPickerTab'
import { RosterTab } from './components/RosterTab'
import { SettingsTab } from './components/SettingsTab'

interface StudentPickerPanelProps {
  activeScreen: string
  initialTab?: 'quick' | 'mystery' | 'roster' | 'look-fors' | 'history' | 'settings'
  title?: string
}

const CLASS_OPTIONS: Array<{ id: ClassGroup; label: string }> = [
  { id: 'homeroom', label: 'Homeroom' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
]

export function StudentPickerPanel({
  activeScreen,
  initialTab = 'mystery',
  title = 'Mystery Star & Picker',
}: StudentPickerPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'quick' | 'mystery' | 'roster' | 'look-fors' | 'history' | 'settings'
  >(initialTab)
  const [selectedClass, setSelectedClass] = useState<ClassGroup>(() =>
    ['homeroom', 'math', 'reading'].includes(activeScreen)
      ? (activeScreen as ClassGroup)
      : 'homeroom',
  )
  const [readingSection, setReadingSection] = useState<ReadingSection | undefined>(undefined)

  const students = usePickerStore((s) => s.students)
  const importedMeta = usePickerStore((s) => s.importedRosterMeta)

  const availableSections = useMemo(
    () => getAvailableReadingSections(students),
    [students],
  )

  const effectiveSection = selectedClass === 'reading'
    ? (readingSection ?? availableSections[0])
    : undefined

  const context = resolvePickerContext(selectedClass, effectiveSection)
  const currentClassId = selectedClass as PickerClassId

  return (
    <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-400">
          {title}
        </h2>
        <span className="text-xs text-slate-400 capitalize">{context.poolKey.replace(':', ' ')}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CLASS_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelectedClass(option.id)}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
              selectedClass === option.id
                ? 'border border-purple-500/50 bg-purple-500/20 text-purple-200'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selectedClass === 'reading' && availableSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reading Section
          </span>
          {availableSections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setReadingSection(section)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                effectiveSection === section
                  ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      {importedMeta && (
        <p className="text-[10px] text-slate-500">
          Roster imported {new Date(importedMeta.importedAt).toLocaleDateString()}
          {importedMeta.schoolYear ? ` · ${importedMeta.schoolYear}` : ''}
        </p>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-700 pb-2">
        {(['quick', 'mystery', 'roster', 'look-fors', 'history', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'quick' && (
          <QuickPickerTab classId={currentClassId} poolKey={context.poolKey} />
        )}
        {activeTab === 'mystery' && (
          <MysteryStarTab
            classId={currentClassId}
            poolKey={context.poolKey}
            readingSection={effectiveSection}
          />
        )}
        {activeTab === 'roster' && (
          <RosterTab classId={currentClassId} poolKey={context.poolKey} readingSection={effectiveSection} />
        )}
        {activeTab === 'look-fors' && <CoachingTab />}
        {activeTab === 'history' && <HistoryTab poolKey={context.poolKey} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </section>
  )
}
