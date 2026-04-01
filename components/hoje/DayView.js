'use client'

import { useState } from 'react'
import TaskCard from './TaskCard'
import LogSessionModal from './LogSessionModal'
import { calcProgress } from '@/lib/planner'
import { formatFull } from '@/lib/date'

export default function DayView({ date, tasks, completed, streak, onToggle, onReset, onLogSession }) {
  const [loggingTask, setLoggingTask] = useState(null)
  const { count, total, pct } = calcProgress(tasks, completed)
  const allDone = total > 0 && count === total

  return (
    <div className="animate-slideUp space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">
            {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-ink mt-0.5">Hoje</h1>
          <p className="text-ink-subtle text-sm mt-0.5">
            {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        {/* Streak badge */}
        <div className="flex flex-col items-center bg-white border border-surface-200 rounded-2xl px-4 py-2.5 shadow-card">
          <span className="text-2xl">{streak === 0 ? '🌱' : streak < 7 ? '🔥' : streak < 30 ? '⚡' : '💎'}</span>
          <span className="text-xs font-bold text-ink mt-0.5">{streak} dias</span>
        </div>
      </div>

      {/* Progress card */}
      <div className={`rounded-2xl p-4 border transition-all duration-500 shadow-card
        ${allDone
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-surface-200'
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-ink-muted">Progresso do dia</span>
          <span className="text-sm font-bold text-ink">{count}/{total} tarefas</span>
        </div>
        <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${allDone ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className={`text-3xl font-bold ${allDone ? 'text-emerald-600' : 'text-ink'}`}>
            {pct}%
          </span>
          {allDone && (
            <span className="text-emerald-600 text-sm font-bold">Dia completo! 🎉</span>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-ink-subtle uppercase tracking-widest px-1">
          Tarefas ({total})
        </p>
        {tasks.map((task) => (
          <TaskCard
            key={task.uid}
            task={task}
            completed={!!completed[task.uid]}
            onToggle={onToggle}
            onLogSession={(t) => setLoggingTask(t)}
          />
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-4 text-xs text-ink-faint hover:text-ink-subtle transition-colors font-medium"
      >
        ↺ Resetar dia e replanejar
      </button>

      {loggingTask && (
        <LogSessionModal
          task={loggingTask}
          onSave={(data) => { onLogSession(data); setLoggingTask(null) }}
          onClose={() => setLoggingTask(null)}
        />
      )}
    </div>
  )
}
