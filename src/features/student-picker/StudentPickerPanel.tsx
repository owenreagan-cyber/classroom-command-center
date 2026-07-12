import { useState } from 'react'
import type { PickerClassId } from './types'
import { RosterTab } from './components/RosterTab'
import { QuickPickerTab } from './components/QuickPickerTab'
import { MysteryStarTab } from './components/MysteryStarTab'
import { CoachingTab } from './components/CoachingTab'
import { HistoryTab } from './components/HistoryTab'
import { SettingsTab } from './components/SettingsTab'

interface StudentPickerPanelProps {
  activeScreen: string
}

export function StudentPickerPanel({ activeScreen }: StudentPickerPanelProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'mystery' | 'roster' | 'look-fors' | 'history' | 'settings'>('quick')

  // Map activeScreen to a picker class id if possible
  const currentClassId: PickerClassId = ['homeroom', 'math', 'reading'].includes(activeScreen)
    ? activeScreen
    : 'homeroom' // fallback to homeroom for generic screens

  return (
    <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-400">
          Student Picker & Stars
        </h2>
        <span className="text-xs text-slate-400 capitalize">{currentClassId} Class</span>
      </div>

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
        {activeTab === 'quick' && <QuickPickerTab classId={currentClassId} />}
        {activeTab === 'mystery' && <MysteryStarTab classId={currentClassId} />}
        {activeTab === 'roster' && <RosterTab classId={currentClassId} />}
        {activeTab === 'look-fors' && <CoachingTab />}
        {activeTab === 'history' && <HistoryTab classId={currentClassId} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </section>
  )
}
