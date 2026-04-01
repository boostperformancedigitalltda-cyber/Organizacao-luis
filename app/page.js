'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import MorningModal from '@/components/hoje/MorningModal'
import DayTimeline from '@/components/hoje/DayTimeline'
import WeekPlanner from '@/components/semana/WeekPlanner'
import MonthView from '@/components/mes/MonthView'
import GoalsView from '@/components/metas/GoalsView'
import FinanceTab from '@/components/finance/FinanceTab'
import RoutineEditor from '@/components/rotina/RoutineEditor'
import { loadDayPlan, saveDayPlan } from '@/lib/planner'
import { dateKey } from '@/lib/date'

export default function Home() {
  const [tab, setTab] = useState('hoje')
  const [today] = useState(new Date())
  const [plan, setPlan] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const dk = dateKey(today)

  useEffect(() => {
    const savedPlan = loadDayPlan(dk)
    setPlan(savedPlan)
    setLoaded(true)
  }, []) // eslint-disable-line

  const handleMorningComplete = ({ energy, priorities, blocks }) => {
    const newPlan = {
      date: today.toISOString(),
      energy,
      priorities,
      blocks,
      completed: {},
      planned: true,
    }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleToggle = (uid) => {
    if (!plan) return
    const newCompleted = { ...plan.completed, [uid]: !plan.completed[uid] }
    const newPlan = { ...plan, completed: newCompleted }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleAddBlock = (block, isEdit) => {
    if (!plan) return
    let newBlocks
    if (isEdit) {
      newBlocks = plan.blocks.map((b) => b.uid === block.uid ? block : b)
    } else {
      newBlocks = [...plan.blocks, block]
    }
    const newPlan = { ...plan, blocks: newBlocks }
    setPlan(newPlan)
    saveDayPlan(dk, newPlan)
  }

  const handleReset = () => {
    setPlan(null)
    saveDayPlan(dk, null)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-indigo-500 text-sm font-semibold">Carregando...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Morning planning wizard — shows when no plan for today */}
      {tab === 'hoje' && !plan && (
        <MorningModal date={today} onComplete={handleMorningComplete} />
      )}

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {tab === 'hoje' && plan && (
          <DayTimeline
            plan={plan}
            onToggle={handleToggle}
            onAddBlock={handleAddBlock}
            onReset={handleReset}
          />
        )}
        {tab === 'semana' && <WeekPlanner />}
        {tab === 'mes'    && <MonthView />}
        {tab === 'metas'  && <GoalsView />}
        {tab === 'financas' && <FinanceTab />}
        {tab === 'rotina'   && <RoutineEditor />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}
