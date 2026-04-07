'use client'

import { useState, useEffect } from 'react'
import {
  loadHabits, saveHabits, loadHabitLogs, saveHabitLogs,
  addHabit, removeHabit, toggleHabitDay, getHeatmapData,
} from '@/lib/habits'
import { dateKey } from '@/lib/date'
import HabitCard from './HabitCard'
import AddHabitModal from './AddHabitModal'

const PACK_MEDICINA = [
  { title: 'Questões do dia', icon: '📝', color: '#6366f1', frequency: 'daily' },
  { title: 'Revisão (Anki/flashcards)', icon: '🔁', color: '#8b5cf6', frequency: 'daily' },
  { title: 'Sono 7h+', icon: '😴', color: '#06b6d4', frequency: 'daily' },
  { title: 'Exercício físico', icon: '💪', color: '#10b981', frequency: 'daily' },
  { title: 'Hidratação (2L)', icon: '💧', color: '#0ea5e9', frequency: 'daily' },
  { title: 'Leitura científica', icon: '📖', color: '#f59e0b', frequency: 'daily' },
]

export default function HabitsView() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState({})
  const [addOpen, setAddOpen] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState(null)

  useEffect(() => {
    setHabits(loadHabits())
    setLogs(loadHabitLogs())
  }, [])

  const handleAdd = (data) => {
    const updated = addHabit(habits, data)
    setHabits(updated)
  }

  const handleToggle = (habitId, dk) => {
    const updated = toggleHabitDay(logs, habitId, dk)
    setLogs(updated)
  }

  const handleRemove = (habitId) => {
    const { habits: h, logs: l } = removeHabit(habits, logs, habitId)
    setHabits(h)
    setLogs(l)
    if (selectedHabit === habitId) setSelectedHabit(null)
  }

  // Heatmap for first habit or selected
  const heatmapHabitId = selectedHabit || habits[0]?.id
  const heatmapHabit = habits.find((h) => h.id === heatmapHabitId)
  const heatmapData = heatmapHabitId ? getHeatmapData(logs, heatmapHabitId) : []

  // Total done today
  const todayDk = dateKey(new Date())
  const doneToday = habits.filter((h) => (logs[h.id] || []).includes(todayDk)).length

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hábitos</h1>
          <p className="text-sm text-slate-500">{doneToday}/{habits.length} concluídos hoje</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          + Novo
        </button>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center mb-4">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-slate-500 font-medium">Nenhum hábito criado ainda</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Comece pequeno, seja consistente!</p>
          <button
            onClick={() => {
              let updated = habits
              PACK_MEDICINA.forEach((h) => { updated = addHabit(updated, h) })
              setHabits(updated)
            }}
            className="w-full py-3 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors mb-3"
          >
            ⚡ Carregar pack de medicina (6 hábitos)
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            + Criar manualmente
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {habits.map((habit) => (
            <div key={habit.id} onClick={() => setSelectedHabit(habit.id === selectedHabit ? null : habit.id)}>
              <HabitCard
                habit={habit}
                logs={logs}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            </div>
          ))}
        </div>
      )}

      {/* 30-day heatmap */}
      {heatmapHabit && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{heatmapHabit.icon}</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {heatmapHabit.title} — últimos 30 dias
            </p>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {heatmapData.map((d, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm transition-all"
                style={{
                  backgroundColor: d.done ? heatmapHabit.color : '#f1f5f9',
                  opacity: d.done ? 1 : 0.6,
                }}
                title={d.date}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[10px] text-slate-300">Menos</span>
            {[0.2, 0.5, 0.8, 1].map((op, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: heatmapHabit.color, opacity: op }}
              />
            ))}
            <span className="text-[10px] text-slate-300">Mais</span>
          </div>
        </div>
      )}

      <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
    </div>
  )
}
