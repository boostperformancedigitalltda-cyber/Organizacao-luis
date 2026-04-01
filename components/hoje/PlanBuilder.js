'use client'

import { useState } from 'react'
import { TASK_CATEGORIES, CATEGORY_COLORS, getSuggestions } from '@/lib/planner'

const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1h',     value: 60 },
  { label: '1h30',   value: 90 },
  { label: '2h',     value: 120 },
  { label: '3h',     value: 180 },
]

function TaskRow({ task, onRemove, onChange }) {
  const cat = TASK_CATEGORIES.find((c) => c.id === task.category)
  const colors = cat ? CATEGORY_COLORS[cat.color] : CATEGORY_COLORS.purple

  return (
    <div className={`rounded-2xl border p-3 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{task.icon}</span>
        <input
          value={task.label}
          onChange={(e) => onChange(task.uid, 'label', e.target.value)}
          className={`flex-1 bg-transparent font-semibold text-sm focus:outline-none ${colors.text} placeholder-current/50`}
          placeholder="Nome da tarefa"
        />
        <button
          onClick={() => onRemove(task.uid)}
          className="text-slate-400 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Time */}
        <input
          type="time"
          value={task.time || ''}
          onChange={(e) => onChange(task.uid, 'time', e.target.value)}
          className={`text-xs bg-white/70 border ${colors.border} rounded-lg px-2 py-1.5 focus:outline-none ${colors.text} font-medium`}
        />

        {/* Duration */}
        <select
          value={task.duration || ''}
          onChange={(e) => onChange(task.uid, 'duration', e.target.value ? parseInt(e.target.value) : null)}
          className={`text-xs bg-white/70 border ${colors.border} rounded-lg px-2 py-1.5 focus:outline-none ${colors.text} font-medium`}
        >
          <option value="">Duração</option>
          {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {/* Category */}
        <select
          value={task.category || ''}
          onChange={(e) => onChange(task.uid, 'category', e.target.value)}
          className={`text-xs bg-white/70 border ${colors.border} rounded-lg px-2 py-1.5 focus:outline-none ${colors.text} font-medium`}
        >
          {TASK_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <input
        value={task.note || ''}
        onChange={(e) => onChange(task.uid, 'note', e.target.value)}
        placeholder="Nota opcional..."
        className="mt-2 w-full bg-white/50 text-xs text-slate-500 rounded-lg px-3 py-1.5 focus:outline-none border border-transparent focus:border-slate-200 placeholder-slate-400"
      />
    </div>
  )
}

export default function PlanBuilder({ date, onStart }) {
  const [tasks, setTasks] = useState(() => getSuggestions(date))

  const addTask = () => {
    const uid = `custom-${Date.now()}`
    setTasks((prev) => [...prev, {
      uid, id: uid, label: '', icon: '✅', category: 'pessoal',
      time: '', duration: null, note: '',
    }])
  }

  const removeTask = (uid) => setTasks((prev) => prev.filter((t) => t.uid !== uid))

  const changeTask = (uid, field, value) => {
    setTasks((prev) => prev.map((t) => {
      if (t.uid !== uid) return t
      const updated = { ...t, [field]: value }
      // Auto-update icon when category changes
      if (field === 'category') {
        const cat = TASK_CATEGORIES.find((c) => c.id === value)
        if (cat) updated.icon = cat.icon
      }
      return updated
    }))
  }

  return (
    <div className="animate-slideUp">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink">Planeje seu dia</h2>
        <p className="text-ink-muted text-sm mt-1">
          Ajuste as tarefas sugeridas ou adicione as suas
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        {tasks.map((task) => (
          <TaskRow
            key={task.uid}
            task={task}
            onRemove={removeTask}
            onChange={changeTask}
          />
        ))}
      </div>

      <button
        onClick={addTask}
        className="w-full border-2 border-dashed border-surface-300 rounded-2xl py-3.5 text-sm font-semibold text-ink-subtle hover:border-brand-300 hover:text-brand-500 transition-colors mb-4"
      >
        + Adicionar tarefa
      </button>

      <button
        onClick={() => onStart(tasks.filter((t) => t.label.trim()))}
        disabled={tasks.filter((t) => t.label.trim()).length === 0}
        className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-card-md disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Começar o dia →
      </button>
    </div>
  )
}
